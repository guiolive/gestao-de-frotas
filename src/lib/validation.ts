import { z } from "zod";

/**
 * Helper to validate request body against a Zod schema.
 * Returns [data, null] on success or [null, errorResponse] on failure.
 *
 * Usage in a route handler:
 *   const [data, err] = await validateBody(request, veiculoCreateSchema);
 *   if (err) return err;
 *   // data is fully typed and validated
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<[T, null] | [null, Response]> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return [
      null,
      Response.json({ error: "JSON inválido no body da requisição." }, { status: 400 }),
    ];
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return [
      null,
      Response.json({ error: "Dados inválidos", issues }, { status: 400 }),
    ];
  }

  return [result.data, null];
}

// ─────────────────────────────────────────────────────────
// Schemas comuns
// ─────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

// Renavam: 9 a 11 dígitos (SENATRAN aceita ambos os formatos históricos).
const renavamRegex = /^\d{9,11}$/;
// Chassi padrão ISO 3779: 17 caracteres alfanuméricos sem I, O, Q.
const chassiRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
const combustiveis = [
  "gasolina",
  "etanol",
  "flex",
  "diesel",
  "gnv",
  "hibrido",
  "eletrico",
] as const;

export const veiculoCreateSchema = z.object({
  placa: z
    .string()
    .trim()
    .min(7, "Placa deve ter no mínimo 7 caracteres")
    .max(8, "Placa deve ter no máximo 8 caracteres")
    .regex(/^[A-Z0-9-]+$/i, "Placa contém caracteres inválidos")
    .transform((s) => s.toUpperCase()),
  modelo: z.string().trim().min(1).max(100),
  marca: z.string().trim().min(1).max(100),
  ano: z.coerce
    .number()
    .int()
    .min(1900, "Ano inválido")
    .max(currentYear + 1, "Ano no futuro"),
  cor: z.string().trim().min(1).max(50),
  quilometragem: z.coerce.number().nonnegative().default(0),
  valorVeiculo: z.coerce.number().nonnegative().optional().nullable(),
  // Tipos refletem a categorização da planilha de pauta atual:
  // passeio (carro), van, micro-ônibus, ônibus, caminhão.
  tipo: z.enum(["carro", "van", "micro_onibus", "onibus", "caminhao"]),
  status: z
    .enum(["disponivel", "em_uso", "manutencao", "inativo"])
    .default("disponivel"),
  // Novos — opcionais no create para não quebrar cadastros existentes via API,
  // mas o form do usuário deve exigir.
  renavam: z
    .string()
    .trim()
    .regex(renavamRegex, "Renavam deve ter 9 a 11 dígitos")
    .optional()
    .nullable(),
  chassi: z
    .string()
    .trim()
    .toUpperCase()
    .regex(chassiRegex, "Chassi inválido (17 caracteres, sem I/O/Q)")
    .optional()
    .nullable(),
  combustivel: z.enum(combustiveis).optional().nullable(),
  valorFipe: z.coerce.number().nonnegative().optional().nullable(),
  fipeCodigo: z.string().trim().max(20).optional().nullable(),
});

export const veiculoUpdateSchema = veiculoCreateSchema.partial();

export const motoristaCreateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  cnh: z.string().trim().min(5).max(20),
  categoriaCnh: z.enum(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"]),
  telefone: z.string().trim().min(8).max(20),
  email: z.string().trim().email("E-mail inválido").max(200),
  status: z.enum(["ativo", "inativo", "suspenso"]).default("ativo"),
});

export const motoristaUpdateSchema = motoristaCreateSchema.partial();

export const unidadeCreateSchema = z.object({
  sigla: z
    .string()
    .trim()
    .min(1, "Sigla é obrigatória")
    .max(20)
    .transform((s) => s.toUpperCase()),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  ativo: z.boolean().default(true),
});

export const unidadeUpdateSchema = unidadeCreateSchema.partial();

export const viagemCreateSchema = z.object({
  veiculoId: z.string().min(1),
  motoristaId: z.string().min(1),
  origem: z.string().trim().min(1).max(200),
  destino: z.string().trim().min(1).max(200),
  dataSaida: z.coerce.date(),
  dataRetorno: z.coerce.date().optional().nullable(),
  kmInicial: z.coerce.number().nonnegative(),
  kmFinal: z.coerce.number().nonnegative().optional().nullable(),
  status: z
    .enum(["agendada", "em_andamento", "concluida", "cancelada"])
    .default("agendada"),
  observacoes: z.string().max(2000).optional().nullable(),
  processoSei: z.string().max(100).optional().nullable(),
  unidadeId: z.string().optional().nullable(),
  ufDestino: z.string().length(2).optional().nullable(),
  diaria: z.coerce.number().nonnegative().optional().nullable(),
  solicitante: z.string().max(200).optional().nullable(),
  motorista2Id: z.string().optional().nullable(),
  kmPorTrecho: z.coerce.number().nonnegative().optional().nullable(),
  qtdDiarias: z.coerce.number().nonnegative().optional().nullable(),
  pcdpNumero: z.string().max(100).optional().nullable(),
  pcdpData: z.string().max(20).optional().nullable(),
  pcdpValor: z.coerce.number().nonnegative().optional().nullable(),
  pcdp2Solicitante: z.string().max(200).optional().nullable(),
  pcdp2Numero: z.string().max(100).optional().nullable(),
  pcdp2Data: z.string().max(20).optional().nullable(),
  pcdp2Valor: z.coerce.number().nonnegative().optional().nullable(),
  totalDiarias: z.coerce.number().nonnegative().optional().nullable(),
});

export const viagemUpdateSchema = viagemCreateSchema.partial();

// ─────────────────────────────────────────────────────────
// Agendamento — reserva de veículo por unidade
// ─────────────────────────────────────────────────────────

/**
 * Status válidos no novo fluxo (criação direta, sem aprovação):
 *   - aprovado: reserva ativa, ocupa célula da grade e dispara conflito.
 *   - cancelado: ex-reserva, exibida em "Canceladas" do mês.
 *   - lista_espera: reserva sem garantia, NÃO bloqueia o veículo nem
 *     dispara conflito. Aparece em seção separada.
 *
 * `pendente` e `rejeitado` ficaram do schema antigo; aceitos no update
 * apenas para que registros legados consigam transitar para os novos
 * status sem 400. UI nova não os gera.
 */
export const agendamentoStatusEnum = z.enum([
  "aprovado",
  "cancelado",
  "lista_espera",
  "pendente",
  "rejeitado",
]);

export const agendamentoCreateSchema = z
  .object({
    veiculoId: z.string().min(1, "Veículo é obrigatório"),
    unidadeId: z.string().min(1, "Unidade é obrigatória"),
    motivo: z.string().trim().min(3, "Motivo deve ter ao menos 3 caracteres").max(200),
    observacao: z.string().trim().max(1000).optional().nullable(),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date(),
    status: agendamentoStatusEnum.default("aprovado"),
  })
  .refine((d) => d.dataFim > d.dataInicio, {
    message: "Data fim deve ser posterior à data início",
    path: ["dataFim"],
  });

// Para PATCH: tudo opcional, mas se ambas as datas vierem precisam ser
// coerentes. Validação cruzada feita no handler quando relevante.
export const agendamentoUpdateSchema = z.object({
  veiculoId: z.string().min(1).optional(),
  unidadeId: z.string().min(1).optional(),
  motivo: z.string().trim().min(3).max(200).optional(),
  observacao: z.string().trim().max(1000).optional().nullable(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  status: agendamentoStatusEnum.optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
  senha: z.string().min(1, "Senha é obrigatória").max(200),
});

export const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1).max(200),
  novaSenha: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres").max(200),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
});

export const resetarSenhaSchema = z.object({
  token: z.string().min(32, "Token inválido").max(200),
  novaSenha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(200),
});

export const usuarioCreateSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido")
    .max(200)
    .refine((e) => e.endsWith("@ufg.br"), "E-mail deve ser @ufg.br"),
  tipo: z.enum(["OPERADOR", "ADMINISTRADOR"]).default("OPERADOR"),
  setor: z.enum(["TRANSPORTE", "MANUTENCAO", "AMBOS"]).default("AMBOS"),
  matricula: z.string().trim().max(50).optional().nullable(),
});

export const usuarioUpdateSchema = usuarioCreateSchema
  .omit({ email: true })
  .partial()
  .extend({
    ativo: z.boolean().optional(),
  });

// ─────────────────────────────────────────────────────────
// Oficina / Catálogos (novos cadastros F1)
// ─────────────────────────────────────────────────────────

// CNPJ só em dígitos (14) ou formatado XX.XXX.XXX/XXXX-XX.
// Guarda-se apenas os 14 dígitos.
const cnpjOnlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Valida CNPJ pelo cálculo dos dois dígitos verificadores.
 * Rejeita também sequências repetidas como "00000000000000".
 * Refs: receita federal — algoritmo padrão (módulo 11).
 */
function cnpjChecksumOk(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calcDV = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = calcDV(cnpj.slice(0, 12), pesos1);
  const dv2 = calcDV(cnpj.slice(0, 12) + dv1, pesos2);
  return dv1 === Number(cnpj[12]) && dv2 === Number(cnpj[13]);
}

// Aceita maps.app.goo.gl/… (encurtado) e google.com/maps/… (longo).
const googleMapsRegex =
  /^https:\/\/(?:maps\.app\.goo\.gl\/|(?:www\.)?google\.com\/maps(?:\/|\?))/i;

export const oficinaCreateSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  cnpj: z
    .string()
    .trim()
    .transform(cnpjOnlyDigits)
    .refine((v) => v.length === 14, "CNPJ deve ter 14 dígitos")
    .refine(cnpjChecksumOk, "CNPJ inválido (dígitos verificadores não conferem)"),
  whatsapp: z
    .string()
    .trim()
    .transform((s) => s.replace(/\D/g, ""))
    .refine(
      (v) => v === "" || (v.length >= 10 && v.length <= 13),
      "WhatsApp inválido (10–13 dígitos, DDI opcional)"
    )
    .optional()
    .nullable(),
  enderecoTexto: z.string().trim().max(500).optional().nullable(),
  googleMapsUrl: z
    .string()
    .trim()
    .regex(googleMapsRegex, "Link deve ser do Google Maps")
    .max(2048)
    .optional()
    .nullable(),
  ativa: z.boolean().default(true),
});

export const oficinaUpdateSchema = oficinaCreateSchema.partial();

export const servicoCreateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  descricao: z.string().trim().max(1000).optional().nullable(),
  valorReferencia: z.coerce.number().nonnegative().optional().nullable(),
  ativo: z.boolean().default(true),
});

export const servicoUpdateSchema = servicoCreateSchema.partial();

export const pecaCreateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  codigo: z.string().trim().max(100).optional().nullable(),
  unidade: z.string().trim().max(20).optional().nullable(),
  valorReferencia: z.coerce.number().nonnegative().optional().nullable(),
  ativo: z.boolean().default(true),
});

export const pecaUpdateSchema = pecaCreateSchema.partial();

// ─────────────────────────────────────────────────────────
// Bateria (F3 — previsão por data + vida útil)
// ─────────────────────────────────────────────────────────

export const bateriaCreateSchema = z.object({
  fabricante: z.string().trim().max(100).optional().nullable(),
  amperagem: z.coerce.number().int().positive().max(500).optional().nullable(),
  dataInstalacao: z.coerce.date(),
  vidaUtilMeses: z.coerce.number().int().min(1).max(120).default(24),
  alertaAntesDeDias: z.coerce.number().int().min(0).max(365).default(30),
  observacao: z.string().trim().max(500).optional().nullable(),
});

export const bateriaUpdateSchema = bateriaCreateSchema.partial().extend({
  dataSubstituicao: z.coerce.date().optional().nullable(),
});
