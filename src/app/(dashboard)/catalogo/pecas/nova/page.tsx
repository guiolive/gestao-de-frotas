"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovaPecaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const valor = (formData.get("valorReferencia") as string).trim();
    const data = {
      nome: (formData.get("nome") as string).trim(),
      codigo: ((formData.get("codigo") as string) || "").trim() || null,
      unidade: ((formData.get("unidade") as string) || "").trim() || null,
      valorReferencia: valor ? Number(valor) : null,
    };

    const res = await fetch("/api/catalogo/pecas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setErro(body.error || "Erro ao criar peça");
      setLoading(false);
      return;
    }

    router.push("/catalogo/pecas");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Peça</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {erro}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            name="nome"
            required
            placeholder="Ex: Filtro de óleo motor"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              name="codigo"
              placeholder="Fabricante/fornecedor"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
            <input
              name="unidade"
              placeholder="UN, L, KG"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor de referência (R$)
          </label>
          <input
            name="valorReferencia"
            type="number"
            step="0.01"
            min="0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
            onClick={() => router.push("/catalogo/pecas")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
