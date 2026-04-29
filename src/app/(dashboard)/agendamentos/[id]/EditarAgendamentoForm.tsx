"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AgendamentoIn = {
  id: string;
  veiculoId: string;
  unidadeId: string | null;
  motivo: string;
  observacao: string | null;
  /** ISO 8601 string */
  dataInicio: string;
  /** ISO 8601 string */
  dataFim: string;
  status: string;
};

type Veiculo = { id: string; placa: string; modelo: string };
type Unidade = { id: string; sigla: string; nome: string };

/**
 * Converte ISO → "YYYY-MM-DDTHH:mm" para o input datetime-local. O input
 * espera horário local; ISO está em UTC, então mostramos no fuso do
 * servidor convertendo via toLocaleString — mantém consistência com o
 * que aparece na grade.
 */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EditarAgendamentoForm({
  agendamento,
  veiculos,
  unidades,
  isAdmin,
}: {
  agendamento: AgendamentoIn;
  veiculos: Veiculo[];
  unidades: Unidade[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [acaoEmCurso, setAcaoEmCurso] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function patch(payload: Record<string, unknown>, mensagemErro: string) {
    setErro("");
    const res = await fetch(`/api/agendamentos/${agendamento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setErro(err?.error || mensagemErro);
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      veiculoId: fd.get("veiculoId"),
      unidadeId: fd.get("unidadeId"),
      motivo: fd.get("motivo"),
      observacao: fd.get("observacao") || null,
      dataInicio: fd.get("dataInicio"),
      dataFim: fd.get("dataFim"),
    };
    const ok = await patch(payload, "Erro ao salvar alterações");
    setSalvando(false);
    if (ok) router.refresh();
  }

  async function cancelarAgendamento() {
    if (!confirm("Cancelar este agendamento? Ele sai da grade e vai para a aba de Canceladas.")) {
      return;
    }
    setAcaoEmCurso("cancelar");
    const ok = await patch({ status: "cancelado" }, "Erro ao cancelar");
    setAcaoEmCurso(null);
    if (ok) router.push("/agendamentos");
  }

  async function promoverParaAprovado() {
    setAcaoEmCurso("promover");
    const ok = await patch({ status: "aprovado" }, "Erro ao promover (provável conflito)");
    setAcaoEmCurso(null);
    if (ok) router.refresh();
  }

  async function excluir() {
    if (!confirm("Excluir DEFINITIVAMENTE este agendamento? Não há volta — use cancelar para preservar histórico.")) {
      return;
    }
    setAcaoEmCurso("excluir");
    const res = await fetch(`/api/agendamentos/${agendamento.id}`, {
      method: "DELETE",
    });
    setAcaoEmCurso(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setErro(err?.error || "Erro ao excluir");
      return;
    }
    router.push("/agendamentos");
  }

  const isCancelado = agendamento.status === "cancelado";
  const isListaEspera = agendamento.status === "lista_espera";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Editar</h2>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
            <select
              name="veiculoId"
              defaultValue={agendamento.veiculoId}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa} — {v.modelo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
            <select
              name="unidadeId"
              defaultValue={agendamento.unidadeId ?? ""}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
          <input
            name="motivo"
            defaultValue={agendamento.motivo}
            required
            minLength={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
          <textarea
            name="observacao"
            defaultValue={agendamento.observacao ?? ""}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
            <input
              name="dataInicio"
              type="datetime-local"
              defaultValue={isoToLocalInput(agendamento.dataInicio)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim *</label>
            <input
              name="dataFim"
              type="datetime-local"
              defaultValue={isoToLocalInput(agendamento.dataFim)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={salvando}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar alterações"}
          </button>

          {isListaEspera && (
            <button
              type="button"
              onClick={promoverParaAprovado}
              disabled={acaoEmCurso !== null}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {acaoEmCurso === "promover" ? "Promovendo…" : "Promover para agendado"}
            </button>
          )}

          {!isCancelado && (
            <button
              type="button"
              onClick={cancelarAgendamento}
              disabled={acaoEmCurso !== null}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              {acaoEmCurso === "cancelar" ? "Cancelando…" : "Cancelar agendamento"}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={excluir}
              disabled={acaoEmCurso !== null}
              className="ml-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {acaoEmCurso === "excluir" ? "Excluindo…" : "Excluir definitivamente"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
