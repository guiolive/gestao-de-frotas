/**
 * Grade mensal de agendamentos — veículos como linhas, dias do mês como
 * colunas. Cada célula vira link pro agendamento correspondente. Usada em
 * /agendamentos (com nav de mês) e no dashboard (apenas leitura).
 */
import Link from "next/link";
import { agendamentoCobreDia, type DiaDoMes } from "@/lib/calendario";
import { corParaSigla } from "@/lib/unidadeCores";
import type { Agendamento, Veiculo, Unidade } from "@/generated/prisma/client";

type AgendamentoComRel = Agendamento & {
  veiculo: Veiculo;
  unidade: Unidade | null;
};

export type GradeMensalProps = {
  veiculos: Veiculo[];
  dias: DiaDoMes[];
  agendamentos: AgendamentoComRel[];
};

function formatHoraCurta(d: Date | string): string {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GradeMensal({
  veiculos,
  dias,
  agendamentos,
}: GradeMensalProps) {
  // Index por veículo + dia para lookup O(1) na renderização.
  const grade = new Map<string, Map<number, AgendamentoComRel>>();
  for (const a of agendamentos) {
    let porVeiculo = grade.get(a.veiculoId);
    if (!porVeiculo) {
      porVeiculo = new Map();
      grade.set(a.veiculoId, porVeiculo);
    }
    for (const d of dias) {
      if (agendamentoCobreDia(a.dataInicio, a.dataFim, d.data)) {
        if (!porVeiculo.has(d.dia)) porVeiculo.set(d.dia, a);
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="border-collapse text-xs table-fixed w-full min-w-[1100px]">
        <colgroup>
          <col style={{ width: "200px" }} />
          {dias.map((d) => (
            <col key={d.dia} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 bg-gray-50 border-b border-gray-200 px-3 py-2.5 text-left text-[11px] uppercase tracking-wide font-semibold text-gray-500 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
              Veículo
            </th>
            {dias.map((d) => (
              <th
                key={d.dia}
                className={`border-b border-gray-200 py-2.5 text-center font-semibold ${
                  d.fimDeSemana
                    ? "bg-gray-100 text-gray-400"
                    : "text-gray-600"
                }`}
              >
                {d.dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {veiculos.length === 0 && (
            <tr>
              <td
                colSpan={dias.length + 1}
                className="px-6 py-12 text-center text-gray-500"
              >
                Nenhum veículo cadastrado.
              </td>
            </tr>
          )}
          {veiculos.map((v, idx) => {
            const linha = grade.get(v.id);
            const zebra = idx % 2 === 0 ? "bg-white" : "bg-gray-50/50";
            return (
              <tr key={v.id} className={`group ${zebra} hover:bg-blue-50/30`}>
                <td
                  className={`sticky left-0 ${zebra} group-hover:bg-blue-50/30 border-b border-gray-100 px-3 py-2 font-medium text-gray-900 whitespace-nowrap z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]`}
                >
                  <div className="leading-tight">
                    <div className="font-semibold text-gray-900 text-[13px]">
                      {v.placa}
                    </div>
                    <div className="text-gray-500 text-[11px] font-normal">
                      {v.modelo}
                    </div>
                  </div>
                </td>
                {dias.map((d) => {
                  const a = linha?.get(d.dia);
                  if (!a) {
                    return (
                      <td
                        key={d.dia}
                        className={`border-b border-gray-100 h-10 ${
                          d.fimDeSemana ? "bg-gray-50/80" : ""
                        }`}
                      />
                    );
                  }
                  const sigla = a.unidade?.sigla ?? a.solicitante;
                  const cor = corParaSigla(sigla);
                  return (
                    <td
                      key={d.dia}
                      className="border-b border-gray-100 p-0.5"
                      title={`${sigla} · ${a.motivo} · ${formatHoraCurta(
                        a.dataInicio
                      )} → ${formatHoraCurta(a.dataFim)}`}
                    >
                      <Link
                        href={`/agendamentos/${a.id}`}
                        className={`flex items-center justify-center h-9 px-1 rounded ${cor.bg} ${cor.fg} text-[10px] font-bold tracking-wide hover:ring-2 ${cor.ring} hover:ring-offset-0 transition-all`}
                      >
                        <span className="truncate">{sigla}</span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
