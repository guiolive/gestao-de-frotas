import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

/**
 * Dashboard Prime — OS atualmente em oficina externa, agrupadas em três
 * estados visíveis pra CMAN agir:
 *
 *   1. Em atraso: enviadaPrimeEm IS NOT NULL && retornoEfetivoEm IS NULL
 *      && previsaoSaida < hoje
 *   2. Em Prime (no prazo): mesma condição mas previsaoSaida >= hoje
 *      (ou previsaoSaida null = sem prazo definido).
 *   3. Aguardando envio: enviadaPrimeEm IS NULL && status in
 *      (aguardando, em_andamento) — útil pra cobrar quem ainda não despachou.
 */
export default async function PrimeDashboardPage() {
  const hoje = new Date();

  const emPrime = await prisma.manutencao.findMany({
    where: { enviadaPrimeEm: { not: null }, retornoEfetivoEm: null },
    include: { veiculo: true, oficina: true },
    orderBy: { previsaoSaida: "asc" },
  });

  const aguardandoEnvio = await prisma.manutencao.findMany({
    where: {
      enviadaPrimeEm: null,
      status: { in: ["aguardando", "em_andamento"] },
    },
    include: { veiculo: true, oficina: true },
    orderBy: { dataEntrada: "asc" },
  });

  const atrasadas = emPrime.filter(
    (m) => m.previsaoSaida && new Date(m.previsaoSaida) < hoje
  );
  const noPrazo = emPrime.filter(
    (m) => !m.previsaoSaida || new Date(m.previsaoSaida) >= hoje
  );

  const diasAtraso = (m: { previsaoSaida: Date | null }) =>
    m.previsaoSaida
      ? Math.floor((hoje.getTime() - new Date(m.previsaoSaida).getTime()) / 86400000)
      : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutenções Prime</h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento de OS na oficina externa.
          </p>
        </div>
        <Link
          href="/manutencoes"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Todas as manutenções
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-4">
          <p className="text-sm text-red-700">Em atraso</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{atrasadas.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-4">
          <p className="text-sm text-blue-700">Em Prime (no prazo)</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{noPrazo.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg shadow p-4">
          <p className="text-sm text-amber-700">Aguardando envio</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{aguardandoEnvio.length}</p>
        </div>
      </div>

      <Tabela
        titulo="Em atraso"
        cor="red"
        manutencoes={atrasadas}
        coluna="atraso"
        diasAtraso={diasAtraso}
      />
      <Tabela
        titulo="Em Prime (no prazo)"
        cor="blue"
        manutencoes={noPrazo}
        coluna="previsao"
      />
      <Tabela
        titulo="Aguardando envio para Prime"
        cor="amber"
        manutencoes={aguardandoEnvio}
        coluna="entrada"
      />
    </div>
  );
}

interface ManutencaoRow {
  id: string;
  dataEntrada: Date;
  previsaoSaida: Date | null;
  enviadaPrimeEm: Date | null;
  status: string;
  descricao: string;
  veiculo: { id: string; placa: string; marca: string; modelo: string };
  oficina: { id: string; nome: string } | null;
}

function Tabela({
  titulo,
  cor,
  manutencoes,
  coluna,
  diasAtraso,
}: {
  titulo: string;
  cor: "red" | "blue" | "amber";
  manutencoes: ManutencaoRow[];
  coluna: "atraso" | "previsao" | "entrada";
  diasAtraso?: (m: ManutencaoRow) => number;
}) {
  if (manutencoes.length === 0) return null;
  const headerColor =
    cor === "red"
      ? "bg-red-100 text-red-800"
      : cor === "blue"
        ? "bg-blue-100 text-blue-800"
        : "bg-amber-100 text-amber-800";

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className={`px-6 py-3 ${headerColor} font-semibold`}>{titulo}</div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oficina</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              {coluna === "atraso" ? "Atraso" : coluna === "previsao" ? "Previsão" : "Entrada"}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {manutencoes.map((m) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm">
                <Link
                  href={`/manutencoes/${m.id}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {m.veiculo.placa}
                </Link>
                <p className="text-xs text-gray-500">
                  {m.veiculo.marca} {m.veiculo.modelo}
                </p>
              </td>
              <td className="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                {m.descricao}
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {m.oficina ? (
                  <Link
                    href={`/oficinas/${m.oficina.id}`}
                    className="hover:text-blue-600"
                  >
                    {m.oficina.nome}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-6 py-4 text-sm">
                {coluna === "atraso" && diasAtraso ? (
                  <span className="text-red-700 font-bold">
                    {diasAtraso(m)} dia{diasAtraso(m) !== 1 ? "s" : ""}
                  </span>
                ) : coluna === "previsao" ? (
                  <span className="text-gray-700">
                    {m.previsaoSaida
                      ? new Date(m.previsaoSaida).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                ) : (
                  <span className="text-gray-700">
                    {new Date(m.dataEntrada).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={m.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
