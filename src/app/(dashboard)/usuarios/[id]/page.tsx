import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      ativo: true,
      matricula: true,
      primeiroAcesso: true,
      criadoEm: true,
      atualizadoEm: true,
      ultimoLogin: true,
      _count: { select: { auditLogs: true } },
    },
  });

  if (!usuario) return notFound();

  const fmt = (d: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/usuarios" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Voltar para usuarios
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{usuario.nome}</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/usuarios/${id}/editar`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Usuario</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Nome</dt>
              <dd className="text-sm font-medium text-gray-900">{usuario.nome}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">E-mail</dt>
              <dd className="text-sm font-medium text-gray-900">{usuario.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Tipo</dt>
              <dd>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.tipo === "ADMINISTRADOR"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {usuario.tipo}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Matricula</dt>
              <dd className="text-sm font-medium text-gray-900">
                {usuario.matricula || "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.ativo
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {usuario.ativo ? "Ativo" : "Inativo"}
                </span>
                {usuario.primeiroAcesso && usuario.ativo && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Aguardando primeiro login
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacoes do Sistema</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Criado em</dt>
              <dd className="text-sm font-medium text-gray-900">{fmt(usuario.criadoEm)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Atualizado em</dt>
              <dd className="text-sm font-medium text-gray-900">{fmt(usuario.atualizadoEm)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Ultimo login</dt>
              <dd className="text-sm font-medium text-gray-900">{fmt(usuario.ultimoLogin)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Acoes registradas</dt>
              <dd className="text-sm font-medium text-gray-900">{usuario._count.auditLogs}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
