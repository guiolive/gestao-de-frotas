/**
 * Dashboard raiz. Server component que despacha pra `DashboardManutencao`
 * ou `DashboardTransporte` (ou ambos, lado a lado, quando o usuário é
 * AMBOS/ADMIN). A escolha vem do `setor` do usuário logado, lido do
 * cookie via `verificarToken`.
 *
 * Carregamento dos dados:
 *   - Setor TRANSPORTE → consultas de viagens/agendamentos do dia/semana.
 *   - Setor MANUTENCAO → manutenções, alertas KM, KPIs históricos.
 *   - Setor AMBOS → carrega tudo e renderiza as duas seções (manutenção
 *     em cima, transporte embaixo, na mesma página).
 *
 * Mantemos o trabalho fora do critical path com `Promise.all` e dividimos
 * as queries por setor pra não pagar o custo total quando o user é
 * só transporte (que não precisa do agregado de manutenção).
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarToken } from "@/lib/jwt";
import { diasDoMes, inicioDoMes, fimDoMes } from "@/lib/calendario";
import DashboardManutencao from "@/components/dashboard/DashboardManutencao";
import DashboardTransporte from "@/components/dashboard/DashboardTransporte";
import DashboardViewSwitcher from "@/components/dashboard/DashboardViewSwitcher";

type Visao = "TRANSPORTE" | "MANUTENCAO";
const COOKIE_VIEW = "gf-dashboard-view";

export const dynamic = "force-dynamic";

function diasEntre(d1: Date, d2: Date): number {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

async function lerUsuario() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  const payload = await verificarToken(token);
  if (!payload) return null;
  return payload;
}

async function carregarDadosManutencao() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
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
      where: { status: "concluida", criadoEm: { gte: seismesesAtras } },
      include: { veiculo: true },
    }),
    prisma.alertaKm.findMany({
      where: { ativo: true },
      include: { veiculo: true },
    }),
    prisma.agendamento.findMany({
      where: {
        dataInicio: { gte: hoje, lte: em30dias },
        status: { not: "cancelado" },
      },
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

  const disponibilidade =
    totalVeiculos > 0
      ? Math.round(((veiculosDisponiveis + veiculosEmUso) / totalVeiculos) * 100)
      : 0;

  const manutencoesComSemaforo = manutencoesAtivas
    .map((m) => {
      const diasNaOficina = diasEntre(new Date(m.dataEntrada), new Date());
      const previsaoSaida = m.previsaoSaida ? new Date(m.previsaoSaida) : null;
      const diasRestantes = previsaoSaida ? diasEntre(new Date(), previsaoSaida) : 999;
      const custo = m.itens.reduce((a, i) => a + i.valor, 0);
      return { ...m, diasNaOficina, diasRestantes, custo, previsaoSaida };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const manutencoesAtrasadas = manutencoesComSemaforo.filter(
    (m) => m.diasRestantes < 0
  );

  const alertasUrgentes = alertasAtivos
    .map((a) => {
      const kmAtual = a.veiculo.quilometragem;
      const kmProximaTroca = a.ultimaTrocaKm + a.intervaloKm;
      const kmRestante = kmProximaTroca - kmAtual;
      const kmParaAlerta = kmProximaTroca - a.alertaAntesDe;
      const precisaAtencao = kmAtual >= kmParaAlerta;

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

  const manutencoesComDuracao = manutencoesConcluidasRecentes
    .filter((m) => m.previsaoSaida)
    .map((m) =>
      Math.max(1, diasEntre(new Date(m.dataEntrada), new Date(m.previsaoSaida!)))
    );
  const mttr =
    manutencoesComDuracao.length > 0
      ? Math.round(
          (manutencoesComDuracao.reduce((a, b) => a + b, 0) /
            manutencoesComDuracao.length) *
            10
        ) / 10
      : 0;

  const totalRecentes = manutencoesConcluidasRecentes.length;
  const preventivas = manutencoesConcluidasRecentes.filter(
    (m) => m.tipo === "preventiva"
  ).length;
  const pctPreventiva =
    totalRecentes > 0 ? Math.round((preventivas / totalRecentes) * 100) : 0;

  const comPrazo = manutencoesConcluidasRecentes.filter((m) => m.previsaoSaida);
  const noPrazo = comPrazo.filter((m) => {
    const previsao = new Date(m.previsaoSaida!);
    return previsao >= new Date(m.dataEntrada);
  });
  const pctPrazo =
    comPrazo.length > 0
      ? Math.round((noPrazo.length / comPrazo.length) * 100)
      : 0;

  return {
    totalVeiculos,
    veiculosDisponiveis,
    veiculosEmUso,
    veiculosManutencao,
    veiculosInativos,
    manutencoesComSemaforo,
    manutencoesAtrasadas,
    alertasCriticos,
    alertasProximos,
    alertasUrgentes,
    proximosAgendamentos,
    mttr,
    pctPreventiva,
    pctPrazo,
    totalRecentes,
    preventivas,
    comPrazoLength: comPrazo.length,
    noPrazoLength: noPrazo.length,
    disponibilidade,
  };
}

async function carregarDadosTransporte() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth() + 1;
  const inicioMes = inicioDoMes(ano, mes);
  const fimMes = fimDoMes(ano, mes);
  const diasMes = diasDoMes(ano, mes);
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const seteDiasAtras = new Date(inicioHoje);
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const [
    veiculosGrade,
    agendamentosMes,
    viagensEmAndamento,
    listaEspera,
    manutencoesNovidades,
  ] = await Promise.all([
    prisma.veiculo.findMany({
      where: { status: { not: "inativo" } },
      orderBy: [{ tipo: "asc" }, { placa: "asc" }],
    }),
    // Agendamentos do mês corrente que pintam a grade.
    prisma.agendamento.findMany({
      where: {
        status: { in: ["aprovado", "pendente"] },
        AND: [
          { dataInicio: { lte: fimMes } },
          { dataFim: { gte: inicioMes } },
        ],
      },
      orderBy: { dataInicio: "asc" },
      include: { veiculo: true, unidade: true },
    }),
    prisma.viagem.findMany({
      where: { status: { in: ["agendada", "em_andamento"] } },
      orderBy: { dataSaida: "asc" },
      include: { veiculo: true, motorista: true },
    }),
    prisma.agendamento.findMany({
      where: { status: "lista_espera" },
      orderBy: { dataInicio: "asc" },
      include: { veiculo: true, unidade: true },
    }),
    // Novidades da oficina: manutenções que (a) tiveram retorno efetivo nos
    // últimos 7 dias OU (b) tiveram a previsão de saída atualizada nos
    // últimos 7 dias. O componente decide qual evento exibir por item.
    prisma.manutencao.findMany({
      where: {
        OR: [
          { retornoEfetivoEm: { gte: seteDiasAtras } },
          { previsaoSaidaAtualizadaEm: { gte: seteDiasAtras } },
        ],
      },
      include: { veiculo: true },
      take: 8,
    }),
  ]);

  return {
    veiculosGrade,
    diasMes,
    agendamentosMes,
    ano,
    mes,
    viagensEmAndamento,
    listaEspera,
    manutencoesNovidades,
  };
}

/**
 * Decide qual visão renderizar:
 *   - Setor TRANSPORTE → sempre transporte.
 *   - Setor MANUTENCAO → sempre manutenção.
 *   - Setor AMBOS → respeita o cookie `gf-dashboard-view` setado pelo
 *     <DashboardViewSwitcher>; default = TRANSPORTE quando o cookie ainda
 *     não existe (tela mais "operacional do dia" pra primeira visita).
 */
function decidirVisao(setor: string, cookieView: string | undefined): Visao {
  if (setor === "TRANSPORTE") return "TRANSPORTE";
  if (setor === "MANUTENCAO") return "MANUTENCAO";
  // setor AMBOS
  if (cookieView === "MANUTENCAO" || cookieView === "TRANSPORTE") {
    return cookieView;
  }
  return "TRANSPORTE";
}

export default async function DashboardPage() {
  const usuario = await lerUsuario();
  if (!usuario) redirect("/login");

  const setor = usuario.setor ?? "AMBOS";
  const cookieView = cookies().get(COOKIE_VIEW)?.value;
  const visao = decidirVisao(setor, cookieView);
  const podeAlternar = setor === "AMBOS";

  // Carrega só os dados da visão atual — quem é AMBOS na visão Transporte
  // não paga as queries pesadas de manutenção (e vice-versa).
  const [dadosManutencao, dadosTransporte] = await Promise.all([
    visao === "MANUTENCAO" ? carregarDadosManutencao() : Promise.resolve(null),
    visao === "TRANSPORTE" ? carregarDadosTransporte() : Promise.resolve(null),
  ]);

  const titulo =
    visao === "TRANSPORTE" ? "Painel de Transporte" : "Painel de Manutenção";

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{titulo}</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {podeAlternar && <DashboardViewSwitcher atual={visao} />}
      </div>

      {dadosTransporte && <DashboardTransporte {...dadosTransporte} />}
      {dadosManutencao && <DashboardManutencao {...dadosManutencao} />}
    </div>
  );
}
