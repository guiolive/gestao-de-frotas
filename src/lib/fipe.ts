/**
 * Wrapper da API FIPE pública (parallelum.com.br/fipe).
 *
 * Gratuita, sem auth, mas rate-limited. Por isso fazemos cache local do valor
 * em `Veiculo.valorFipe` e só chamamos na criação/edição ou 1x/mês.
 *
 * Resolução:
 *   1. Mapeia `Veiculo.tipo` -> categoria FIPE (carros/motos/caminhoes).
 *   2. Lista marcas e tenta casar `veiculo.marca` por nome (case-insensitive,
 *      acentos removidos).
 *   3. Lista modelos da marca e casa `veiculo.modelo` de forma "contains".
 *   4. Lista anos do modelo e casa pelo `veiculo.ano` no início do código
 *      (formato FIPE: "2020-1" = 2020 gasolina, "2020-3" = diesel, etc.).
 *   5. Retorna valor e código FIPE (`CodigoFipe`).
 */

const FIPE_BASE = "https://parallelum.com.br/fipe/api/v1";

type FipeCategoria = "carros" | "motos" | "caminhoes";

function tipoToCategoria(tipo: string): FipeCategoria {
  switch (tipo) {
    case "moto":
      return "motos";
    case "caminhao":
    case "onibus":
      return "caminhoes";
    case "carro":
    case "van":
    default:
      return "carros";
  }
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Timeout por chamada à FIPE. Como uma consulta completa faz 4 fetches
// sequenciais (marcas → modelos → anos → valor), o pior caso continua
// limitado a ~60s no total e não trava a request indefinidamente.
const FIPE_TIMEOUT_MS = 15_000;

async function fipeFetch<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${FIPE_BASE}${path}`, {
      // Sem cache do Next — fazemos cache próprio no banco.
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(FIPE_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new Error(`FIPE timeout (>${FIPE_TIMEOUT_MS / 1000}s) em ${path}`);
    }
    throw e instanceof Error ? e : new Error(`FIPE falha em ${path}`);
  }
  if (!res.ok) {
    throw new Error(`FIPE ${res.status} em ${path}`);
  }
  return res.json() as Promise<T>;
}

interface FipeMarca {
  codigo: string;
  nome: string;
}

interface FipeModelo {
  codigo: number;
  nome: string;
}

interface FipeModelosResp {
  modelos: FipeModelo[];
  anos: { codigo: string; nome: string }[];
}

interface FipeAno {
  codigo: string;
  nome: string;
}

interface FipeValor {
  Valor: string; // "R$ 45.123,00"
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  TipoVeiculo: number;
  SiglaCombustivel: string;
}

function parseValorBr(valor: string): number {
  // "R$ 45.123,00" -> 45123.00
  return Number(
    valor
      .replace(/[^0-9,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

export interface FipeLookupResult {
  valor: number;
  codigoFipe: string;
  marcaFipe: string;
  modeloFipe: string;
  anoFipe: number;
  combustivelFipe: string;
  mesReferencia: string;
}

export async function consultarFipe(input: {
  tipo: string; // veiculo.tipo
  marca: string;
  modelo: string;
  ano: number;
}): Promise<FipeLookupResult> {
  const categoria = tipoToCategoria(input.tipo);
  const marcaAlvo = normalize(input.marca);
  const modeloAlvo = normalize(input.modelo);

  // 1. Marca — match exato, depois "starts-with", depois "contains"
  const marcas = await fipeFetch<FipeMarca[]>(`/${categoria}/marcas`);
  const marca =
    marcas.find((m) => normalize(m.nome) === marcaAlvo) ||
    marcas.find((m) => normalize(m.nome).startsWith(marcaAlvo)) ||
    marcas.find((m) => normalize(m.nome).includes(marcaAlvo));
  if (!marca) {
    throw new Error(`Marca "${input.marca}" não encontrada na FIPE`);
  }

  // 2. Modelos candidatos — ordenados do match mais forte pro mais fraco.
  //    A FIPE tem múltiplos modelos com nomes parecidos (ex.: "Gol 1.0",
  //    "Gol 1.6", "Gol (novo) 1.0") — o certo é iterar até achar um com
  //    o ano pedido.
  const modelosResp = await fipeFetch<FipeModelosResp>(
    `/${categoria}/marcas/${marca.codigo}/modelos`
  );
  const candidatos = modelosResp.modelos
    .map((m) => ({ m, n: normalize(m.nome) }))
    .filter(
      ({ n }) =>
        n === modeloAlvo ||
        n.startsWith(`${modeloAlvo} `) ||
        n.startsWith(`${modeloAlvo}/`) ||
        n.startsWith(modeloAlvo) ||
        n.includes(modeloAlvo)
    )
    .sort((a, b) => {
      // Prioriza match exato, depois "começa com ", depois "contém"
      const score = (x: string) =>
        x === modeloAlvo ? 0 : x.startsWith(`${modeloAlvo} `) || x.startsWith(`${modeloAlvo}/`) ? 1 : x.startsWith(modeloAlvo) ? 2 : 3;
      return score(a.n) - score(b.n);
    })
    .map(({ m }) => m);

  if (candidatos.length === 0) {
    throw new Error(`Modelo "${input.modelo}" não encontrado na marca ${marca.nome}`);
  }

  // 3. Itera candidatos procurando ano desejado.
  const preferidos = [`${input.ano}-1`, `${input.ano}-3`, `${input.ano}-2`];
  let erroFinal: Error | null = null;
  for (const modelo of candidatos.slice(0, 10)) {
    try {
      const anos = await fipeFetch<FipeAno[]>(
        `/${categoria}/marcas/${marca.codigo}/modelos/${modelo.codigo}/anos`
      );
      let anoEscolhido = preferidos
        .map((p) => anos.find((a) => a.codigo === p))
        .find((a): a is FipeAno => !!a);
      if (!anoEscolhido) {
        anoEscolhido = anos.find((a) => a.codigo.startsWith(`${input.ano}-`));
      }
      if (!anoEscolhido) continue;

      const valor = await fipeFetch<FipeValor>(
        `/${categoria}/marcas/${marca.codigo}/modelos/${modelo.codigo}/anos/${anoEscolhido.codigo}`
      );
      return {
        valor: parseValorBr(valor.Valor),
        codigoFipe: valor.CodigoFipe,
        marcaFipe: valor.Marca,
        modeloFipe: valor.Modelo,
        anoFipe: valor.AnoModelo,
        combustivelFipe: valor.Combustivel,
        mesReferencia: valor.MesReferencia.trim(),
      };
    } catch (e) {
      erroFinal = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(
    `Ano ${input.ano} não encontrado para nenhum modelo "${input.modelo}" da ${marca.nome}` +
      (erroFinal ? ` (${erroFinal.message})` : "")
  );
}

/**
 * Threshold de antieconomicidade: custo de manutenção ≥ 40% do valor FIPE.
 * Informativo — não altera status do veículo automaticamente.
 */
export const THRESHOLD_ANTIECONOMICO_PCT = 40;

export function calcularIndicadoresFipe(input: {
  valorFipe: number | null;
  custoAcumulado: number;
  custo12m: number;
}) {
  const { valorFipe, custoAcumulado, custo12m } = input;
  if (!valorFipe || valorFipe <= 0) {
    return {
      pctAcumulado: null,
      pct12m: null,
      antieconomico: false,
      semReferencia: true,
    };
  }
  const pctAcumulado = (custoAcumulado / valorFipe) * 100;
  const pct12m = (custo12m / valorFipe) * 100;
  return {
    pctAcumulado,
    pct12m,
    antieconomico:
      pctAcumulado >= THRESHOLD_ANTIECONOMICO_PCT ||
      pct12m >= THRESHOLD_ANTIECONOMICO_PCT,
    semReferencia: false,
  };
}
