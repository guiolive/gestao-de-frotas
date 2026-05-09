"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OficinaSelect {
  id: string;
  nome: string;
}

interface Props {
  manutencaoId: string;
  status: string;
  oficinaId: string | null;
  oficinas: OficinaSelect[];
  enviada: boolean;
  retornou: boolean;
  emAtraso: boolean;
  diasAtraso: number;
}

/**
 * Bloco interativo da página de detalhes de manutenção: muda status da
 * OS e marcações Prime (oficina, enviada, retorno). O resto da página
 * é server component — só os controles que disparam mutação ficam aqui.
 */
export default function AcoesManutencao({
  manutencaoId,
  status,
  oficinaId,
  oficinas,
  enviada,
  retornou,
  emAtraso,
  diasAtraso,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [primeMsg, setPrimeMsg] = useState("");
  const [erroMsg, setErroMsg] = useState("");

  async function atualizarStatus(novoStatus: string) {
    setLoading(true);
    setErroMsg("");
    try {
      const res = await fetch(`/api/manutencoes/${manutencaoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        setErroMsg(`Não foi possível atualizar (HTTP ${res.status}).`);
        return;
      }
      if (novoStatus === "concluida") {
        router.push("/manutencoes");
      } else {
        // Server component re-renderiza com dados frescos.
        router.refresh();
      }
    } catch (err) {
      setErroMsg(`Erro de rede: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarPrime(payload: Record<string, unknown>, msg: string) {
    setLoading(true);
    setPrimeMsg("");
    setErroMsg("");
    try {
      const res = await fetch(`/api/manutencoes/${manutencaoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setErroMsg(`Não foi possível atualizar (HTTP ${res.status}).`);
        return;
      }
      setPrimeMsg(msg);
      router.refresh();
    } catch (err) {
      setErroMsg(`Erro de rede: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Fluxo obrigatório: aguardando → em_andamento → concluida.
          Não pular etapas — quem aprova ("Iniciar") e quem fecha
          ("Concluir") são gestos distintos do CMAN. */}
      {(status === "aguardando" || status === "em_andamento") && (
        <div className="flex gap-3 mt-6 pt-4 border-t">
          {status === "aguardando" && (
            <button
              onClick={() => atualizarStatus("em_andamento")}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Iniciar Manutenção
            </button>
          )}
          {status === "em_andamento" && (
            <button
              onClick={() => atualizarStatus("concluida")}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Concluir Manutenção
            </button>
          )}
        </div>
      )}

      <div className="space-y-3 pt-4 border-t mt-4">
        <div>
          <label
            htmlFor="oficina-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Vincular oficina
          </label>
          <select
            id="oficina-select"
            value={oficinaId || ""}
            onChange={(e) =>
              atualizarPrime(
                { oficinaId: e.target.value || null },
                "Oficina atualizada."
              )
            }
            disabled={loading}
            className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— sem oficina —</option>
            {oficinas.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {!enviada && (
            <button
              onClick={() =>
                atualizarPrime(
                  { enviadaPrimeEm: new Date().toISOString() },
                  "Marcada como enviada para Prime."
                )
              }
              disabled={loading || !oficinaId}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              title={!oficinaId ? "Vincule uma oficina primeiro" : ""}
            >
              Marcar enviada para Prime
            </button>
          )}
          {enviada && !retornou && (
            <button
              onClick={() =>
                atualizarPrime(
                  { retornoEfetivoEm: new Date().toISOString() },
                  "Retorno do veículo registrado."
                )
              }
              disabled={loading}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              Marcar retorno efetivo
            </button>
          )}
          {(enviada || retornou) && (
            <button
              onClick={() =>
                atualizarPrime(
                  { enviadaPrimeEm: null, retornoEfetivoEm: null },
                  "Marcações Prime limpas."
                )
              }
              disabled={loading}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Limpar Prime
            </button>
          )}
        </div>

        {primeMsg && <p className="text-sm text-emerald-700">{primeMsg}</p>}
        {erroMsg && <p className="text-sm text-red-700 font-medium">{erroMsg}</p>}
        {emAtraso && (
          <p className="text-sm text-red-700 font-medium">
            Veículo está {diasAtraso} dias além da previsão de saída.
          </p>
        )}
      </div>
    </>
  );
}
