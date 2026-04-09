import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatDate(date: Date | string | null): string {
  if (!date) return "\u2014";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || value === 0) return "\u2014";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ViagensPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; veiculoId?: string; motoristaId?: string }>;
}) {
  const filters = await searchParams;

  const where: Record<string, string> = {};
  if (filters.status) where.status = filters.status;
  if (filters.veiculoId) where.veiculoId = filters.veiculoId;
  if (filters.motoristaId) where.motoristaId = filters.motoristaId;

  const viagens = await prisma.viagem.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Viagens</h1>
        <Link
          href="/viagens/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Viagem
        </Link>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="agendada">Agendada</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Conclu\u00edda</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Filtrar
        </button>
        {(filters.status || filters.veiculoId || filters.motoristaId) && (
          <Link
            href="/viagens"
            className="text-sm text-blue-600 hover:text-blue-800 py-2"
          >
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processo SEI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per\u00edodo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista 2</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Di\u00e1rias</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total R$</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">A\u00e7\u00f5es</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viagens.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma viagem registrada.
                  </td>
                </tr>
              )}
              {viagens.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{v.processoSei || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(v.dataSaida)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.unidade?.sigla || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.motorista.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.motorista2?.nome || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.destino}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.ufDestino || "\u2014"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.veiculo.placa}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.qtdDiarias ?? "\u2014"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(v.totalDiarias)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/viagens/${v.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Ver
                    </Link>
                    <Link href={`/viagens/${v.id}/editar`} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
