/**
 * Alerta de manutenção por quilometragem (AlertaKm).
 *
 * Módulo puro — sem Prisma, sem Next. Recebe o alerta e o km atual do
 * veículo e devolve o status; o relógio e o km médio/dia são injetados,
 * como em `bateria.ts`.
 *
 * Regra:
 *   kmProxima  = ultimaTrocaKm + intervaloKm
 *   kmRestante = kmProxima - kmAtual
 *   - kmRestante <= 0              -> vencido (vermelho)
 *   - kmRestante <= alertaAntesDe  -> alerta  (amarelo)
 *   - caso contrário               -> ok      (verde)
 *
 * Projeção de data: só quando há kmMedioDia > 0 e kmRestante > 0.
 * Divide com o valor cru; arredondar é responsabilidade de quem exibe.
 */

import { z } from "zod";

// ─── Tipos de alerta ───────────────────────────────────────

export const alertaKmTipoEnum = z.enum([
  "troca_oleo",
  "troca_pneus",
  "revisao",
  "alinhamento",
  "filtro_ar",
  "filtro_combustivel",
  "correia_dentada",
  "fluido_freio",
  "fluido_arrefecimento",
]);

export type TipoAlertaKm = z.infer<typeof alertaKmTipoEnum>;

/** Um label por tipo. Adicionar um tipo no enum sem label aqui quebra o tsc. */
export const LABEL_TIPO_ALERTA: Record<TipoAlertaKm, string> = {
  troca_oleo: "Troca de Óleo",
  troca_pneus: "Troca de Pneus",
  revisao: "Revisão Geral",
  alinhamento: "Alinhamento e Balanceamento",
  filtro_ar: "Filtro de Ar",
  filtro_combustivel: "Filtro de Combustível",
  correia_dentada: "Correia Dentada",
  fluido_freio: "Fluido de Freio",
  fluido_arrefecimento: "Fluido de Arrefecimento",
};

/** Lista ordenada para `<select>`. */
export const TIPOS_ALERTA = alertaKmTipoEnum.options.map((value) => ({
  value,
  label: LABEL_TIPO_ALERTA[value],
}));

/** Label do tipo; devolve o próprio código quando desconhecido (dado legado). */
export function labelTipoAlerta(tipo: string): string {
  return (LABEL_TIPO_ALERTA as Record<string, string>)[tipo] ?? tipo;
}

// ─── Status ────────────────────────────────────────────────

export type StatusAlertaKm = "ok" | "alerta" | "vencido";

export interface AlertaKmConfig {
  intervaloKm: number;
  ultimaTrocaKm: number;
  alertaAntesDe: number;
}

export interface AlertaKmStatus {
  kmProxima: number;
  kmRestante: number;
  status: StatusAlertaKm;
  /** Dias até kmProxima no ritmo atual; null sem kmMedioDia ou já vencido. */
  diasEstimados: number | null;
  dataEstimada: Date | null;
}

export interface OpcoesAlertaKm {
  /** Km rodado por dia pelo veículo (ver `kmMedioPorDia`). 0 = sem projeção. */
  kmMedioDia?: number;
  hoje?: Date;
}

export function calcularAlertaKm(
  alerta: AlertaKmConfig,
  kmAtual: number,
  { kmMedioDia = 0, hoje = new Date() }: OpcoesAlertaKm = {}
): AlertaKmStatus {
  const kmProxima = alerta.ultimaTrocaKm + alerta.intervaloKm;
  const kmRestante = kmProxima - kmAtual;

  let status: StatusAlertaKm;
  if (kmRestante <= 0) status = "vencido";
  else if (kmRestante <= alerta.alertaAntesDe) status = "alerta";
  else status = "ok";

  let diasEstimados: number | null = null;
  let dataEstimada: Date | null = null;
  if (kmMedioDia > 0 && kmRestante > 0) {
    diasEstimados = Math.ceil(kmRestante / kmMedioDia);
    dataEstimada = new Date(hoje);
    dataEstimada.setDate(dataEstimada.getDate() + diasEstimados);
  }

  return { kmProxima, kmRestante, status, diasEstimados, dataEstimada };
}

// ─── Km médio por dia ──────────────────────────────────────

export interface ViagemComKm {
  kmInicial: number;
  kmFinal: number | null;
  dataSaida: Date | string;
}

/**
 * Km rodado por dia desde a primeira viagem com km registrado.
 * Precisa de pelo menos 2 viagens com kmInicial e kmFinal; senão 0.
 */
export function kmMedioPorDia(viagens: ViagemComKm[], hoje: Date = new Date()): number {
  const comKm = viagens.filter((v) => v.kmFinal != null);
  if (comKm.length < 2) return 0;

  const kmTotal = comKm.reduce((acc, v) => acc + ((v.kmFinal ?? 0) - v.kmInicial), 0);
  const primeira = Math.min(...comKm.map((v) => new Date(v.dataSaida).getTime()));
  const msDia = 24 * 60 * 60 * 1000;
  const dias = Math.max(1, Math.floor((hoje.getTime() - primeira) / msDia));
  return kmTotal / dias;
}

// ─── Próximo alerta ────────────────────────────────────────

/**
 * O alerta que precisa de ação primeiro: o vencido mais atrasado; se
 * nenhum vencido, o de menor kmRestante. Null sem alertas.
 */
export function proximoAlerta<T extends AlertaKmConfig>(
  alertas: T[],
  kmAtual: number,
  opcoes: OpcoesAlertaKm = {}
): (T & AlertaKmStatus) | null {
  let melhor: (T & AlertaKmStatus) | null = null;
  for (const a of alertas) {
    const candidato = { ...a, ...calcularAlertaKm(a, kmAtual, opcoes) };
    if (!melhor || candidato.kmRestante < melhor.kmRestante) melhor = candidato;
  }
  return melhor;
}
