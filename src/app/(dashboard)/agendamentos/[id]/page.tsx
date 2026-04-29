import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verificarToken } from "@/lib/jwt";
import StatusBadge from "@/components/StatusBadge";
import EditarAgendamentoForm from "./EditarAgendamentoForm";

export const dynamic = "force-dynamic";

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR");
}

/**
 * Lê o tipo do usuário corrente do JWT no cookie. Usado só para gating
 * de UI (botão "Excluir"); a API revalida via header `x-user-tipo`
 * setado pelo proxy. Falha silenciosa = não-admin.
 */
async function getTipoUsuario(): Promise<"OPERADOR" | "ADMINISTRADOR" | null> {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  const payload = await verificarToken(token);
  const tipo = payload?.tipo;
  if (tipo === "ADMINISTRADOR" || tipo === "OPERADOR") return tipo;
  return null;
}

export default async function VisualizarAgendamentoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    include: {
      veiculo: true,
      unidade: true,
      viagens: {
        include: { motorista: true },
        orderBy: { dataSaida: "asc" },
      },
    },
  });

  if (!agendamento) return notFound();

  const [veiculos, unidades, tipoUsuario] = await Promise.all([
    prisma.veiculo.findMany({
      where: { status: { not: "inativo" } },
      orderBy: [{ tipo: "asc" }, { placa: "asc" }],
    }),
    prisma.unidade.findMany({
      where: { ativo: true },
      orderBy: { sigla: "asc" },
    }),
    getTipoUsuario(),
  ]);

  const isAdmin = tipoUsuario === "ADMINISTRADOR";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Agendamento · {agendamento.veiculo.placa}
        </h1>
        <Link
          href="/agendamentos"
          className="text-gray-600 hover:underline text-sm"
        >
          ← Voltar para a grade
        </Link>
      </div>

      {/* Cabeçalho de detalhes (read-only) */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">Veículo</p>
          <p className="font-medium text-gray-900">
            {agendamento.veiculo.placa} — {agendamento.veiculo.modelo}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Unidade solicitante</p>
          <p className="font-medium text-gray-900">
            {agendamento.unidade?.sigla ?? agendamento.solicitante}
            {agendamento.unidade?.nome && (
              <span className="text-gray-500 font-normal">
                {" "}
                — {agendamento.unidade.nome}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Período</p>
          <p className="font-medium text-gray-900">
            {formatDateTime(agendamento.dataInicio)} →{" "}
            {formatDateTime(agendamento.dataFim)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Status</p>
          <StatusBadge status={agendamento.status} />
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500 uppercase">Motivo</p>
          <p className="text-gray-900">{agendamento.motivo}</p>
        </div>
        {agendamento.observacao && (
          <div className="col-span-2">
            <p className="text-xs text-gray-500 uppercase">Observação</p>
            <p className="text-gray-900 whitespace-pre-line">
              {agendamento.observacao}
            </p>
          </div>
        )}
        <div className="col-span-2 text-xs text-gray-500">
          Criado em {formatDateTime(agendamento.criadoEm)}
        </div>
      </div>

      {/* Viagens vinculadas */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Viagens vinculadas
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({agendamento.viagens.length})
            </span>
          </h2>
          {agendamento.status === "aprovado" && (
            <Link
              href={`/viagens/nova?agendamentoId=${agendamento.id}&veiculoId=${agendamento.veiculoId}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm"
            >
              + Registrar viagem
            </Link>
          )}
        </div>
        {agendamento.viagens.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Nenhuma viagem foi vinculada a este agendamento ainda.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {agendamento.viagens.map((v) => (
              <li key={v.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">
                    {v.origem} → {v.destino}
                  </span>
                  <span className="text-gray-500 ml-2">
                    · {v.motorista.nome} · {formatDateTime(v.dataSaida)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={v.status} />
                  <Link
                    href={`/viagens/${v.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Formulário de edição + ações */}
      <EditarAgendamentoForm
        agendamento={{
          id: agendamento.id,
          veiculoId: agendamento.veiculoId,
          unidadeId: agendamento.unidadeId,
          motivo: agendamento.motivo,
          observacao: agendamento.observacao,
          dataInicio: agendamento.dataInicio.toISOString(),
          dataFim: agendamento.dataFim.toISOString(),
          status: agendamento.status,
        }}
        veiculos={veiculos.map((v) => ({
          id: v.id,
          placa: v.placa,
          modelo: v.modelo,
        }))}
        unidades={unidades.map((u) => ({
          id: u.id,
          sigla: u.sigla,
          nome: u.nome,
        }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
