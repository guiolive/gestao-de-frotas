import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || value === 0) return "—";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

interface Filters {
  status?: string;
  veiculoId?: string;
  motoristaId?: string;
  unidadeId?: string;
  ufDestino?: string;
  q?: string;
  dataInicio?: string;
  dataFim?: string;
}

export default async function ViagensPage({
  searchParams,
}: {
  searchParams: Filters;
}) {
  const filters = searchParams;

  const hasFilters = Object.values(filters).some((v) => v);

  // Build query params for API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (filters.status) where.status = filters.status;
  if (filters.veiculoId) where.veiculoId = filters.veiculoId;
  if (filters.motoristaId) where.motoristaId = filters.motoristaId;
  if (filters.unidadeId) where.unidadeId = filters.unidadeId;
  if (filters.ufDestino) where.ufDestino = filters.ufDestino;

  if (filters.dataInicio || filters.dataFim) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataSaida: any = {};
    if (filters.dataInicio) dataSaida.gte = new Date(filters.dataInicio);
    if (filters.dataFim) dataSaida.lte = new Date(filters.dataFim + "T23:59:59.999Z");
    where.dataSaida = dataSaida;
  }

  if (filters.q) {
    where.OR = [
      { destino: { contains: filters.q } },
      { origem: { contains: filters.q } },
      { solicitante: { contains: filters.q } },
      { processoSei: { contains: filters.q } },
    ];
  }

  const [viagens, veiculos, motoristas, unidades] = await Promise.all([
    prisma.viagem.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      include: {
        veiculo: true,
        motorista: true,
        motorista2: true,
        unidade: true,
      },
    }),
    prisma.veiculo.findMany({ orderBy: { placa: "asc" }, select: { id: true, placa: true, modelo: true } }),
    prisma.motorista.findMany({ where: { status: "ativo" }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    prisma.unidade.findMany({ orderBy: { sigla: "asc" }, select: { id: true, sigla: true } }),
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Viagens</h1>
        <Link
          href="/viagens/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Viagem
        </Link>
      </div>

      {/* Filters */}
      <form className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Row 1: Text search */}
        <div className="mb-3">
          <input
            type="text"
            name="q"
            defaultValue={filters.q || ""}
            placeholder="Buscar por destino, origem, solicitante ou processo SEI..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Row 2: Dropdowns */}
        <div className="flex gap-3 items-end flex-wrap mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue={filters.status || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="agendada">Agendada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Veículo</label>
            <select
              name="veiculoId"
              defaultValue={filters.veiculoId || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Motorista</label>
            <select
              name="motoristaId"
              defaultValue={filters.motoristaId || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Unidade</label>
            <select
              name="unidadeId"
              defaultValue={filters.unidadeId || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.sigla}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">UF Destino</label>
            <select
              name="ufDestino"
              defaultValue={filters.ufDestino || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Date range + actions */}
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Início</label>
            <input
              type="date"
              name="dataInicio"
              defaultValue={filters.dataInicio || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Fim</label>
            <input
              type="date"
              name="dataFim"
              defaultValue={filters.dataFim || ""}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/viagens"
              className="text-sm text-blue-600 hover:text-blue-800 py-2"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      </form>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-3">
        {viagens.length} viagem{viagens.length !== 1 ? "ns" : ""} encontrada{viagens.length !== 1 ? "s" : ""}
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processo SEI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista 2</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd Diárias</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total R$</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {viagens.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma viagem encontrada.
                  </td>
                </tr>
              )}
              {viagens.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{v.processoSei || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(v.dataSaida)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.unidade?.sigla || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.motorista.nome}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.motorista2?.nome || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.destino}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.ufDestino || "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.veiculo.placa}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.qtdDiarias ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(v.totalDiarias)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/viagens/${v.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Ver
                    </Link>
                    <Link href={`/viagens/${v.id}/editar`} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
