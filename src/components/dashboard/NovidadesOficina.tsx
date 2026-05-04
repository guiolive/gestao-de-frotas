/**
 * Feed de "novidades da oficina" no Painel de Transporte. Mostra dois
 * tipos de evento dos últimos 7 dias:
 *  - "voltou disponível": Manutencao com `retornoEfetivoEm` recente.
 *  - "nova previsão": Manutencao em aberto com `previsaoSaidaAtualizadaEm`
 *    recente (campo marcado pelo PUT quando previsaoSaida muda).
 *
 * Quando os dois eventos atingem a mesma manutenção, mostramos só o mais
 * recente — fica óbvio o estado atual sem duplicidade.
 */
import Link from "next/link";
import { Wrench, CheckCircle2, Clock } from "lucide-react";
import { tempoRelativo } from "@/lib/calendario";
import type { Manutencao, Veiculo } from "@/generated/prisma/client";

type ManutencaoComVeiculo = Manutencao & { veiculo: Veiculo };

export type NovidadesOficinaProps = {
  manutencoes: ManutencaoComVeiculo[];
};

type EventoNovidade = {
  id: string;
  tipo: "disponivel" | "previsao";
  veiculoPlaca: string;
  veiculoModelo: string;
  manutencaoId: string;
  quando: Date;
  previsaoSaida?: Date | null;
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function selecionarEvento(m: ManutencaoComVeiculo): EventoNovidade | null {
  const ret = m.retornoEfetivoEm ? new Date(m.retornoEfetivoEm) : null;
  const prev = m.previsaoSaidaAtualizadaEm ? new Date(m.previsaoSaidaAtualizadaEm) : null;

  // Mostra o evento mais recente entre os dois.
  let tipo: "disponivel" | "previsao" | null = null;
  let quando: Date | null = null;
  if (ret && prev) {
    tipo = ret >= prev ? "disponivel" : "previsao";
    quando = ret >= prev ? ret : prev;
  } else if (ret) {
    tipo = "disponivel";
    quando = ret;
  } else if (prev) {
    tipo = "previsao";
    quando = prev;
  }
  if (!tipo || !quando) return null;

  return {
    id: m.id,
    tipo,
    veiculoPlaca: m.veiculo.placa,
    veiculoModelo: m.veiculo.modelo,
    manutencaoId: m.id,
    quando,
    previsaoSaida: m.previsaoSaida,
  };
}

export default function NovidadesOficina({ manutencoes }: NovidadesOficinaProps) {
  const eventos = manutencoes
    .map(selecionarEvento)
    .filter((e): e is EventoNovidade => e !== null)
    .sort((a, b) => b.quando.getTime() - a.quando.getTime());

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-600" />
          Novidades da oficina
          <span className="ml-1 text-sm font-normal text-gray-400">
            ({eventos.length})
          </span>
        </h2>
        <Link href="/manutencoes" className="text-sm text-blue-600 hover:text-blue-800">
          Ver todas
        </Link>
      </div>
      <div className="divide-y">
        {eventos.length === 0 ? (
          <p className="px-6 py-8 text-gray-500 text-sm text-center">
            Sem novidades nos últimos 7 dias.
          </p>
        ) : (
          eventos.map((e) => (
            <Link
              key={e.id}
              href={`/manutencoes/${e.manutencaoId}`}
              className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50"
            >
              {e.tipo === "disponivel" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{e.veiculoPlaca}</span>{" "}
                  <span className="text-gray-500">({e.veiculoModelo})</span>{" "}
                  {e.tipo === "disponivel" ? (
                    <>voltou a ficar disponível</>
                  ) : (
                    <>
                      — nova previsão de saída
                      {e.previsaoSaida && (
                        <>: <span className="font-semibold">{formatDate(e.previsaoSaida)}</span></>
                      )}
                    </>
                  )}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {tempoRelativo(e.quando)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
