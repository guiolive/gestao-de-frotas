"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Oficina {
  id: string;
  nome: string;
  cnpj: string;
  whatsapp: string | null;
  enderecoTexto: string | null;
  googleMapsUrl: string | null;
  ativa: boolean;
}

export default function EditarOficinaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [oficina, setOficina] = useState<Oficina | null>(null);

  useEffect(() => {
    fetch(`/api/oficinas/${params.id}`)
      .then((r) => r.json())
      .then(setOficina);
  }, [params.id]);

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
      ativa: formData.get("ativa") === "true",
    };

    const res = await fetch(`/api/oficinas/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setErro(body.error || "Erro ao atualizar oficina");
      setLoading(false);
      return;
    }

    router.push("/oficinas");
  }

  if (!oficina) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Oficina — {oficina.nome}</h1>

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
            defaultValue={oficina.nome}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
          <input
            name="cnpj"
            required
            defaultValue={oficina.cnpj}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={oficina.whatsapp || ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <textarea
            name="enderecoTexto"
            rows={2}
            defaultValue={oficina.enderecoTexto || ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Maps</label>
          <input
            name="googleMapsUrl"
            defaultValue={oficina.googleMapsUrl || ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="ativa"
            defaultValue={oficina.ativa ? "true" : "false"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </select>
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
