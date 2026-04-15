import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      ativo: true,
      matricula: true,
      primeiroAcesso: true,
      criadoEm: true,
      ultimoLogin: true,
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <Link
          href="/usuarios/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Novo Usuario
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matricula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ultimo Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Nenhum usuario cadastrado.
                </td>
              </tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link href={`/usuarios/${u.id}`} className="hover:text-blue-600">
                    {u.nome}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-700">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.tipo === "ADMINISTRADOR"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {u.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{u.matricula || "—"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.ativo
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                  {u.primeiroAcesso && u.ativo && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-700 text-sm">
                  {u.ultimoLogin
                    ? new Date(u.ultimoLogin).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Nunca"}
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <Link href={`/usuarios/${u.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    Ver
                  </Link>
                  <Link href={`/usuarios/${u.id}/editar`} className="text-gray-500 hover:text-gray-700 font-medium">
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
