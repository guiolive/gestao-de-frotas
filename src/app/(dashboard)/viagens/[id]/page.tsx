import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// formatDate removido: não estava em uso. Reintroduzir se necessário.

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR");
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function VisualizarViagemPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const viagem = await prisma.viagem.findUnique({
    where: { id },
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
      agendamento: { include: { unidade: true } },
    },
  });

  if (!viagem) return notFound();

  const kmPercorrido =
    viagem.kmFinal && viagem.kmInicial
      ? viagem.kmFinal - viagem.kmInicial
      : null;

  const hasPcdp1 = viagem.pcdpNumero || viagem.pcdpData || viagem.pcdpValor;
  const hasPcdp2 = viagem.pcdp2Numero || viagem.pcdp2Data || viagem.pcdp2Valor;
  const hasDiarias = viagem.qtdDiarias || viagem.diaria || viagem.totalDiarias;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {viagem.origem} &rarr; {viagem.destino}
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/viagens/${id}/editar`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar
          </Link>
          <Link
            href="/viagens"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Voltar
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info grid */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações da Viagem</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-gray-500">Veículo</span>
              <p className="font-medium text-gray-900 mt-1">
                <Link
                  href={`/veiculos/${viagem.veiculoId}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {viagem.veiculo.placa} — {viagem.veiculo.modelo}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-gray-500">Motorista</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.motorista.nome}</p>
            </div>
            <div>
              <span className="text-gray-500">Motorista 2</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.motorista2?.nome || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Unidade</span>
              <p className="font-medium text-gray-900 mt-1">
                {viagem.unidade ? `${viagem.unidade.sigla} - ${viagem.unidade.nome}` : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Originada de</span>
              <p className="font-medium text-gray-900 mt-1">
                {viagem.agendamento ? (
                  <Link
                    href={`/agendamentos/${viagem.agendamento.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Agendamento{" "}
                    {viagem.agendamento.unidade?.sigla ?? viagem.agendamento.solicitante}{" "}
                    · {new Date(viagem.agendamento.dataInicio).toLocaleDateString("pt-BR")}
                  </Link>
                ) : (
                  <span className="text-gray-500 font-normal">Sem agendamento</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Origem</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.origem}</p>
            </div>
            <div>
              <span className="text-gray-500">Destino</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.destino}</p>
            </div>
            <div>
              <span className="text-gray-500">UF Destino</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.ufDestino || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Saída</span>
              <p className="font-medium text-gray-900 mt-1">{formatDateTime(viagem.dataSaida)}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Retorno</span>
              <p className="font-medium text-gray-900 mt-1">{formatDateTime(viagem.dataRetorno)}</p>
            </div>
            <div>
              <span className="text-gray-500">KM Inicial</span>
              <p className="font-medium text-gray-900 mt-1">
                {viagem.kmInicial.toLocaleString("pt-BR")} km
              </p>
            </div>
            <div>
              <span className="text-gray-500">KM Final</span>
              <p className="font-medium text-gray-900 mt-1">
                {viagem.kmFinal ? `${viagem.kmFinal.toLocaleString("pt-BR")} km` : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">KM Percorrido</span>
              <p className="font-medium text-gray-900 mt-1">
                {kmPercorrido !== null ? `${kmPercorrido.toLocaleString("pt-BR")} km` : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <div className="mt-1">
                <StatusBadge status={viagem.status} />
              </div>
            </div>
            <div>
              <span className="text-gray-500">Processo SEI</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.processoSei || "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Solicitante</span>
              <p className="font-medium text-gray-900 mt-1">{viagem.solicitante || "—"}</p>
            </div>
          </div>
        </div>

        {/* PCDP section */}
        {(hasPcdp1 || hasPcdp2) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">PCDP</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hasPcdp1 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Motorista 1</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Número</span>
                      <span className="font-medium text-gray-900">{viagem.pcdpNumero || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data</span>
                      <span className="font-medium text-gray-900">{viagem.pcdpData || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor</span>
                      <span className="font-medium text-gray-900">{formatCurrency(viagem.pcdpValor)}</span>
                    </div>
                  </div>
                </div>
              )}
              {hasPcdp2 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Motorista 2</h3>
                  <div className="space-y-2 text-sm">
                    {viagem.pcdp2Solicitante && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Solicitante</span>
                        <span className="font-medium text-gray-900">{viagem.pcdp2Solicitante}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Número</span>
                      <span className="font-medium text-gray-900">{viagem.pcdp2Numero || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data</span>
                      <span className="font-medium text-gray-900">{viagem.pcdp2Data || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor</span>
                      <span className="font-medium text-gray-900">{formatCurrency(viagem.pcdp2Valor)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diarias section */}
        {hasDiarias && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Diárias</h2>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-gray-500">Qtd Diárias</span>
                <p className="font-medium text-gray-900 mt-1">{viagem.qtdDiarias ?? "—"}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor Diária</span>
                <p className="font-medium text-gray-900 mt-1">{formatCurrency(viagem.diaria)}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Diárias</span>
                <p className="font-medium text-gray-900 mt-1">{formatCurrency(viagem.totalDiarias)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Observacoes */}
        {viagem.observacoes && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Observações</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{viagem.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
