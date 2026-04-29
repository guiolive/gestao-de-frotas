import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import {
  diasDoMes,
  inicioDoMes,
  fimDoMes,
  nomeMes,
  mesAnterior,
  mesProximo,
  agendamentoCobreDia,
} from "@/lib/calendario";
import { corParaSigla } from "@/lib/unidadeCores";
import { labelTipoVeiculo } from "@/lib/tipoVeiculo";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = { ano?: string; mes?: string; tipo?: string };

type AgendamentoComRel = Awaited<
  ReturnType<typeof prisma.agendamento.findMany<{ include: { veiculo: true; unidade: true } }>>
>[number];

function parseAnoMes(sp: SearchParams) {
  const hoje = new Date();
  const anoNum = Number(sp.ano);
  const mesNum = Number(sp.mes);
  const ano = Number.isFinite(anoNum) && anoNum > 1900 ? anoNum : hoje.getFullYear();
  const mes =
    Number.isFinite(mesNum) && mesNum >= 1 && mesNum <= 12
      ? mesNum
      : hoje.getMonth() + 1;
  return { ano, mes };
}

function formatHoraCurta(d: Date | string): string {
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AgendamentosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ano, mes } = parseAnoMes(searchParams);
  const tipoFiltro = searchParams.tipo;
  const inicio = inicioDoMes(ano, mes);
  const fim = fimDoMes(ano, mes);
  const dias = diasDoMes(ano, mes);

  // Veículos ativos (mantém inativos fora da grade — espelha a planilha
  // que removia veículos baixados).
  const veiculosAtivos = await prisma.veiculo.findMany({
    where: { status: { not: "inativo" } },
    orderBy: [{ tipo: "asc" }, { placa: "asc" }],
  });

  // Contagem por tipo pra rotular as pílulas; veículos exibidos na grade
  // são os do tipo selecionado (ou todos quando sem filtro).
  const contagemPorTipo = veiculosAtivos.reduce<Record<string, number>>(
    (acc, v) => {
      acc[v.tipo] = (acc[v.tipo] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const tiposPresentes = Object.keys(contagemPorTipo).sort();
  const veiculos = tipoFiltro
    ? veiculosAtivos.filter((v) => v.tipo === tipoFiltro)
    : veiculosAtivos;

  // Agendamentos que cruzam o mês — qualquer status (separamos depois).
  const agendamentosMes = await prisma.agendamento.findMany({
    where: {
      AND: [
        { dataInicio: { lte: fim } },
        { dataFim: { gte: inicio } },
      ],
      status: { not: "lista_espera" },
    },
    include: { veiculo: true, unidade: true },
    orderBy: { dataInicio: "asc" },
  });

  // Lista de espera completa (não vinculada a mês).
  const listaEspera = await prisma.agendamento.findMany({
    where: { status: "lista_espera" },
    include: { veiculo: true, unidade: true },
    orderBy: { dataInicio: "asc" },
  });

  // Agendamentos ativos (preenchem a grade): só aprovados/pendentes legados.
  // Os cancelados vão para a seção "Canceladas" e não pintam células.
  const ativos = agendamentosMes.filter(
    (a) => a.status === "aprovado" || a.status === "pendente"
  );
  const cancelados = agendamentosMes.filter((a) => a.status === "cancelado");

  // Index por veículo + dia para lookup O(1) na renderização da grade.
  const grade = new Map<string, Map<number, AgendamentoComRel>>();
  for (const a of ativos) {
    let porVeiculo = grade.get(a.veiculoId);
    if (!porVeiculo) {
      porVeiculo = new Map();
      grade.set(a.veiculoId, porVeiculo);
    }
    for (const d of dias) {
      if (agendamentoCobreDia(a.dataInicio, a.dataFim, d.data)) {
        // Se já houver um (caso raro de migração com sobreposição antiga),
        // o primeiro a chegar fica — ordenamos por dataInicio asc.
        if (!porVeiculo.has(d.dia)) porVeiculo.set(d.dia, a);
      }
    }
  }

  const anterior = mesAnterior(ano, mes);
  const proximo = mesProximo(ano, mes);

  // Helper pra montar querystrings preservando o filtro de tipo.
  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      ano: String(ano),
      mes: String(mes),
      tipo: tipoFiltro,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v != null && v !== "") params.set(k, v);
    }
    return params.toString();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <div className="flex items-center gap-1 ml-4">
            <Link
              href={`/agendamentos?${qs({ ano: String(anterior.ano), mes: String(anterior.mes) })}`}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <span className="px-4 py-1.5 font-semibold text-gray-800 min-w-[180px] text-center">
              {nomeMes(mes)} / {ano}
            </span>
            <Link
              href={`/agendamentos?${qs({ ano: String(proximo.ano), mes: String(proximo.mes) })}`}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/agendamentos/novo?listaEspera=1"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Clock className="w-4 h-4" /> + Lista de espera
          </Link>
          <Link
            href="/agendamentos/novo"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo agendamento
          </Link>
        </div>
      </div>

      {/* Pílulas de filtro por tipo de veículo — útil quando a frota
          cresce; permite olhar só "ônibus" ou só "passeio" sem rolar a
          grade inteira. */}
      {tiposPresentes.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide font-semibold text-gray-500 mr-1">
            Tipo:
          </span>
          <Link
            href={`/agendamentos?${qs({ tipo: undefined })}`}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !tipoFiltro
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Todos{" "}
            <span className={`text-xs ${!tipoFiltro ? "text-blue-100" : "text-gray-400"}`}>
              ({veiculosAtivos.length})
            </span>
          </Link>
          {tiposPresentes.map((t) => {
            const ativo = tipoFiltro === t;
            return (
              <Link
                key={t}
                href={`/agendamentos?${qs({ tipo: t })}`}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  ativo
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {labelTipoVeiculo(t)}{" "}
                <span className={`text-xs ${ativo ? "text-blue-100" : "text-gray-400"}`}>
                  ({contagemPorTipo[t]})
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Grade mensal — `table-fixed` faz o browser distribuir o
          espaço UNIFORMEMENTE entre as colunas dos dias, depois de
          reservar 200px para a coluna Veículo. `min-width` no <table>
          evita colunas microscópicas em mobile (cai pra scroll). */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="border-collapse text-xs table-fixed w-full min-w-[1100px]">
          <colgroup>
            <col style={{ width: "200px" }} />
            {dias.map((d) => (
              <col key={d.dia} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 border-b border-gray-200 px-3 py-2.5 text-left text-[11px] uppercase tracking-wide font-semibold text-gray-500 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                Veículo
              </th>
              {dias.map((d) => (
                <th
                  key={d.dia}
                  className={`border-b border-gray-200 py-2.5 text-center font-semibold ${
                    d.fimDeSemana
                      ? "bg-gray-100 text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {d.dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {veiculos.length === 0 && (
              <tr>
                <td
                  colSpan={dias.length + 1}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Nenhum veículo cadastrado.
                </td>
              </tr>
            )}
            {veiculos.map((v, idx) => {
              const linha = grade.get(v.id);
              const zebra = idx % 2 === 0 ? "bg-white" : "bg-gray-50/50";
              return (
                <tr key={v.id} className={`group ${zebra} hover:bg-blue-50/30`}>
                  <td className={`sticky left-0 ${zebra} group-hover:bg-blue-50/30 border-b border-gray-100 px-3 py-2 font-medium text-gray-900 whitespace-nowrap z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]`}>
                    <div className="leading-tight">
                      <div className="font-semibold text-gray-900 text-[13px]">
                        {v.placa}
                      </div>
                      <div className="text-gray-500 text-[11px] font-normal">
                        {v.modelo}
                      </div>
                    </div>
                  </td>
                  {dias.map((d) => {
                    const a = linha?.get(d.dia);
                    if (!a) {
                      return (
                        <td
                          key={d.dia}
                          className={`border-b border-gray-100 h-10 ${
                            d.fimDeSemana ? "bg-gray-50/80" : ""
                          }`}
                        />
                      );
                    }
                    const sigla = a.unidade?.sigla ?? a.solicitante;
                    const cor = corParaSigla(sigla);
                    return (
                      <td
                        key={d.dia}
                        className="border-b border-gray-100 p-0.5"
                        title={`${sigla} · ${a.motivo} · ${formatHoraCurta(
                          a.dataInicio
                        )} → ${formatHoraCurta(a.dataFim)}`}
                      >
                        <Link
                          href={`/agendamentos/${a.id}`}
                          className={`flex items-center justify-center h-9 px-1 rounded ${cor.bg} ${cor.fg} text-[10px] font-bold tracking-wide hover:ring-2 ${cor.ring} hover:ring-offset-0 transition-all`}
                        >
                          <span className="truncate">{sigla}</span>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lista de espera */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" /> Lista de espera
          <span className="text-sm font-normal text-gray-500">
            ({listaEspera.length})
          </span>
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Período preferido</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listaEspera.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Sem solicitações em lista de espera.
                  </td>
                </tr>
              )}
              {listaEspera.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {a.veiculo.placa} <span className="text-gray-500 font-normal">{a.veiculo.modelo}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{a.unidade?.sigla ?? a.solicitante}</td>
                  <td className="px-4 py-2 text-gray-700">{a.motivo}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatHoraCurta(a.dataInicio)} → {formatHoraCurta(a.dataFim)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/agendamentos/${a.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Canceladas do mês */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Canceladas em {nomeMes(mes)}/{ano}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({cancelados.length})
          </span>
        </h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cancelados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Nada cancelado neste mês.
                  </td>
                </tr>
              )}
              {cancelados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {a.veiculo.placa} <span className="text-gray-500 font-normal">{a.veiculo.modelo}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{a.unidade?.sigla ?? a.solicitante}</td>
                  <td className="px-4 py-2 text-gray-700">{a.motivo}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatHoraCurta(a.dataInicio)} → {formatHoraCurta(a.dataFim)}
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
