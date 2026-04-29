"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  status: string;
}
interface Unidade {
  id: string;
  sigla: string;
  nome: string;
  ativo: boolean;
}

// Wrapper com Suspense — necessário porque o form interno consome
// `useSearchParams`, e Next.js exige Suspense boundary para prerender.
export default function NovoAgendamentoPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Carregando…</div>}>
      <NovoAgendamentoForm />
    </Suspense>
  );
}

function NovoAgendamentoForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isListaEspera = params.get("listaEspera") === "1";

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  useEffect(() => {
    fetch("/api/veiculos")
      .then((r) => r.json())
      .then((vs: Veiculo[]) => setVeiculos(vs.filter((v) => v.status !== "inativo")));
    fetch("/api/unidades?ativo=true")
      .then((r) => r.json())
      .then(setUnidades);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      veiculoId: fd.get("veiculoId"),
      unidadeId: fd.get("unidadeId"),
      motivo: fd.get("motivo"),
      observacao: fd.get("observacao") || null,
      dataInicio: fd.get("dataInicio"),
      dataFim: fd.get("dataFim"),
      status: isListaEspera ? "lista_espera" : "aprovado",
    };

    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const detalhe = err?.issues
        ? err.issues.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ")
        : "";
      setErro(err?.error || detalhe || "Erro ao criar agendamento");
      setLoading(false);
      return;
    }

    router.push("/agendamentos");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isListaEspera ? "Adicionar à lista de espera" : "Novo agendamento"}
        </h1>
        <Link href="/agendamentos" className="text-gray-600 hover:underline text-sm">
          ← Voltar
        </Link>
      </div>

      {isListaEspera && (
        <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg mb-4 max-w-2xl">
          Itens em <strong>lista de espera</strong> não bloqueiam o veículo nem
          disparam conflito. Use quando o pedido ainda não tem garantia de
          atendimento.
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 max-w-2xl">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Veículo *
            </label>
            <select
              name="veiculoId"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa} — {v.modelo}
                  {v.status === "manutencao" ? " (em manutenção)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unidade solicitante *
            </label>
            <select
              name="unidadeId"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.sigla} — {u.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo *
          </label>
          <input
            name="motivo"
            required
            minLength={3}
            placeholder="Ex.: Coleta de material em Catalão"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação
          </label>
          <textarea
            name="observacao"
            rows={3}
            placeholder="Detalhes opcionais — destino, contato, restrições…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data/Hora início *
            </label>
            <input
              name="dataInicio"
              type="datetime-local"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data/Hora fim *
            </label>
            <input
              name="dataFim"
              type="datetime-local"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors ${
              isListaEspera
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Salvando…" : isListaEspera ? "Adicionar à lista" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/agendamentos")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
