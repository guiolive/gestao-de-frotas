"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Veiculo { id: string; placa: string; modelo: string; status: string; }

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  useEffect(() => {
    fetch("/api/veiculos").then((r) => r.json()).then(setVeiculos);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const res = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setErro(err.error || "Erro ao criar agendamento");
      setLoading(false);
      return;
    }

    router.push("/agendamentos");
  }

  const veiculosDisponiveis = veiculos.filter((v) => v.status === "disponivel");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Agendamento</h1>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
          <select name="veiculoId" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Selecione</option>
            {veiculosDisponiveis.map((v) => (
              <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante *</label>
            <input name="solicitante" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <input name="motivo" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora Início *</label>
            <input name="dataInicio" type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora Fim *</label>
            <input name="dataFim" type="datetime-local" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={() => router.push("/agendamentos")} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
