import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function brl(valor: number | null) {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ServicosCatalogoPage() {
  const servicos = await prisma.servico.findMany({ orderBy: { nome: "asc" } });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h1>
        <Link
          href="/catalogo/servicos/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Serviço
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor ref.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servicos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Nenhum serviço cadastrado.
                </td>
              </tr>
            )}
            {servicos.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{s.nome}</td>
                <td className="px-6 py-4 text-gray-700 max-w-md truncate">{s.descricao || "—"}</td>
                <td className="px-6 py-4 text-gray-700">{brl(s.valorReferencia)}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={s.ativo ? "ativo" : "inativo"} />
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/catalogo/servicos/${s.id}/editar`}
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
