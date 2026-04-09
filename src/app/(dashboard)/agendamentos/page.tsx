import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AgendamentosPage() {
  const agendamentos = await prisma.agendamento.findMany({
    orderBy: { dataInicio: "asc" },
    include: { veiculo: true },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
        <Link
          href="/agendamentos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Agendamento
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitante</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agendamentos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhum agendamento registrado.
                </td>
              </tr>
            )}
            {agendamentos.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{a.veiculo.placa}</td>
                <td className="px-6 py-4 text-gray-700">{a.solicitante}</td>
                <td className="px-6 py-4 text-gray-700">{a.motivo}</td>
                <td className="px-6 py-4 text-gray-700">
                  {new Date(a.dataInicio).toLocaleString("pt-BR")}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {new Date(a.dataFim).toLocaleString("pt-BR")}
                </td>
                <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
