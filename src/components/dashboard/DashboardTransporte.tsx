/**
 * Visão de Transporte: foco em agenda do dia, viagens em curso, retornos
 * previstos e disponibilidade da frota AGORA. Quem é desse setor não
 * quer saber de KPI de oficina — quer saber "que carro tá livre pra
 * eu mandar essa viagem urgente?".
 */
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { corParaSigla } from "@/lib/unidadeCores";
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import type { Veiculo, Motorista, Unidade, Agendamento, Viagem } from "@/generated/prisma/client";

type ViagemComRel = Viagem & {
  veiculo: Veiculo;
  motorista: Motorista;
};
type AgendamentoComRel = Agendamento & {
  veiculo: Veiculo;
  unidade: Unidade | null;
};

export type DashboardTransporteProps = {
  totalVeiculos: number;
  veiculosDisponiveis: number;
  veiculosEmUso: number;
  veiculosManutencao: number;
  veiculosInativos: number;
  agendamentosHoje: AgendamentoComRel[];
  viagensEmAndamento: ViagemComRel[];
  retornosPrevistosHoje: ViagemComRel[];
  listaEspera: AgendamentoComRel[];
  proximosAgendamentos: AgendamentoComRel[]; // próx. 7 dias
};

function formatHora(date: Date | string): string {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function diasEntre(d1: Date, d2: Date): number {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardTransporte(props: DashboardTransporteProps) {
  const {
    totalVeiculos,
    veiculosDisponiveis,
    veiculosEmUso,
    veiculosManutencao,
    veiculosInativos,
    agendamentosHoje,
    viagensEmAndamento,
    retornosPrevistosHoje,
    listaEspera,
    proximosAgendamentos,
  } = props;

  const agora = new Date();

  // Retornos atrasados — viagens em andamento cuja `dataRetorno` (se houver)
  // já passou OU sem retorno mas saída há mais de 1 dia.
  const viagensAtrasadas = viagensEmAndamento.filter((v) => {
    if (v.dataRetorno) return new Date(v.dataRetorno) < agora;
    return diasEntre(new Date(v.dataSaida), agora) > 1;
  });

  return (
    <>
      {/* Alertas urgentes — só aparece se há retornos atrasados */}
      {viagensAtrasadas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Retornos atrasados ({viagensAtrasadas.length})
          </h2>
          <div className="space-y-1">
            {viagensAtrasadas.map((v) => (
              <Link
                key={v.id}
                href={`/viagens/${v.id}`}
                className="block bg-white rounded px-3 py-2 text-sm hover:bg-red-100 transition-colors border border-red-200"
              >
                <span className="font-semibold">{v.veiculo.placa}</span>{" "}
                — {v.motorista.nome} →{" "}
                <span className="text-red-600 font-bold">{v.destino}</span>
                {v.dataRetorno && (
                  <span className="text-gray-500 ml-2 text-xs">
                    (devia retornar {formatDate(v.dataRetorno)})
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cards rápidos de disponibilidade */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total da Frota</p>
          <p className="text-3xl font-bold text-gray-900">{totalVeiculos}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-xs text-green-600 uppercase tracking-wide">Disponíveis Agora</p>
          <p className="text-3xl font-bold text-green-700">{veiculosDisponiveis}</p>
          {totalVeiculos > 0 && (
            <p className="text-xs text-green-500">
              {Math.round((veiculosDisponiveis / totalVeiculos) * 100)}%
            </p>
          )}
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-600 uppercase tracking-wide">Em Viagem</p>
          <p className="text-3xl font-bold text-blue-700">{veiculosEmUso}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-xs text-yellow-600 uppercase tracking-wide">Em Manutenção</p>
          <p className="text-3xl font-bold text-yellow-700">{veiculosManutencao}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Inativos</p>
          <p className="text-3xl font-bold text-gray-600">{veiculosInativos}</p>
        </div>
      </div>

      {/* Linha 1: Agenda do dia + Viagens em andamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Agenda do dia */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Agenda de hoje
              <span className="ml-1 text-sm font-normal text-gray-400">
                ({agendamentosHoje.length})
              </span>
            </h2>
            <Link href="/agendamentos" className="text-sm text-blue-600 hover:text-blue-800">
              Ver grade
            </Link>
          </div>
          <div className="divide-y">
            {agendamentosHoje.length === 0 ? (
              <p className="px-6 py-8 text-gray-500 text-sm text-center">
                Sem agendamentos hoje.
              </p>
            ) : (
              agendamentosHoje.map((a) => {
                const sigla = a.unidade?.sigla ?? a.solicitante;
                const cor = corParaSigla(sigla);
                return (
                  <Link
                    key={a.id}
                    href={`/agendamentos/${a.id}`}
                    className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold ${cor.bg} ${cor.fg}`}>
                        {sigla}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {a.veiculo.placa}{" "}
                          <span className="text-gray-500 font-normal">
                            {a.veiculo.modelo}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 truncate">{a.motivo}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-600 flex-shrink-0 ml-2">
                      {formatHora(a.dataInicio)} → {formatHora(a.dataFim)}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Viagens em andamento */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Viagens em andamento
              <span className="ml-1 text-sm font-normal text-gray-400">
                ({viagensEmAndamento.length})
              </span>
            </h2>
            <Link href="/viagens?status=em_andamento" className="text-sm text-blue-600 hover:text-blue-800">
              Ver todas
            </Link>
          </div>
          <div className="divide-y">
            {viagensEmAndamento.length === 0 ? (
              <p className="px-6 py-8 text-gray-500 text-sm text-center">
                Nenhuma viagem em andamento.
              </p>
            ) : (
              viagensEmAndamento.map((v) => {
                const atrasada = v.dataRetorno
                  ? new Date(v.dataRetorno) < agora
                  : diasEntre(new Date(v.dataSaida), agora) > 1;
                return (
                  <Link
                    key={v.id}
                    href={`/viagens/${v.id}`}
                    className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {v.veiculo.placa}{" "}
                        <span className="text-gray-500 font-normal">
                          {v.veiculo.modelo}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {v.motorista.nome} → {v.destino}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      {v.dataRetorno ? (
                        <p className={`text-xs ${atrasada ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                          Retorno: {formatDate(v.dataRetorno)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">sem previsão</p>
                      )}
                      <StatusBadge status={v.status} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Linha 2: Retornos previstos hoje + Lista de espera */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Retornos previstos hoje
              <span className="ml-1 text-sm font-normal text-gray-400">
                ({retornosPrevistosHoje.length})
              </span>
            </h2>
          </div>
          <div className="divide-y">
            {retornosPrevistosHoje.length === 0 ? (
              <p className="px-6 py-8 text-gray-500 text-sm text-center">
                Nenhum retorno previsto para hoje.
              </p>
            ) : (
              retornosPrevistosHoje.map((v) => (
                <Link
                  key={v.id}
                  href={`/viagens/${v.id}`}
                  className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{v.veiculo.placa}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {v.motorista.nome} · vindo de {v.destino}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 flex-shrink-0 ml-2">
                    {v.dataRetorno ? formatHora(v.dataRetorno) : ""}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Lista de espera */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Lista de espera
              <span className="ml-1 text-sm font-normal text-gray-400">
                ({listaEspera.length})
              </span>
            </h2>
            <Link href="/agendamentos" className="text-sm text-blue-600 hover:text-blue-800">
              Resolver
            </Link>
          </div>
          <div className="divide-y">
            {listaEspera.length === 0 ? (
              <p className="px-6 py-8 text-gray-500 text-sm text-center">
                Sem solicitações em espera.
              </p>
            ) : (
              listaEspera.slice(0, 6).map((a) => {
                const sigla = a.unidade?.sigla ?? a.solicitante;
                return (
                  <Link
                    key={a.id}
                    href={`/agendamentos/${a.id}`}
                    className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {sigla} · {a.veiculo.placa}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{a.motivo}</p>
                    </div>
                    <p className="text-xs text-gray-600 flex-shrink-0 ml-2">
                      {formatDate(a.dataInicio)}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Próximos 7 dias */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Próximos 7 dias
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({proximosAgendamentos.length})
            </span>
          </h2>
          <Link href="/agendamentos" className="text-sm text-blue-600 hover:text-blue-800">
            Ver grade do mês
          </Link>
        </div>
        <div className="divide-y">
          {proximosAgendamentos.length === 0 ? (
            <p className="px-6 py-8 text-gray-500 text-sm text-center">
              Nenhum agendamento confirmado pros próximos 7 dias.
            </p>
          ) : (
            proximosAgendamentos.map((a) => {
              const sigla = a.unidade?.sigla ?? a.solicitante;
              const cor = corParaSigla(sigla);
              const diasAte = diasEntre(agora, new Date(a.dataInicio));
              return (
                <Link
                  key={a.id}
                  href={`/agendamentos/${a.id}`}
                  className="px-6 py-3 flex justify-between items-center hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold ${cor.bg} ${cor.fg}`}>
                      {sigla}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {a.veiculo.placa}{" "}
                        <span className="text-gray-500 font-normal">
                          {a.veiculo.modelo}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{a.motivo}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-600 flex-shrink-0 ml-2">
                    <p>{formatDate(a.dataInicio)} {formatHora(a.dataInicio)}</p>
                    <p className="text-gray-400">
                      {diasAte === 0 ? "hoje" : diasAte === 1 ? "amanhã" : `em ${diasAte}d`}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
