import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function UnidadeDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const unidade = await prisma.unidade.findUnique({
    where: { id },
    include: {
      _count: { select: { viagens: true } },
    },
  });

  if (!unidade) {
    return (
      <div className="text-center py-12 text-gray-500">
        Unidade não encontrada.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Unidade: {unidade.sigla}
        </h1>
        <Link
          href={`/unidades/${unidade.id}/editar`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Editar
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Sigla</p>
            <p className="text-lg font-medium text-gray-900">{unidade.sigla}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={unidade.ativo ? "ativo" : "inativo"} />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Nome Completo</p>
          <p className="text-lg font-medium text-gray-900">{unidade.nome}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Viagens Vinculadas</p>
            <p className="text-lg font-medium text-gray-900">
              {unidade._count.viagens}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Criada em</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(unidade.criadoEm).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/unidades"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Voltar para lista
        </Link>
      </div>
    </div>
  );
}
