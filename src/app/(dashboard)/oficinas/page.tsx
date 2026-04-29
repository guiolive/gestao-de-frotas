import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatCnpj(cnpj: string) {
  if (cnpj.length !== 14) return cnpj;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

export default async function OficinasPage() {
  const oficinas = await prisma.oficina.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { manutencoes: true } } },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Oficinas</h1>
        <Link
          href="/oficinas/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Oficina
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manut.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {oficinas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma oficina cadastrada.
                </td>
              </tr>
            )}
            {oficinas.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{o.nome}</td>
                <td className="px-6 py-4 text-gray-700">{formatCnpj(o.cnpj)}</td>
                <td className="px-6 py-4 text-gray-700">{o.whatsapp || "—"}</td>
                <td className="px-6 py-4 text-gray-700">{o._count.manutencoes}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={o.ativa ? "ativo" : "inativo"} />
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <Link href={`/oficinas/${o.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    Ver
                  </Link>
                  <Link href={`/oficinas/${o.id}/editar`} className="text-gray-500 hover:text-gray-700 font-medium">
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
