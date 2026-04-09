"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovaUnidadePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const data = {
      sigla: (formData.get("sigla") as string).trim().toUpperCase(),
      nome: (formData.get("nome") as string).trim(),
    };

    const res = await fetch("/api/unidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setErro(body.error || "Erro ao criar unidade");
      setLoading(false);
      return;
    }

    router.push("/unidades");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Unidade</h1>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sigla *
          </label>
          <input
            name="sigla"
            required
            placeholder="Ex: CGTI"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          />
          <p className="text-xs text-gray-500 mt-1">
            Sera convertida automaticamente para maiusculas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            name="nome"
            required
            placeholder="Ex: Coordenacao Geral de Tecnologia da Informacao"
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
            onClick={() => router.push("/unidades")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
