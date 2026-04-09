export interface ServicoManutencao {
  categoria: string;
  servico: string;
}

export const CATEGORIAS_SERVICOS: Record<string, string[]> = {
  "Motor": [
    "Troca de óleo",
    "Filtro de óleo",
    "Filtro de ar",
    "Filtro de combustível",
    "Correia dentada",
    "Correia do alternador",
    "Velas de ignição",
    "Cabos de vela",
    "Junta do cabeçote",
    "Retífica do motor",
    "Bomba d'água",
    "Sensor de temperatura",
    "Válvula termostática",
  ],
  "Freios": [
    "Pastilha de freio dianteira",
    "Pastilha de freio traseira",
    "Disco de freio dianteiro",
    "Disco de freio traseiro",
    "Tambor de freio",
    "Lona de freio",
    "Fluido de freio",
    "Cilindro mestre",
    "Cilindro de roda",
    "Flexível de freio",
  ],
  "Pneus": [
    "Troca de pneu dianteiro",
    "Troca de pneu traseiro",
    "Alinhamento",
    "Balanceamento",
    "Rodízio de pneus",
    "Calibragem",
    "Reparo de pneu",
  ],
  "Suspensão": [
    "Amortecedor dianteiro",
    "Amortecedor traseiro",
    "Mola dianteira",
    "Mola traseira",
    "Pivô de suspensão",
    "Bieleta",
    "Bandeja de suspensão",
    "Bucha da bandeja",
    "Terminal de direção",
    "Caixa de direção",
  ],
  "Elétrica": [
    "Bateria",
    "Alternador",
    "Motor de partida",
    "Fusível",
    "Relé",
    "Chicote elétrico",
    "Módulo de injeção",
    "Sensor de oxigênio (sonda lambda)",
    "Sensor de rotação",
    "Bobina de ignição",
  ],
  "Iluminação": [
    "Farol dianteiro esquerdo",
    "Farol dianteiro direito",
    "Farol traseiro esquerdo",
    "Farol traseiro direito",
    "Lanterna dianteira",
    "Lanterna traseira",
    "Luz de freio",
    "Luz de ré",
    "Luz de placa",
    "Farol de milha",
    "Lâmpada do painel",
    "Pisca/Seta",
  ],
  "Ar Condicionado": [
    "Recarga de gás",
    "Compressor",
    "Condensador",
    "Evaporador",
    "Filtro de cabine",
    "Ventilador do radiador",
    "Mangueira do ar condicionado",
  ],
  "Lataria e Pintura": [
    "Pintura parcial",
    "Pintura completa",
    "Funilaria",
    "Polimento",
    "Para-choque dianteiro",
    "Para-choque traseiro",
    "Paralama",
    "Capô",
    "Porta",
    "Retrovisor",
    "Para-brisa",
    "Vidro lateral",
    "Vidro traseiro",
  ],
  "Fluidos": [
    "Fluido de freio",
    "Fluido de arrefecimento",
    "Fluido de direção hidráulica",
    "Fluido de transmissão",
    "Aditivo do radiador",
    "Água do limpador",
  ],
  "Transmissão": [
    "Embreagem",
    "Disco de embreagem",
    "Platô de embreagem",
    "Rolamento de embreagem",
    "Cabo de embreagem",
    "Óleo de câmbio",
    "Troca de câmbio",
    "Junta homocinética",
    "Coifa da homocinética",
  ],
  "Escapamento": [
    "Catalisador",
    "Silencioso dianteiro",
    "Silencioso traseiro",
    "Tubo de escape",
    "Flexível do escapamento",
    "Abraçadeira do escapamento",
  ],
  "Outros": [],
};

export function buscarServicos(termo: string): ServicoManutencao[] {
  const termoLower = termo.toLowerCase();
  const resultados: ServicoManutencao[] = [];

  for (const [categoria, servicos] of Object.entries(CATEGORIAS_SERVICOS)) {
    for (const servico of servicos) {
      if (
        servico.toLowerCase().includes(termoLower) ||
        categoria.toLowerCase().includes(termoLower)
      ) {
        resultados.push({ categoria, servico });
      }
    }
  }

  return resultados;
}

export function listarTodasCategorias(): string[] {
  return Object.keys(CATEGORIAS_SERVICOS);
}

export function listarServicosPorCategoria(categoria: string): string[] {
  return CATEGORIAS_SERVICOS[categoria] || [];
}
