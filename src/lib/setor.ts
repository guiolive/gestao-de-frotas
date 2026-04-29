/**
 * Setor (área de atuação) do usuário. Ortogonal ao `tipo`/privilégio:
 *   - TRANSPORTE: atendentes da pauta de viagens, ficam no
 *     calendário/agendamentos, ignoram a parte de oficina.
 *   - MANUTENCAO: CMAN e equipe — focam em OS, preventivas, baterias.
 *   - AMBOS: Diretor de Logística e quem precisa da visão geral.
 */
export const SETORES = ["TRANSPORTE", "MANUTENCAO", "AMBOS"] as const;
export type Setor = (typeof SETORES)[number];

const LABELS: Record<Setor, string> = {
  TRANSPORTE: "Transporte",
  MANUTENCAO: "Manutenção",
  AMBOS: "Ambos (visão geral)",
};

export function labelSetor(setor: string): string {
  return LABELS[setor as Setor] ?? setor;
}

export function isSetor(value: string | null | undefined): value is Setor {
  return value === "TRANSPORTE" || value === "MANUTENCAO" || value === "AMBOS";
}

/**
 * Helpers semânticos pra gating de UI (sidebar, dashboard cards).
 * Quem é AMBOS sempre vê tudo.
 */
export function veTransporte(setor: string | null | undefined): boolean {
  return setor === "TRANSPORTE" || setor === "AMBOS";
}

export function veManutencao(setor: string | null | undefined): boolean {
  return setor === "MANUTENCAO" || setor === "AMBOS";
}
