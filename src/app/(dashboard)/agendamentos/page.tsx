import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import GradeMensal from "@/components/agendamentos/GradeMensal";
import {
  diasDoMes,
  inicioDoMes,
  fimDoMes,
  nomeMes,
  mesAnterior,
  mesProximo,
} from "@/lib/calendario";
import { labelTipoVeiculo } from "@/lib/tipoVeiculo";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type SearchParams = { ano?: string; mes?: string; tipo?: string };

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

      <GradeMensal veiculos={veiculos} dias={dias} agendamentos={ativos} />

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
