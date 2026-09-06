/**
 * Ciclo de vida da viagem.
 *
 * Módulo puro — sem Prisma, sem Next. Concentra o que estava copiado nas
 * duas routes e nos dois forms: máquina de estados, efeito do status no
 * veículo (status + odômetro), total de diárias, regra da PCDP e
 * consistência de km. Relógio injetado (`agora`).
 *
 * Status:  agendada → em_andamento → concluida
 *          agendada → concluida (registro retroativo de viagem já feita)
 *          agendada | em_andamento → cancelada
 *          concluida e cancelada são terminais.
 *
 * Só uma **transição** dispara efeito no veículo — reenviar o mesmo status
 * (o form de editar manda todos os campos) não mexe em nada. Concluir ou
 * cancelar libera o veículo só se ele está `em_uso` (nunca "solta" um
 * veículo que está em OS ou em outra viagem) e o odômetro nunca abaixa por
 * viagem — correção de odômetro é no cadastro do veículo. Veículo
 * `inativo` nunca é tocado — guard de I/O na route (updateMany com filtro).
 */

import { z } from "zod";
import type { viagemCreateSchema, viagemUpdateSchema } from "./validation";

// ─── Status ────────────────────────────────────────────────

export const viagemStatusEnum = z.enum([
  "agendada",
  "em_andamento",
  "concluida",
  "cancelada",
]);

export type StatusViagem = z.infer<typeof viagemStatusEnum>;

export const STATUS_VIAGEM_ABERTOS: readonly StatusViagem[] = ["agendada", "em_andamento"];

export function viagemAberta(status: string): boolean {
  return (STATUS_VIAGEM_ABERTOS as readonly string[]).includes(status);
}

const TRANSICOES: Record<StatusViagem, readonly StatusViagem[]> = {
  agendada: ["em_andamento", "concluida", "cancelada"],
  em_andamento: ["concluida", "cancelada"],
  concluida: [],
  cancelada: [],
};

/** Mesmo status é sempre permitido (patch sem mudança). */
export function transicaoPermitida(de: string, para: StatusViagem): boolean {
  if (de === para) return true;
  const permitidas = TRANSICOES[de as StatusViagem];
  return permitidas ? permitidas.includes(para) : false;
}

/**
 * Opções válidas para um `<select>` de status: o atual mais as transições
 * permitidas a partir dele. Status desconhecido (legado) só lista a si mesmo.
 */
export function transicoesDe(status: string): string[] {
  const permitidas = TRANSICOES[status as StatusViagem] ?? [];
  return [status, ...permitidas];
}

// ─── Diárias e PCDP ────────────────────────────────────────

/**
 * Total de diárias: `diaria × qtdDiarias` quando os dois existem; senão o
 * valor informado à mão (viagem legada / diária avulsa), ou null.
 */
export function calcularTotalDiarias(
  diaria: number | null | undefined,
  qtdDiarias: number | null | undefined,
  informado: number | null | undefined = null
): number | null {
  if (diaria && qtdDiarias) return diaria * qtdDiarias;
  return informado ?? null;
}

/** Há diárias na viagem (e portanto precisa de PCDP). */
export function temDiarias(v: {
  diaria?: number | null;
  qtdDiarias?: number | null;
}): boolean {
  return !!v.diaria && !!v.qtdDiarias;
}

export type ErroViagem =
  | "pcdp_obrigatorio"
  | "km_final_menor"
  | "veiculo_indisponivel";

export type ResultadoValidacao = { ok: true } | { ok: false; erro: ErroViagem };

/** Texto para o usuário; o mesmo nos forms e nas routes. */
export function mensagemErroViagem(erro: ErroViagem, veiculoStatus?: string): string {
  switch (erro) {
    case "pcdp_obrigatorio":
      return "PCDP Motorista 1 é obrigatório quando há diárias.";
    case "km_final_menor":
      return "KM final não pode ser menor que o KM inicial.";
    case "veiculo_indisponivel":
      return `Veículo não disponível (status: ${veiculoStatus ?? "desconhecido"})`;
  }
}

/** PCDP do motorista 1 é obrigatória quando há diárias. */
export function validarPcdp(v: {
  diaria?: number | null;
  qtdDiarias?: number | null;
  pcdpNumero?: string | null;
}): ResultadoValidacao {
  if (temDiarias(v) && !v.pcdpNumero?.trim()) return { ok: false, erro: "pcdp_obrigatorio" };
  return { ok: true };
}

/** kmFinal é opcional, mas quando existe não pode ser menor que kmInicial. */
export function validarKm(v: {
  kmInicial: number;
  kmFinal?: number | null;
}): ResultadoValidacao {
  if (v.kmFinal != null && v.kmFinal < v.kmInicial) return { ok: false, erro: "km_final_menor" };
  return { ok: true };
}

// ─── Criação ───────────────────────────────────────────────

export type NovaViagem = z.infer<typeof viagemCreateSchema>;

/**
 * Viagem só nasce em veículo disponível ou já em uso (viagem retroativa /
 * fracionada). Em OS ou baixado, recusa. Conflitos de agenda são I/O e
 * ficam na route.
 */
export function validarNovaViagem(
  input: NovaViagem,
  veiculoStatus: string
): ResultadoValidacao {
  if (veiculoStatus === "manutencao" || veiculoStatus === "inativo") {
    return { ok: false, erro: "veiculo_indisponivel" };
  }
  const pcdp = validarPcdp(input);
  if (!pcdp.ok) return pcdp;
  return validarKm(input);
}

/** Campos a gravar na criação: nulos normalizados, status inicial, total derivado. */
export function dadosCriacao(input: NovaViagem) {
  const { totalDiarias: informado, ...resto } = input;
  const dados = Object.fromEntries(
    Object.entries(resto).map(([k, v]) => [k, v ?? null])
  ) as typeof resto;
  return {
    ...dados,
    status: "agendada" as const,
    totalDiarias: calcularTotalDiarias(input.diaria, input.qtdDiarias, informado),
  };
}

// ─── Atualização ───────────────────────────────────────────

export type PatchViagem = z.infer<typeof viagemUpdateSchema>;

export interface EfeitoVeiculo {
  status?: "em_uso" | "disponivel";
  quilometragem?: number;
}

export type PlanoAtualizacao =
  | {
      ok: true;
      /** Campos a gravar na viagem (só os enviados no patch, mais derivados). */
      viagem: Record<string, unknown>;
      /** Alterações no veículo, ou null para não tocar. */
      veiculo: EfeitoVeiculo | null;
    }
  | { ok: false; erro: "transicao_invalida"; de: string; para: StatusViagem }
  | { ok: false; erro: ErroViagem };

export interface ViagemAtual {
  status: string;
  kmInicial: number;
  kmFinal: number | null;
  dataRetorno: Date | string | null;
  diaria: number | null;
  qtdDiarias: number | null;
  pcdpNumero: string | null;
  totalDiarias: number | null;
}

export interface ContextoAtualizacao {
  agora: Date;
  veiculo: { status: string; quilometragem: number };
}

/**
 * Decide tudo que o PUT precisa gravar, sem tocar em I/O: patch parcial,
 * `totalDiarias` derivado, `dataRetorno` ao concluir, validações sobre o
 * estado resultante (atual + patch), transição de status e efeito no veículo.
 */
export function planejarAtualizacao(
  atual: ViagemAtual,
  patch: PatchViagem,
  { agora, veiculo }: ContextoAtualizacao
): PlanoAtualizacao {
  const resultante = { ...atual, ...semIndefinidos(patch) };

  const pcdp = validarPcdp(resultante);
  if (!pcdp.ok) return pcdp;
  const km = validarKm(resultante);
  if (!km.ok) return km;

  const v: Record<string, unknown> = {};
  for (const [k, valor] of Object.entries(patch)) {
    if (valor !== undefined) v[k] = valor ?? null;
  }
  if (patch.diaria !== undefined || patch.qtdDiarias !== undefined || patch.totalDiarias !== undefined) {
    v.totalDiarias = calcularTotalDiarias(
      resultante.diaria,
      resultante.qtdDiarias,
      resultante.totalDiarias
    );
  }

  let efeito: EfeitoVeiculo | null = null;
  const para = patch.status;
  if (para !== undefined && para !== atual.status) {
    if (!transicaoPermitida(atual.status, para)) {
      return { ok: false, erro: "transicao_invalida", de: atual.status, para };
    }
    if (para === "em_andamento") {
      efeito = { status: "em_uso" };
    } else if (para === "concluida" || para === "cancelada") {
      efeito = {};
      if (veiculo.status === "em_uso") efeito.status = "disponivel";
      if (para === "concluida") {
        const kmFinal = resultante.kmFinal;
        if (kmFinal != null && kmFinal > veiculo.quilometragem) efeito.quilometragem = kmFinal;
        if (!resultante.dataRetorno) v.dataRetorno = agora;
      }
      if (Object.keys(efeito).length === 0) efeito = null;
    }
  }

  return { ok: true, viagem: v, veiculo: efeito };
}

function semIndefinidos<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
