"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovaOficinaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: (formData.get("nome") as string).trim(),
      cnpj: (formData.get("cnpj") as string).trim(),
      whatsapp: ((formData.get("whatsapp") as string) || "").trim() || null,
      enderecoTexto: ((formData.get("enderecoTexto") as string) || "").trim() || null,
      googleMapsUrl: ((formData.get("googleMapsUrl") as string) || "").trim() || null,
    };

    const res = await fetch("/api/oficinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setErro(body.error || "Erro ao criar oficina");
      setLoading(false);
      return;
    }

    router.push("/oficinas");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Oficina</h1>

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
            placeholder="Ex: Prime Manutenção"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
          <input
            name="cnpj"
            required
            placeholder="00.000.000/0000-00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Pode ser com ou sem máscara — salvamos só os dígitos.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            name="whatsapp"
            placeholder="62999999999 ou 5562999999999"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <textarea
            name="enderecoTexto"
            rows={2}
            placeholder="Rua, número, bairro, cidade"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link Google Maps
          </label>
          <input
            name="googleMapsUrl"
            placeholder="https://maps.app.goo.gl/..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Cole o link compartilhado do Google Maps (curto ou longo).
          </p>
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
            onClick={() => router.push("/oficinas")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
