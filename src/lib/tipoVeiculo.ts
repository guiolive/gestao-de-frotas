/**
 * Labels para o campo `Veiculo.tipo`. Centralizado aqui pra evitar
 * duplicação entre o form de cadastro, o select do agendamento, o
 * filtro do calendário e o futuro export público da agenda.
 *
 * Lista alinhada com a planilha de pauta original do CMAN (passeio,
 * van, micro, ônibus, caminhão). Tipos extras (caçamba, baú trucado,
 * guincho) podem entrar como sub-tipos depois — manter a granularidade
 * pequena enquanto o conjunto de filtros não justificar.
 */

export const TIPOS_VEICULO = [
  "carro",
  "van",
  "micro_onibus",
  "onibus",
  "caminhao",
] as const;

export type TipoVeiculo = (typeof TIPOS_VEICULO)[number];

const LABELS: Record<TipoVeiculo, string> = {
  carro: "Passeio",
  van: "Van",
  micro_onibus: "Micro-ônibus",
  onibus: "Ônibus",
  caminhao: "Caminhão",
};

export function labelTipoVeiculo(tipo: string): string {
  return LABELS[tipo as TipoVeiculo] ?? tipo;
}
