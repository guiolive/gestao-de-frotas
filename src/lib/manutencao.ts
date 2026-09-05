/**
 * Ciclo de vida da OS de manutenção.
 *
 * Módulo puro — sem Prisma, sem Next. Concentra o que antes estava copiado
 * em routes, pages e dashboards: máquina de estados da OS, efeito do status
 * no veículo, custo, prazo e situação Prime. Relógio injetado (`hoje`/`agora`).
 *
 * Status da OS:  aguardando → em_andamento → concluida
 *                aguardando | em_andamento → cancelada
 *                concluida e cancelada são terminais (reabrir = nova OS).
 *
 * Efeito no veículo: OS aberta → veículo "manutencao"; OS terminal → veículo
 * "disponivel" só se não houver outra OS aberta. Veículo "inativo" nunca é
 * tocado — esse guard é de I/O e fica na route (updateMany com filtro).
 */

import { z } from "zod";
import type { manutencaoUpdateSchema } from "./validation";

// ─── Status ────────────────────────────────────────────────

export const manutencaoStatusEnum = z.enum([
  "aguardando",
  "em_andamento",
  "concluida",
  "cancelada",
]);

export type StatusOS = z.infer<typeof manutencaoStatusEnum>;

export const STATUS_OS_ABERTOS: readonly StatusOS[] = ["aguardando", "em_andamento"];

export function osAberta(status: string): boolean {
  return (STATUS_OS_ABERTOS as readonly string[]).includes(status);
}

const TRANSICOES: Record<StatusOS, readonly StatusOS[]> = {
  aguardando: ["em_andamento", "cancelada"],
  em_andamento: ["concluida", "cancelada"],
  concluida: [],
  cancelada: [],
};

/** Mesmo status é sempre permitido (patch sem mudança). */
export function transicaoPermitida(de: string, para: StatusOS): boolean {
  if (de === para) return true;
  const permitidas = TRANSICOES[de as StatusOS];
  return permitidas ? permitidas.includes(para) : false;
}

// ─── Custo ─────────────────────────────────────────────────

/**
 * Custo real da OS: soma dos itens; se não há itens com valor, cai no
 * `valorTotal` gravado (OS legada sem itens). Nunca perde dado.
 */
export function custoDaOS(os: {
  itens: readonly { valor: number }[];
  valorTotal?: number | null;
}): number {
  const soma = os.itens.reduce((acc, i) => acc + i.valor, 0);
  return soma > 0 ? soma : os.valorTotal ?? 0;
}

/** Valor persistido em `valorTotal`: soma dos itens, ou null quando zero. */
export function valorTotalDosItens(
  itens: readonly { valor?: number | null }[]
): number | null {
  const soma = itens.reduce((acc, i) => acc + (i.valor ?? 0), 0);
  return soma > 0 ? soma : null;
}

// ─── Prazo (OS aberta × previsão de saída) ─────────────────

const MS_DIA = 24 * 60 * 60 * 1000;

function paraData(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  return d instanceof Date ? d : new Date(d);
}

export interface PrazoOS {
  /** Dias até a previsão de saída (negativo = passou); null sem previsão. */
  diasRestantes: number | null;
  /** OS aberta cuja previsão de saída já passou. */
  atrasada: boolean;
}

export function prazoDaOS(
  os: { status: string; previsaoSaida: Date | string | null },
  hoje: Date = new Date()
): PrazoOS {
  const previsao = paraData(os.previsaoSaida);
  if (!previsao) return { diasRestantes: null, atrasada: false };
  const diasRestantes = Math.floor((previsao.getTime() - hoje.getTime()) / MS_DIA);
  return { diasRestantes, atrasada: osAberta(os.status) && previsao < hoje };
}

// ─── Situação Prime (oficina terceirizada) ─────────────────

export interface SituacaoPrime {
  enviada: boolean;
  retornou: boolean;
  /** Enviada, sem retorno, e a previsão de saída já passou. */
  emAtraso: boolean;
  diasAtraso: number;
}

export function situacaoPrime(
  os: {
    enviadaPrimeEm: Date | string | null;
    retornoEfetivoEm: Date | string | null;
    previsaoSaida: Date | string | null;
  },
  hoje: Date = new Date()
): SituacaoPrime {
  const enviada = !!os.enviadaPrimeEm;
  const retornou = !!os.retornoEfetivoEm;
  const previsao = paraData(os.previsaoSaida);
  const emAtraso = enviada && !retornou && !!previsao && previsao < hoje;
  const diasAtraso =
    emAtraso && previsao ? Math.floor((hoje.getTime() - previsao.getTime()) / MS_DIA) : 0;
  return { enviada, retornou, emAtraso, diasAtraso };
}

// ─── Abertura ──────────────────────────────────────────────

export type ResultadoAbertura = { ok: true } | { ok: false; erro: "veiculo_inativo" };

/** OS em veículo baixado é erro de operação — recusar, não gravar em silêncio. */
export function validarAberturaOS(veiculoStatus: string): ResultadoAbertura {
  if (veiculoStatus === "inativo") return { ok: false, erro: "veiculo_inativo" };
  return { ok: true };
}

// ─── Atualização ───────────────────────────────────────────

export type PatchOS = z.infer<typeof manutencaoUpdateSchema>;

export type StatusVeiculoAlvo = "manutencao" | "disponivel";

export type PlanoAtualizacao =
  | {
      ok: true;
      /** Campos a gravar na OS (só os enviados no patch). */
      manutencao: Record<string, unknown>;
      /** Status a aplicar no veículo, ou null para não tocar. */
      veiculo: StatusVeiculoAlvo | null;
      checklist?: PatchOS["checklist"];
      itens?: PatchOS["itens"];
    }
  | { ok: false; erro: "transicao_invalida"; de: string; para: StatusOS };

export interface ContextoAtualizacao {
  agora: Date;
  /** Outras OS abertas do mesmo veículo (excluindo esta). */
  outrasAbertas: number;
}

/**
 * Decide tudo que o PUT precisa gravar, sem tocar em I/O:
 * patch parcial, `valorTotal` derivado dos itens, carimbo de
 * `previsaoSaidaAtualizadaEm` quando a previsão muda, validação da
 * transição de status e efeito no veículo.
 */
export function planejarAtualizacao(
  atual: { status: string; previsaoSaida: Date | string | null },
  patch: PatchOS,
  { agora, outrasAbertas }: ContextoAtualizacao
): PlanoAtualizacao {
  let veiculo: StatusVeiculoAlvo | null = null;
  if (patch.status !== undefined) {
    if (!transicaoPermitida(atual.status, patch.status)) {
      return { ok: false, erro: "transicao_invalida", de: atual.status, para: patch.status };
    }
    if (osAberta(patch.status)) veiculo = "manutencao";
    else veiculo = outrasAbertas > 0 ? null : "disponivel";
  }

  const m: Record<string, unknown> = {};
  if (patch.tipo !== undefined) m.tipo = patch.tipo;
  if (patch.descricao !== undefined) m.descricao = patch.descricao;
  if (patch.dataEntrada !== undefined) m.dataEntrada = patch.dataEntrada;
  if (patch.previsaoDias !== undefined) m.previsaoDias = patch.previsaoDias;
  if (patch.custoEstimado !== undefined) m.custoEstimado = patch.custoEstimado ?? null;
  if (patch.status !== undefined) m.status = patch.status;
  if (patch.oficinaId !== undefined) m.oficinaId = patch.oficinaId ?? null;
  if (patch.enviadaPrimeEm !== undefined) m.enviadaPrimeEm = patch.enviadaPrimeEm ?? null;
  if (patch.retornoEfetivoEm !== undefined) m.retornoEfetivoEm = patch.retornoEfetivoEm ?? null;

  if (patch.previsaoSaida !== undefined) {
    const nova = patch.previsaoSaida ?? null;
    m.previsaoSaida = nova;
    const atualMs = paraData(atual.previsaoSaida)?.getTime() ?? null;
    const novaMs = nova ? nova.getTime() : null;
    // Alimenta o feed "novidades da oficina" no painel de transporte.
    if (atualMs !== novaMs) m.previsaoSaidaAtualizadaEm = agora;
  }

  if (patch.itens !== undefined) m.valorTotal = valorTotalDosItens(patch.itens);

  return {
    ok: true,
    manutencao: m,
    veiculo,
    ...(patch.checklist !== undefined ? { checklist: patch.checklist } : {}),
    ...(patch.itens !== undefined ? { itens: patch.itens } : {}),
  };
}
