/**
 * Cálculo de status da bateria por data + vida útil.
 *
 * Regra (F3, decidido 2026-04-24):
 *   fim previsto = dataInstalacao + vidaUtilMeses
 *   diasRestantes = fim - hoje
 *   - diasRestantes <= 0       -> vencida (vermelho)
 *   - diasRestantes <= alertaAntesDeDias -> alerta (amarelo)
 *   - caso contrário           -> ok (verde)
 */

export type StatusBateria = "ok" | "alerta" | "vencida";

export interface BateriaAtiva {
  id: string;
  dataInstalacao: Date | string;
  vidaUtilMeses: number;
  alertaAntesDeDias: number;
}

export interface BateriaStatus {
  fimPrevisto: Date;
  diasRestantes: number;
  status: StatusBateria;
}

function adicionarMeses(data: Date, meses: number): Date {
  const r = new Date(data);
  r.setMonth(r.getMonth() + meses);
  return r;
}

export function calcularStatusBateria(b: BateriaAtiva, hoje: Date = new Date()): BateriaStatus {
  const inst = b.dataInstalacao instanceof Date ? b.dataInstalacao : new Date(b.dataInstalacao);
  const fimPrevisto = adicionarMeses(inst, b.vidaUtilMeses);
  const msDia = 24 * 60 * 60 * 1000;
  const diasRestantes = Math.floor((fimPrevisto.getTime() - hoje.getTime()) / msDia);
  let status: StatusBateria;
  if (diasRestantes <= 0) status = "vencida";
  else if (diasRestantes <= b.alertaAntesDeDias) status = "alerta";
  else status = "ok";
  return { fimPrevisto, diasRestantes, status };
}
