import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const TIPOS_ALERTA: Record<string, string> = {
  troca_oleo: "Troca de Óleo",
  troca_pneus: "Troca de Pneus",
  revisao: "Revisão Geral",
  alinhamento: "Alinhamento e Balanceamento",
  filtro_ar: "Filtro de Ar",
  filtro_combustivel: "Filtro de Combustível",
  correia_dentada: "Correia Dentada",
  fluido_freio: "Fluido de Freio",
  fluido_arrefecimento: "Fluido de Arrefecimento",
};

export default async function ConsultarVeiculoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const veiculo = await prisma.veiculo.findUnique({
    where: { id },
    include: {
      imagens: true,
      alertasKm: { where: { ativo: true } },
      manutencoes: {
        include: { itens: true },
        orderBy: { criadoEm: "desc" },
      },
      viagens: {
        include: { motorista: true },
        orderBy: { dataSaida: "desc" },
        take: 10,
      },
    },
  });

  if (!veiculo) return notFound();

  // Relatorio calculations
  const custoTotalManutencao = veiculo.manutencoes.reduce(
    (acc, m) => acc + m.itens.reduce((a, i) => a + i.valor, 0),
    0
  );
  const diasParado = veiculo.manutencoes.reduce((acc, m) => acc + m.previsaoDias, 0);
  const totalViagens = veiculo.viagens.length;
  const kmRodado = veiculo.viagens.reduce((acc, v) => {
    if (v.kmFinal && v.kmInicial) return acc + (v.kmFinal - v.kmInicial);
    return acc;
  }, 0);
  const valorVeiculo = veiculo.valorVeiculo || 0;
  const percentualValor = valorVeiculo > 0 ? (custoTotalManutencao / valorVeiculo) * 100 : 0;
  const custoPorKm = kmRodado > 0 ? custoTotalManutencao / kmRodado : 0;

  // KM médio/dia para projeção
  const viagensComKm = veiculo.viagens.filter((v) => v.kmFinal && v.kmInicial);
  let kmMedioDia = 0;
  if (viagensComKm.length >= 2) {
    const kmTotal = viagensComKm.reduce((acc, v) => acc + ((v.kmFinal || 0) - v.kmInicial), 0);
    const datasViagens = viagensComKm.map((v) => new Date(v.dataSaida).getTime());
    const primeiraDia = new Date(Math.min(...datasViagens));
    const dias = Math.max(1, Math.floor((Date.now() - primeiraDia.getTime()) / (1000 * 60 * 60 * 24)));
    kmMedioDia = Math.round((kmTotal / dias) * 10) / 10;
  }

  // Find closest alert
  const alertasComKm = veiculo.alertasKm.map((a) => {
    const kmProxima = a.ultimaTrocaKm + a.intervaloKm;
    const kmRestante = kmProxima - veiculo.quilometragem;
    return { ...a, kmProxima, kmRestante };
  });
  const proximoAlerta = alertasComKm
    .filter((a) => a.kmRestante > 0)
    .sort((a, b) => a.kmRestante - b.kmRestante)[0];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {veiculo.placa} — {veiculo.marca} {veiculo.modelo}
          </h1>
          <p className="text-gray-500 mt-1 capitalize">{veiculo.tipo} | {veiculo.cor} | {veiculo.ano}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/veiculos/${id}/editar`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Editar
          </Link>
          <Link href="/veiculos" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Voltar
          </Link>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Custo Total Manutenção</p>
          <p className="text-xl font-bold text-gray-900">
            R$ {custoTotalManutencao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Dias Parado</p>
          <p className="text-xl font-bold text-gray-900">{diasParado}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Próxima Revisão</p>
          {proximoAlerta ? (
            <p className="text-lg font-bold text-gray-900">
              {TIPOS_ALERTA[proximoAlerta.tipo] || proximoAlerta.tipo}
              <span className="text-sm font-normal text-gray-500 ml-2">
                {Math.max(0, proximoAlerta.kmRestante).toLocaleString("pt-BR")} km restantes
              </span>
            </p>
          ) : (
            <p className="text-lg font-bold text-gray-400">--</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Viagens</p>
          <p className="text-xl font-bold text-gray-900">{totalViagens}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">KM Rodado</p>
          <p className="text-xl font-bold text-gray-900">{kmRodado.toLocaleString("pt-BR")} km</p>
          {kmMedioDia > 0 && (
            <p className="text-xs text-gray-400 mt-1">{kmMedioDia} km/dia média</p>
          )}
          {custoPorKm > 0 && (
            <p className="text-xs text-gray-400">R$ {custoPorKm.toFixed(2)}/km</p>
          )}
        </div>
        <div
          className={`rounded-lg shadow p-4 ${
            percentualValor > 60
              ? "bg-red-50 border border-red-200"
              : percentualValor > 30
              ? "bg-amber-50 border border-amber-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <p className="text-sm text-gray-500">% do Valor</p>
          <p
            className={`text-xl font-bold ${
              percentualValor > 60
                ? "text-red-700"
                : percentualValor > 30
                ? "text-amber-700"
                : "text-green-700"
            }`}
          >
            {percentualValor.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{percentualValor.toFixed(1)}% do valor do veículo</p>
        </div>
      </div>

      {/* Vehicle info card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados do Veículo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Placa</span>
            <p className="font-medium text-gray-900 mt-1">{veiculo.placa}</p>
          </div>
          <div>
            <span className="text-gray-500">Tipo</span>
            <p className="font-medium text-gray-900 mt-1 capitalize">{veiculo.tipo}</p>
          </div>
          <div>
            <span className="text-gray-500">Marca/Modelo</span>
            <p className="font-medium text-gray-900 mt-1">{veiculo.marca} {veiculo.modelo}</p>
          </div>
          <div>
            <span className="text-gray-500">Ano</span>
            <p className="font-medium text-gray-900 mt-1">{veiculo.ano}</p>
          </div>
          <div>
            <span className="text-gray-500">Cor</span>
            <p className="font-medium text-gray-900 mt-1 capitalize">{veiculo.cor}</p>
          </div>
          <div>
            <span className="text-gray-500">Quilometragem</span>
            <p className="font-medium text-gray-900 mt-1">{veiculo.quilometragem.toLocaleString("pt-BR")} km</p>
          </div>
          <div>
            <span className="text-gray-500">Valor</span>
            <p className="font-medium text-gray-900 mt-1">
              {valorVeiculo > 0
                ? `R$ ${valorVeiculo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "--"}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <div className="mt-1"><StatusBadge status={veiculo.status} /></div>
          </div>
        </div>
      </div>

      {/* Photos grid */}
      {veiculo.imagens.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Fotos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {veiculo.imagens.map((img) => (
              <img key={img.id} src={img.url} alt={img.descricao || "Foto"} className="w-full h-48 object-cover rounded-lg border" />
            ))}
          </div>
        </div>
      )}

      {/* Maintenance history table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Histórico de Manutenções</h2>
          <Link href="/manutencoes" className="text-sm text-blue-600 hover:text-blue-800">Ver todas</Link>
        </div>
        {veiculo.manutencoes.length === 0 ? (
          <p className="px-6 py-4 text-gray-500 text-sm">Nenhuma manutenção registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {veiculo.manutencoes.map((m) => {
                  const custo = m.itens.reduce((a, i) => a + i.valor, 0);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <Link href={`/manutencoes/${m.id}`} className="hover:text-blue-600">
                          {new Date(m.dataEntrada).toLocaleDateString("pt-BR")}
                        </Link>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={m.tipo} /></td>
                      <td className="px-6 py-4 text-sm text-gray-700">{m.descricao}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {custo > 0 ? `R$ ${custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "--"}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent trips */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Últimas Viagens</h2>
          <Link href="/viagens" className="text-sm text-blue-600 hover:text-blue-800">Ver todas</Link>
        </div>
        {veiculo.viagens.length === 0 ? (
          <p className="px-6 py-4 text-gray-500 text-sm">Nenhuma viagem registrada.</p>
        ) : (
          <div className="divide-y">
            {veiculo.viagens.map((v) => {
              const km = v.kmFinal && v.kmInicial ? v.kmFinal - v.kmInicial : null;
              return (
                <Link key={v.id} href={`/viagens/${v.id}`} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{v.origem} → {v.destino}</p>
                      <p className="text-sm text-gray-500 mt-1">{v.motorista.nome}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(v.dataSaida).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      {km !== null && (
                        <p className="text-sm font-medium text-gray-700">{km.toLocaleString("pt-BR")} km</p>
                      )}
                      <div className="mt-1"><StatusBadge status={v.status} /></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Alerts */}
      {alertasComKm.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Alertas de KM</h2>
          <div className="space-y-3">
            {alertasComKm.map((a) => {
              const urgente = a.kmRestante <= a.alertaAntesDe;
              const vencido = a.kmRestante <= 0;
              // Projeção de data
              let dataEstimada: string | null = null;
              if (kmMedioDia > 0 && a.kmRestante > 0) {
                const diasAte = Math.ceil(a.kmRestante / kmMedioDia);
                const data = new Date();
                data.setDate(data.getDate() + diasAte);
                dataEstimada = data.toLocaleDateString("pt-BR");
              }
              return (
                <div key={a.id} className={`flex items-center justify-between p-4 rounded-lg border ${vencido ? "border-red-400 bg-red-50" : urgente ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}>
                  <div>
                    <p className="font-medium text-gray-900">{TIPOS_ALERTA[a.tipo] || a.tipo}</p>
                    <p className="text-sm text-gray-500">
                      A cada {a.intervaloKm.toLocaleString("pt-BR")} km | Próxima: {a.kmProxima.toLocaleString("pt-BR")} km
                    </p>
                    {dataEstimada && (
                      <p className="text-xs text-blue-600 mt-1">
                        Previsão: {dataEstimada} ({Math.ceil(a.kmRestante / kmMedioDia)} dias)
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${vencido ? "text-red-600" : urgente ? "text-yellow-600" : "text-gray-700"}`}>
                      {vencido
                        ? `${Math.abs(a.kmRestante).toLocaleString("pt-BR")} km além`
                        : `${a.kmRestante.toLocaleString("pt-BR")} km restantes`}
                    </p>
                    {vencido && <p className="text-xs text-red-500 font-bold">VENCIDO</p>}
                    {!vencido && urgente && <p className="text-xs text-yellow-600 font-medium">Atenção</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
