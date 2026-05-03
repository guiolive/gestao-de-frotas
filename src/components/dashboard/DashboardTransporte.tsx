/**
 * Visão de Transporte: agenda da semana, viagens em curso e novidades
 * vindas da oficina. Quem é desse setor quer saber "o que vai acontecer
 * essa semana" e "o que mudou hoje" — não KPIs.
 *
 * KPIs gerais de frota vivem em /veiculos — não duplicamos aqui.
 */
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import GradeMensal from "@/components/agendamentos/GradeMensal";
import NovidadesOficina from "@/components/dashboard/NovidadesOficina";
import PadroesPainel from "@/components/dashboard/PadroesPainel";
import { nomeMes, type DiaDoMes } from "@/lib/calendario";
import { Calendar, Clock, MapPin } from "lucide-react";
import type { Veiculo, Motorista, Unidade, Agendamento, Viagem, Manutencao } from "@/generated/prisma/client";

type ViagemComRel = Viagem & {
  veiculo: Veiculo;
  motorista: Motorista;
};
type AgendamentoComRel = Agendamento & {
  veiculo: Veiculo;
  unidade: Unidade | null;
};
type ManutencaoComVeiculo = Manutencao & { veiculo: Veiculo };

export type DashboardTransporteProps = {
  veiculosGrade: Veiculo[];
  diasMes: DiaDoMes[];
  agendamentosMes: AgendamentoComRel[];
  ano: number;
  mes: number;
  viagensEmAndamento: ViagemComRel[];
  listaEspera: AgendamentoComRel[];
  manutencoesNovidades: ManutencaoComVeiculo[];
};

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
    veiculosGrade,
    diasMes,
    agendamentosMes,
    ano,
    mes,
    viagensEmAndamento,
    listaEspera,
    manutencoesNovidades,
  } = props;

  const agora = new Date();

  return (
    <>
      {/* Destaque principal: grade mensal igual à página /agendamentos */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Agenda · {nomeMes(mes)}/{ano}
            <span className="ml-1 text-sm font-normal text-gray-400">
              ({agendamentosMes.length})
            </span>
          </h2>
          <Link
            href="/agendamentos"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Abrir agendamentos
          </Link>
        </div>
        <div className="p-4">
          <GradeMensal
            veiculos={veiculosGrade}
            dias={diasMes}
            agendamentos={agendamentosMes}
          />
        </div>
      </div>

      {/* Viagens em andamento */}
      <div className="bg-white rounded-lg shadow mb-6">
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

      {/* Novidades vindas da oficina (últimos 7 dias) */}
      <NovidadesOficina manutencoes={manutencoesNovidades} />

      {/* Lista de espera */}
      <div className="bg-white rounded-lg shadow mb-6">
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

      {/* Espaço preparado pra inteligência baseada em histórico (placeholder). */}
      <PadroesPainel />
    </>
  );
}
