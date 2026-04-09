import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function VeiculosPage() {
  const veiculos = await prisma.veiculo.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      manutencoes: {
        include: { itens: true },
      },
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Veículos</h1>
        <Link
          href="/veiculos/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Veículo
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ano</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Manutenção</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {veiculos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  Nenhum veículo cadastrado.
                </td>
              </tr>
            )}
            {veiculos.map((v) => {
              const custoTotal = v.manutencoes.reduce(
                (acc, m) => acc + m.itens.reduce((a, i) => a + i.valor, 0),
                0
              );
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link href={`/veiculos/${v.id}`} className="hover:text-blue-600">
                      {v.placa}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{v.modelo}</td>
                  <td className="px-6 py-4 text-gray-700">{v.marca}</td>
                  <td className="px-6 py-4 text-gray-700">{v.ano}</td>
                  <td className="px-6 py-4 text-gray-700 capitalize">{v.tipo}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {v.quilometragem.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {custoTotal > 0
                      ? `R$ ${custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <Link href={`/veiculos/${v.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      Ver
                    </Link>
                    <Link href={`/veiculos/${v.id}/editar`} className="text-gray-500 hover:text-gray-700 font-medium">
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
