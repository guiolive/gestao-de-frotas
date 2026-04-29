"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovoVeiculoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    // Remove campos vazios para não mandar "" ao invés de null e pegar
    // validação Zod de string vazia em campos opcionais.
    const data: Record<string, unknown> = {};
    for (const [k, v] of formData.entries()) {
      if (typeof v === "string" && v.trim() === "") continue;
      data[k] = v;
    }

    const res = await fetch("/api/veiculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      const detail =
        body.issues?.map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join("; ") ||
        body.error ||
        "Erro ao criar veículo";
      setErro(detail);
      setLoading(false);
      return;
    }

    router.push("/veiculos");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Veículo</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa *
            </label>
            <input
              name="placa"
              required
              placeholder="ABC-1234"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              name="tipo"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione</option>
              <option value="carro">Passeio</option>
              <option value="van">Van</option>
              <option value="micro_onibus">Micro-ônibus</option>
              <option value="onibus">Ônibus</option>
              <option value="caminhao">Caminhão</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <input
              name="marca"
              required
              placeholder="Toyota"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo *
            </label>
            <input
              name="modelo"
              required
              placeholder="Corolla"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ano *
            </label>
            <input
              name="ano"
              type="number"
              required
              placeholder="2024"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor *
            </label>
            <input
              name="cor"
              required
              placeholder="Branco"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quilometragem
            </label>
            <input
              name="quilometragem"
              type="number"
              defaultValue={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Renavam
            </label>
            <input
              name="renavam"
              placeholder="9 a 11 dígitos"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chassi
            </label>
            <input
              name="chassi"
              placeholder="17 caracteres (sem I/O/Q)"
              maxLength={17}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Combustível
            </label>
            <select
              name="combustivel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione</option>
              <option value="flex">Flex</option>
              <option value="gasolina">Gasolina</option>
              <option value="etanol">Etanol</option>
              <option value="diesel">Diesel</option>
              <option value="gnv">GNV</option>
              <option value="hibrido">Híbrido</option>
              <option value="eletrico">Elétrico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor de aquisição (R$)
            </label>
            <input
              name="valorVeiculo"
              type="number"
              step="0.01"
              min="0"
              placeholder="Opcional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/veiculos")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
