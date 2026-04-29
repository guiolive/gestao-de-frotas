import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatCurrency(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ManutencoesPage({
  searchParams,
}: {
  searchParams: { tipo?: string; status?: string };
}) {
  const filters = searchParams;

  const where: Record<string, string> = {};
  if (filters.tipo) where.tipo = filters.tipo;
  if (filters.status) where.status = filters.status;

  const manutencoes = await prisma.manutencao.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: { veiculo: true, checklist: true, itens: true },
  });

  const custoTotalGeral = manutencoes.reduce(
    (acc, m) => acc + m.itens.reduce((a, i) => a + i.valor, 0),
    0
  );

  // Contagem de OS Prime em atraso (independente dos filtros da listagem,
  // pra sinalizar de forma estável o backlog.)
  const hoje = new Date();
  const atrasadas = await prisma.manutencao.count({
    where: {
      enviadaPrimeEm: { not: null },
      retornoEfetivoEm: null,
      previsaoSaida: { lt: hoje },
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutenções</h1>
          <p className="text-sm text-gray-500 mt-1">
            Custo total:{" "}
            <span className="font-semibold text-gray-700">
              {formatCurrency(custoTotalGeral)}
            </span>
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/manutencoes/prime"
            title="Acompanhar OS enviadas para a oficina terceirizada Prime"
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              atrasadas > 0
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            OS na Prime
            {atrasadas > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white text-red-700 text-xs font-bold">
                {atrasadas}
              </span>
            )}
          </Link>
          <Link
            href="/manutencoes/nova"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nova Manutenção
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select
            name="tipo"
            defaultValue={filters.tipo || ""}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="preventiva">Preventiva</option>
            <option value="corretiva">Corretiva</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            <option value="aguardando">Aguardando</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Filtrar
        </button>
        {(filters.tipo || filters.status) && (
          <Link
            href="/manutencoes"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Real</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problemas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {manutencoes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma manutenção registrada.
                  </td>
                </tr>
              )}
              {manutencoes.map((m) => {
                const problemas = m.checklist.filter((c) => c.temProblema).length;
                const custoReal = m.itens.reduce(
                  (acc: number, i: { valor: number }) => acc + i.valor,
                  0
                );
                const estourou = m.custoEstimado && custoReal > m.custoEstimado;
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/veiculos/${m.veiculoId}`}
                        className="hover:text-blue-600"
                      >
                        {m.veiculo.placa}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.tipo} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate text-sm">
                      {m.descricao}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {new Date(m.dataEntrada).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {m.custoEstimado ? formatCurrency(m.custoEstimado) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium text-sm ${
                        estourou ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {custoReal > 0 ? formatCurrency(custoReal) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium text-sm ${
                          problemas > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {problemas} / {m.checklist.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/manutencoes/${m.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
