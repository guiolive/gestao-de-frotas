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

function diasEntre(d1: Date, d2: Date): number {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function semaforoClass(diasRestantes: number): string {
  if (diasRestantes < 0) return "bg-red-100 border-red-300 text-red-800";
  if (diasRestantes <= 3) return "bg-yellow-100 border-yellow-300 text-yellow-800";
  return "bg-green-100 border-green-300 text-green-800";
}

function semaforoDot(diasRestantes: number): string {
  if (diasRestantes < 0) return "bg-red-500";
  if (diasRestantes <= 3) return "bg-yellow-500";
  return "bg-green-500";
}

export default async function DashboardPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em7dias = new Date(hoje);
  em7dias.setDate(em7dias.getDate() + 7);
  const em30dias = new Date(hoje);
  em30dias.setDate(em30dias.getDate() + 30);
  const seismesesAtras = new Date(hoje);
  seismesesAtras.setMonth(seismesesAtras.getMonth() - 6);

  const [
    totalVeiculos,
    veiculosDisponiveis,
    veiculosEmUso,
    veiculosManutencao,
    veiculosInativos,
    manutencoesAtivas,
    manutencoesConcluidasRecentes,
    alertasAtivos,
    proximosAgendamentos,
    viagensRecentes,
  ] = await Promise.all([
    prisma.veiculo.count(),
    prisma.veiculo.count({ where: { status: "disponivel" } }),
    prisma.veiculo.count({ where: { status: "em_uso" } }),
    prisma.veiculo.count({ where: { status: "manutencao" } }),
    prisma.veiculo.count({ where: { status: "inativo" } }),
    prisma.manutencao.findMany({
      where: { status: { in: ["aguardando", "em_andamento"] } },
      orderBy: { dataEntrada: "asc" },
      include: { veiculo: true, itens: true },
    }),
    prisma.manutencao.findMany({
      where: {
        status: "concluida",
        criadoEm: { gte: seismesesAtras },
      },
      include: { veiculo: true },
    }),
    prisma.alertaKm.findMany({
      where: { ativo: true },
      include: { veiculo: true },
    }),
    prisma.agendamento.findMany({
      where: { dataInicio: { gte: hoje, lte: em30dias }, status: { not: "cancelado" } },
      orderBy: { dataInicio: "asc" },
      take: 10,
      include: { veiculo: true },
    }),
    prisma.viagem.findMany({
      where: { dataSaida: { gte: seismesesAtras } },
      select: {
        veiculoId: true,
        kmInicial: true,
        kmFinal: true,
        dataSaida: true,
        dataRetorno: true,
      },
    }),
  ]);

  // ── DISPONIBILIDADE ──
  const disponibilidade = totalVeiculos > 0
    ? Math.round(((veiculosDisponiveis + veiculosEmUso) / totalVeiculos) * 100)
    : 0;

  // ── MANUTENÇÕES EM ANDAMENTO COM SEMÁFORO ──
  const manutencoesComSemaforo = manutencoesAtivas.map((m) => {
    const diasNaOficina = diasEntre(new Date(m.dataEntrada), new Date());
    const previsaoSaida = m.previsaoSaida ? new Date(m.previsaoSaida) : null;
    const diasRestantes = previsaoSaida ? diasEntre(new Date(), previsaoSaida) : 999;
    const custo = m.itens.reduce((a, i) => a + i.valor, 0);
    return { ...m, diasNaOficina, diasRestantes, custo, previsaoSaida };
  }).sort((a, b) => a.diasRestantes - b.diasRestantes);

  const manutencoesAtrasadas = manutencoesComSemaforo.filter((m) => m.diasRestantes < 0);

  // ── ALERTAS DE KM (PRÓXIMAS PREVENTIVAS) ──
  const alertasUrgentes = alertasAtivos
    .map((a) => {
      const kmAtual = a.veiculo.quilometragem;
      const kmProximaTroca = a.ultimaTrocaKm + a.intervaloKm;
      const kmRestante = kmProximaTroca - kmAtual;
      const kmParaAlerta = kmProximaTroca - a.alertaAntesDe;
      const precisaAtencao = kmAtual >= kmParaAlerta;

      // Projeção: KM médio/dia do veículo baseado no histórico de viagens
      const viagensVeiculo = viagensRecentes.filter(
        (v) => v.veiculoId === a.veiculoId && v.kmFinal && v.kmInicial
      );
      let kmMedioDia = 0;
      let dataEstimada: Date | null = null;

      if (viagensVeiculo.length >= 2) {
        const kmTotal = viagensVeiculo.reduce(
          (acc, v) => acc + ((v.kmFinal || 0) - v.kmInicial),
          0
        );
        const primeiraViagem = new Date(
          Math.min(...viagensVeiculo.map((v) => new Date(v.dataSaida).getTime()))
        );
        const dias = Math.max(1, diasEntre(primeiraViagem, new Date()));
        kmMedioDia = kmTotal / dias;

        if (kmMedioDia > 0 && kmRestante > 0) {
          const diasAteProxima = Math.ceil(kmRestante / kmMedioDia);
          dataEstimada = new Date();
          dataEstimada.setDate(dataEstimada.getDate() + diasAteProxima);
        }
      }

      return {
        ...a,
        kmAtual,
        kmProximaTroca,
        kmRestante,
        precisaAtencao,
        kmMedioDia: Math.round(kmMedioDia * 10) / 10,
        dataEstimada,
      };
    })
    .sort((a, b) => a.kmRestante - b.kmRestante);

  const alertasCriticos = alertasUrgentes.filter((a) => a.kmRestante <= 0);
  const alertasProximos = alertasUrgentes.filter(
    (a) => a.kmRestante > 0 && a.precisaAtencao
  );

  // ── KPIs ──
  // MTTR (últimos 6 meses)
  const manutencoesComDuracao = manutencoesConcluidasRecentes
    .filter((m) => m.previsaoSaida)
    .map((m) => {
      const duracao = diasEntre(new Date(m.dataEntrada), new Date(m.previsaoSaida!));
      return Math.max(1, duracao);
    });
  const mttr =
    manutencoesComDuracao.length > 0
      ? Math.round(
          (manutencoesComDuracao.reduce((a, b) => a + b, 0) /
            manutencoesComDuracao.length) *
            10
        ) / 10
      : 0;

  // % Preventiva vs Corretiva (últimos 6 meses)
  const totalRecentes = manutencoesConcluidasRecentes.length;
  const preventivas = manutencoesConcluidasRecentes.filter(
    (m) => m.tipo === "preventiva"
  ).length;
  const pctPreventiva =
    totalRecentes > 0 ? Math.round((preventivas / totalRecentes) * 100) : 0;

  // Cumprimento de prazo (últimos 6 meses)
  const comPrazo = manutencoesConcluidasRecentes.filter(
    (m) => m.previsaoSaida
  );
  const noPrazo = comPrazo.filter((m) => {
    const previsao = new Date(m.previsaoSaida!);
    // Consider concluded if previsaoSaida exists and dataEntrada + previsaoDias hasn't been exceeded too much
    return previsao >= new Date(m.dataEntrada);
  });
  const pctPrazo =
    comPrazo.length > 0
      ? Math.round((noPrazo.length / comPrazo.length) * 100)
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Painel de Gestão da Frota
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCO 1: ALERTAS URGENTES */}
      {/* ══════════════════════════════════════════════════ */}
      {(alertasCriticos.length > 0 ||
        manutencoesAtrasadas.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            Atenção Imediata
          </h2>

          {/* Manutenções atrasadas */}
          {manutencoesAtrasadas.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-semibold text-red-700 mb-1">
                Manutenções atrasadas ({manutencoesAtrasadas.length})
              </p>
              <div className="space-y-1">
                {manutencoesAtrasadas.map((m) => (
                  <Link
                    key={m.id}
                    href={`/manutencoes/${m.id}`}
                    className="block bg-white rounded px-3 py-2 text-sm hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <span className="font-semibold">{m.veiculo.placa}</span>{" "}
                    — {m.descricao.substring(0, 50)}{" "}
                    <span className="text-red-600 font-bold">
                      ({Math.abs(m.diasRestantes)} dias atrasado)
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* KM vencidos */}
          {alertasCriticos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">
                KM de manutenção ultrapassado ({alertasCriticos.length})
              </p>
              <div className="space-y-1">
                {alertasCriticos.map((a) => (
                  <Link
                    key={a.id}
                    href={`/veiculos/${a.veiculoId}`}
                    className="block bg-white rounded px-3 py-2 text-sm hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <span className="font-semibold">{a.veiculo.placa}</span>{" "}
                    — {a.tipo} •{" "}
                    <span className="text-red-600 font-bold">
                      {Math.abs(a.kmRestante).toLocaleString("pt-BR")} km além do limite
                    </span>
                    {" "}(KM atual: {a.kmAtual.toLocaleString("pt-BR")}, troca em: {a.kmProximaTroca.toLocaleString("pt-BR")})
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alertas próximos (amarelo) */}
      {alertasProximos.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full" />
            Próximas Preventivas ({alertasProximos.length})
          </h2>
          <div className="space-y-1">
            {alertasProximos.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/veiculos/${a.veiculoId}`}
                className="block bg-white rounded px-3 py-2 text-sm hover:bg-yellow-100 transition-colors border border-yellow-200"
              >
                <span className="font-semibold">{a.veiculo.placa}</span>{" "}
                — {a.tipo} • Faltam{" "}
                <span className="text-yellow-700 font-bold">
                  {a.kmRestante.toLocaleString("pt-BR")} km
                </span>
                {a.dataEstimada && (
                  <span className="text-gray-500 ml-1">
                    (estimativa: {formatDate(a.dataEstimada)})
                  </span>
                )}
                {a.kmMedioDia > 0 && (
                  <span className="text-gray-400 ml-1">
                    • {a.kmMedioDia} km/dia
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCO 2: SITUAÇÃO DA FROTA EM TEMPO REAL */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-3xl font-bold text-gray-900">{totalVeiculos}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-xs text-green-600 uppercase tracking-wide">Disponíveis</p>
          <p className="text-3xl font-bold text-green-700">{veiculosDisponiveis}</p>
          {totalVeiculos > 0 && (
            <p className="text-xs text-green-500">
              {Math.round((veiculosDisponiveis / totalVeiculos) * 100)}%
            </p>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-600 uppercase tracking-wide">Em Uso</p>
          <p className="text-3xl font-bold text-blue-700">{veiculosEmUso}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-xs text-yellow-600 uppercase tracking-wide">Manutenção</p>
          <p className="text-3xl font-bold text-yellow-700">{veiculosManutencao}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-xs text-red-600 uppercase tracking-wide">Inativos</p>
          <p className="text-3xl font-bold text-red-700">{veiculosInativos}</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCO 3: MANUTENÇÕES EM ANDAMENTO + SEMÁFORO */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Manutenções em Andamento
            {manutencoesComSemaforo.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({manutencoesComSemaforo.length})
              </span>
            )}
          </h2>
          <Link
            href="/manutencoes"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver todas
          </Link>
        </div>
        {manutencoesComSemaforo.length === 0 ? (
          <p className="px-6 py-6 text-gray-500 text-sm text-center">
            Nenhuma manutenção ativa no momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Veículo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Descrição
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Dias na Oficina
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Previsão Saída
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Custo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {manutencoesComSemaforo.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${semaforoDot(
                            m.diasRestantes
                          )}`}
                        />
                        {m.diasRestantes < 0 ? (
                          <span className="text-xs font-bold text-red-600">
                            {Math.abs(m.diasRestantes)}d atrasado
                          </span>
                        ) : m.diasRestantes <= 3 ? (
                          <span className="text-xs font-bold text-yellow-600">
                            {m.diasRestantes}d restante{m.diasRestantes !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">No prazo</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/veiculos/${m.veiculoId}`}
                        className="font-semibold text-sm text-gray-900 hover:text-blue-600"
                      >
                        {m.veiculo.placa}
                      </Link>
                      <p className="text-xs text-gray-400">{m.veiculo.modelo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <Link href={`/manutencoes/${m.id}`} className="hover:text-blue-600">
                        {m.descricao.substring(0, 50)}
                        {m.descricao.length > 50 ? "..." : ""}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.tipo} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${semaforoClass(
                          m.diasRestantes
                        )}`}
                      >
                        {m.diasNaOficina} dia{m.diasNaOficina !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {m.previsaoSaida
                        ? formatDate(m.previsaoSaida)
                        : "Não definida"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {m.custo > 0
                        ? `R$ ${m.custo.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCO 4: KPIs DO DEPARTAMENTO */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Disponibilidade */}
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Disponibilidade
          </p>
          <div className="flex items-end gap-2">
            <p
              className={`text-3xl font-bold ${
                disponibilidade >= 85
                  ? "text-green-700"
                  : disponibilidade >= 70
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}
            >
              {disponibilidade}%
            </p>
            <p className="text-xs text-gray-400 pb-1">
              {disponibilidade >= 85 ? "Saudável" : disponibilidade >= 70 ? "Atenção" : "Crítico"}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${
                disponibilidade >= 85
                  ? "bg-green-500"
                  : disponibilidade >= 70
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${disponibilidade}%` }}
            />
          </div>
        </div>

        {/* MTTR */}
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            MTTR
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {mttr > 0 ? mttr : "—"}
          </p>
          <p className="text-xs text-gray-400">
            dias médios na oficina (6 meses)
          </p>
        </div>

        {/* Preventiva vs Corretiva */}
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Preventiva vs Corretiva
          </p>
          <div className="flex items-end gap-2">
            <p
              className={`text-3xl font-bold ${
                pctPreventiva >= 70
                  ? "text-green-700"
                  : pctPreventiva >= 50
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}
            >
              {totalRecentes > 0 ? `${pctPreventiva}%` : "—"}
            </p>
            <p className="text-xs text-gray-400 pb-1">preventivas</p>
          </div>
          {totalRecentes > 0 && (
            <div className="flex gap-1 mt-2">
              <div
                className="h-2 rounded-l-full bg-green-500"
                style={{ width: `${pctPreventiva}%` }}
              />
              <div
                className="h-2 rounded-r-full bg-orange-400"
                style={{ width: `${100 - pctPreventiva}%` }}
              />
            </div>
          )}
          {totalRecentes > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {preventivas} preventivas · {totalRecentes - preventivas} corretivas
            </p>
          )}
        </div>

        {/* Cumprimento de Prazo */}
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Prazo Cumprido
          </p>
          <p
            className={`text-3xl font-bold ${
              pctPrazo >= 80
                ? "text-green-700"
                : pctPrazo >= 60
                ? "text-yellow-700"
                : "text-red-700"
            }`}
          >
            {comPrazo.length > 0 ? `${pctPrazo}%` : "—"}
          </p>
          <p className="text-xs text-gray-400">
            {comPrazo.length > 0
              ? `${noPrazo.length} de ${comPrazo.length} no prazo (6 meses)`
              : "sem dados"}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCO 5: PROJEÇÃO DE PREVENTIVAS */}
      {/* ══════════════════════════════════════════════════ */}
      {alertasUrgentes.filter((a) => a.dataEstimada && a.kmRestante > 0).length >
        0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Projeção de Preventivas
              <span className="ml-2 text-xs font-normal text-gray-400">
                baseado no KM médio/dia de cada veículo
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Veículo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    KM Atual
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Próxima Troca
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    KM Restante
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    KM/dia
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Data Estimada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alertasUrgentes
                  .filter((a) => a.dataEstimada && a.kmRestante > 0)
                  .map((a) => {
                    const diasAte = a.dataEstimada
                      ? diasEntre(new Date(), a.dataEstimada)
                      : 999;
                    return (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/veiculos/${a.veiculoId}`}
                            className="font-semibold text-sm text-gray-900 hover:text-blue-600"
                          >
                            {a.veiculo.placa}
                          </Link>
                          <p className="text-xs text-gray-400">
                            {a.veiculo.modelo}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {a.tipo}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {a.kmAtual.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700">
                          {a.kmProximaTroca.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          <span
                            className={
                              a.kmRestante <= a.alertaAntesDe
                                ? "text-yellow-600"
                                : "text-gray-900"
                            }
                          >
                            {a.kmRestante.toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {a.kmMedioDia}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${semaforoClass(
                              diasAte
                            )}`}
                          >
                            {formatDate(a.dataEstimada)} ({diasAte} dias)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* BLOCO 6: AGENDAMENTOS PRÓXIMOS */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Agendamentos (próx. 30 dias)
            </h2>
            <Link
              href="/agendamentos"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todos
            </Link>
          </div>
          <div className="divide-y">
            {proximosAgendamentos.length === 0 ? (
              <p className="px-6 py-6 text-gray-500 text-sm text-center">
                Nenhum agendamento nos próximos 30 dias.
              </p>
            ) : (
              proximosAgendamentos.map((a) => {
                const diasAte = diasEntre(
                  new Date(),
                  new Date(a.dataInicio)
                );
                return (
                  <div
                    key={a.id}
                    className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {a.veiculo.placa}
                      </p>
                      <p className="text-sm text-gray-500">
                        {a.solicitante} — {a.motivo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">
                        {formatDate(a.dataInicio)}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${semaforoClass(
                          diasAte
                        )}`}
                      >
                        {diasAte < 0
                          ? `${Math.abs(diasAte)}d atrasado`
                          : diasAte === 0
                          ? "Hoje"
                          : diasAte === 1
                          ? "Amanhã"
                          : `${diasAte} dias`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resumo rápido */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Resumo do Departamento
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Meta de disponibilidade</span>
              <span className={`text-sm font-bold ${disponibilidade >= 85 ? "text-green-600" : "text-red-600"}`}>
                {disponibilidade >= 85 ? "✓ Atingida" : "✗ Abaixo"} ({disponibilidade}% / 85%)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Meta preventiva &gt; 70%</span>
              <span className={`text-sm font-bold ${pctPreventiva >= 70 ? "text-green-600" : "text-red-600"}`}>
                {pctPreventiva >= 70 ? "✓ Atingida" : "✗ Abaixo"} ({pctPreventiva}% / 70%)
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Manutenções ativas</span>
              <span className="text-sm font-bold text-gray-900">{manutencoesComSemaforo.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Atrasadas</span>
              <span className={`text-sm font-bold ${manutencoesAtrasadas.length > 0 ? "text-red-600" : "text-green-600"}`}>
                {manutencoesAtrasadas.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Alertas de KM pendentes</span>
              <span className={`text-sm font-bold ${alertasCriticos.length > 0 ? "text-red-600" : alertasProximos.length > 0 ? "text-yellow-600" : "text-green-600"}`}>
                {alertasCriticos.length + alertasProximos.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
