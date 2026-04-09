import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function fmtCPF(c: string) {
  const d = c.replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : c;
}

function fmtTel(t: string) {
  const d = t.replace(/\D/g, "");
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : t;
}

export default async function MotoristasPage() {
  const motoristas = await prisma.motorista.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      _count: { select: { viagens: true, viagensComoM2: true } },
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Motoristas</h1>
        <Link
          href="/motoristas/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Motorista
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNH</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viagens</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {motoristas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  Nenhum motorista cadastrado.
                </td>
              </tr>
            )}
            {motoristas.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link href={`/motoristas/${m.id}`} className="hover:text-blue-600">
                    {m.nome}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-700">{fmtCPF(m.cpf)}</td>
                <td className="px-6 py-4 text-gray-700">{m.cnh}</td>
                <td className="px-6 py-4 text-gray-700">{m.categoriaCnh}</td>
                <td className="px-6 py-4 text-gray-700">{fmtTel(m.telefone)}</td>
                <td className="px-6 py-4 text-gray-700">{m._count.viagens + m._count.viagensComoM2}</td>
                <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                <td className="px-6 py-4 flex gap-3">
                  <Link href={`/motoristas/${m.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    Ver
                  </Link>
                  <Link href={`/motoristas/${m.id}/editar`} className="text-gray-500 hover:text-gray-700 font-medium">
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
