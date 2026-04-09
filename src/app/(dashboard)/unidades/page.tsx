import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function UnidadesPage() {
  const unidades = await prisma.unidade.findMany({
    orderBy: { sigla: "asc" },
    include: {
      _count: { select: { viagens: true } },
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Unidades</h1>
        <Link
          href="/unidades/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Unidade
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sigla
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Viagens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {unidades.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Nenhuma unidade cadastrada.
                </td>
              </tr>
            )}
            {unidades.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {u.sigla}
                </td>
                <td className="px-6 py-4 text-gray-700">{u.nome}</td>
                <td className="px-6 py-4 text-gray-700">
                  {u._count.viagens}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={u.ativo ? "ativo" : "inativo"} />
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <Link
                    href={`/unidades/${u.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/unidades/${u.id}/editar`}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
