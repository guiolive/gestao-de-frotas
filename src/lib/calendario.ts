/**
 * Utilitários puros de calendário usados pela grade mensal de agendamentos.
 * Sem dependências externas — toda data manipulada como UTC para evitar
 * deslocamento por fuso quando o servidor renderiza um dia diferente do
 * cliente.
 */

export type DiaDoMes = {
  dia: number;
  data: Date; // 00:00 UTC
  fimDeSemana: boolean;
};

export function diasDoMes(ano: number, mes: number): DiaDoMes[] {
  // mes: 1-12
  const total = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const dias: DiaDoMes[] = [];
  for (let d = 1; d <= total; d++) {
    const data = new Date(Date.UTC(ano, mes - 1, d));
    const dow = data.getUTCDay(); // 0 = dom, 6 = sáb
    dias.push({ dia: d, data, fimDeSemana: dow === 0 || dow === 6 });
  }
  return dias;
}

export function inicioDoMes(ano: number, mes: number): Date {
  return new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));
}

export function fimDoMes(ano: number, mes: number): Date {
  // Último instante do dia final
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes - 1, ultimoDia, 23, 59, 59, 999));
}

export function ehFimDeSemana(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

export function formatYmd(d: Date): string {
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(d.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function nomeMes(mes: number): string {
  return NOMES_MES[mes - 1] ?? "";
}

/**
 * Navegação mês anterior/próximo. Trata virada de ano.
 */
export function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  if (mes === 1) return { ano: ano - 1, mes: 12 };
  return { ano, mes: mes - 1 };
}

export function mesProximo(ano: number, mes: number): { ano: number; mes: number } {
  if (mes === 12) return { ano: ano + 1, mes: 1 };
  return { ano, mes: mes + 1 };
}

/**
 * Verifica se um agendamento (intervalo [inicio, fim]) cobre um dia
 * específico (dia inteiro). Usado para pintar células.
 */
export function agendamentoCobreDia(
  agendInicio: Date,
  agendFim: Date,
  dia: Date
): boolean {
  const diaInicio = new Date(
    Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), 0, 0, 0, 0)
  );
  const diaFim = new Date(
    Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), 23, 59, 59, 999)
  );
  return agendInicio <= diaFim && agendFim >= diaInicio;
}
