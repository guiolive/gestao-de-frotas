import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const [
    totalVeiculos,
    veiculosDisponiveis,
    veiculosEmUso,
    veiculosManutencao,
    veiculosInativos,
    totalMotoristas,
    proximosAgendamentos,
    manutencoesAndamento,
    viagensDoDia,
    veiculosComCustos,
  ] = await Promise.all([
    prisma.veiculo.count(),
    prisma.veiculo.count({ where: { status: "disponivel" } }),
    prisma.veiculo.count({ where: { status: "em_uso" } }),
    prisma.veiculo.count({ where: { status: "manutencao" } }),
    prisma.veiculo.count({ where: { status: "inativo" } }),
    prisma.motorista.count({ where: { status: "ativo" } }),
    prisma.agendamento.findMany({
      where: { dataInicio: { gte: hoje }, status: { not: "cancelado" } },
      orderBy: { dataInicio: "asc" },
      take: 5,
      include: { veiculo: true },
    }),
    prisma.manutencao.findMany({
      where: { status: { in: ["aguardando", "em_andamento"] } },
      orderBy: { criadoEm: "desc" },
      include: { veiculo: true, itens: true },
    }),
    prisma.viagem.findMany({
      where: { dataSaida: { gte: hoje, lt: amanha } },
      include: { veiculo: true, motorista: true },
    }),
    prisma.veiculo.findMany({
      include: {
        manutencoes: { include: { itens: true } },
        viagens: true,
      },
    }),
  ]);

  const custosPorVeiculo = veiculosComCustos
    .map((v) => {
      const custoManutencao = v.manutencoes.reduce(
        (acc, m) => acc + m.itens.reduce((a, i) => a + i.valor, 0),
        0
      );
      const totalViagens = v.viagens.length;
      const kmPercorrido = v.viagens.reduce((acc, vi) => {
        if (vi.kmFinal && vi.kmInicial) return acc + (vi.kmFinal - vi.kmInicial);
        return acc;
      }, 0);
      return {
        id: v.id,
        placa: v.placa,
        modelo: v.modelo,
        custoManutencao,
        totalViagens,
        kmPercorrido,
        custoPorKm: kmPercorrido > 0 ? custoManutencao / kmPercorrido : 0,
      };
    })
    .sort((a, b) => b.custoManutencao - a.custoManutencao);

  const custoTotalFrota = custosPorVeiculo.reduce((acc, v) => acc + v.custoManutencao, 0);
  const maiorCusto = custosPorVeiculo[0]?.custoManutencao || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Cards de resumo - Linha 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total de Veiculos</p>
          <p className="text-3xl font-bold text-gray-900">{totalVeiculos}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg shadow p-5">
          <p className="text-sm text-green-600">Disponiveis</p>
          <p className="text-3xl font-bold text-green-700">{veiculosDisponiveis}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-5">
          <p className="text-sm text-blue-600">Em Uso</p>
          <p className="text-3xl font-bold text-blue-700">{veiculosEmUso}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-5">
          <p className="text-sm text-yellow-600">Em Manutencao</p>
          <p className="text-3xl font-bold text-yellow-700">{veiculosManutencao}</p>
        </div>
      </div>

      {/* Cards de resumo - Linha 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-5">
          <p className="text-sm text-red-600">Inativos</p>
          <p className="text-3xl font-bold text-red-700">{veiculosInativos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Motoristas Ativos</p>
          <p className="text-3xl font-bold text-gray-900">{totalMotoristas}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Viagens Hoje</p>
          <p className="text-3xl font-bold text-gray-900">{viagensDoDia.length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg shadow p-5">
          <p className="text-sm text-purple-600">Custo Total Frota</p>
          <p className="text-2xl font-bold text-purple-700">
            R$ {custoTotalFrota.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Comparacao de custos por veiculo */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Custo de Manutencao por Veiculo</h2>
          <Link href="/veiculos" className="text-sm text-blue-600 hover:text-blue-800">Ver veiculos</Link>
        </div>
        <div className="p-6">
          {custosPorVeiculo.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum veiculo cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {custosPorVeiculo.map((v) => {
                const pct = maiorCusto > 0 ? (v.custoManutencao / maiorCusto) * 100 : 0;
                return (
                  <div key={v.id}>
                    <div className="flex justify-between items-center mb-1">
                      <Link href={`/veiculos/${v.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {v.placa} — {v.modelo}
                      </Link>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">{v.totalViagens} viagens</span>
                        {v.kmPercorrido > 0 && (
                          <span className="text-gray-500">{v.kmPercorrido.toLocaleString("pt-BR")} km</span>
                        )}
                        {v.custoPorKm > 0 && (
                          <span className="text-gray-400">R$ {v.custoPorKm.toFixed(2)}/km</span>
                        )}
                        <span className="font-semibold text-gray-900">
                          R$ {v.custoManutencao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          v.custoManutencao === maiorCusto && maiorCusto > 0
                            ? "bg-red-500"
                            : v.custoManutencao > 0
                            ? "bg-blue-500"
                            : "bg-gray-200"
                        }`}
                        style={{ width: `${Math.max(pct, v.custoManutencao > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proximos Agendamentos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Proximos Agendamentos</h2>
            <Link href="/agendamentos" className="text-sm text-blue-600 hover:text-blue-800">Ver todos</Link>
          </div>
          <div className="divide-y">
            {proximosAgendamentos.length === 0 ? (
              <p className="px-6 py-4 text-gray-500 text-sm">Nenhum agendamento proximo.</p>
            ) : (
              proximosAgendamentos.map((a) => (
                <div key={a.id} className="px-6 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{a.veiculo.placa}</p>
                    <p className="text-sm text-gray-500">{a.solicitante} - {a.motivo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">
                      {new Date(a.dataInicio).toLocaleDateString("pt-BR")}
                    </p>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manutencoes Ativas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Manutencoes Ativas</h2>
            <Link href="/manutencoes" className="text-sm text-blue-600 hover:text-blue-800">Ver todas</Link>
          </div>
          <div className="divide-y">
            {manutencoesAndamento.length === 0 ? (
              <p className="px-6 py-4 text-gray-500 text-sm">Nenhuma manutencao ativa.</p>
            ) : (
              manutencoesAndamento.map((m) => {
                const custo = m.itens.reduce((a, i) => a + i.valor, 0);
                return (
                  <Link key={m.id} href={`/manutencoes/${m.id}`} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{m.veiculo.placa}</p>
                        <p className="text-sm text-gray-500">
                          <StatusBadge status={m.tipo} />{" "}
                          {m.descricao.substring(0, 40)}{m.descricao.length > 40 ? "..." : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        {custo > 0 && (
                          <p className="text-sm font-semibold text-gray-900">
                            R$ {custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        <StatusBadge status={m.status} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Viagens de Hoje */}
        <div className="bg-white rounded-lg shadow col-span-1 lg:col-span-2">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Viagens de Hoje</h2>
            <Link href="/viagens" className="text-sm text-blue-600 hover:text-blue-800">Ver todas</Link>
          </div>
          <div className="divide-y">
            {viagensDoDia.length === 0 ? (
              <p className="px-6 py-4 text-gray-500 text-sm">Nenhuma viagem para hoje.</p>
            ) : (
              viagensDoDia.map((v) => (
                <Link key={v.id} href={`/viagens/${v.id}`} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{v.veiculo.placa} - {v.motorista.nome}</p>
                      <p className="text-sm text-gray-500">{v.origem} → {v.destino}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">
                        {new Date(v.dataSaida).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <StatusBadge status={v.status} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
