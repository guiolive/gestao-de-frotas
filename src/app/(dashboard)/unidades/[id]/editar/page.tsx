"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Unidade {
  id: string;
  sigla: string;
  nome: string;
  ativo: boolean;
}

export default function EditarUnidadePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [unidade, setUnidade] = useState<Unidade | null>(null);

  useEffect(() => {
    fetch(`/api/unidades/${params.id}`)
      .then((r) => r.json())
      .then(setUnidade);
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const data = {
      sigla: (formData.get("sigla") as string).trim().toUpperCase(),
      nome: (formData.get("nome") as string).trim(),
      ativo: formData.get("ativo") === "true",
    };

    const res = await fetch(`/api/unidades/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json();
      setErro(body.error || "Erro ao atualizar unidade");
      setLoading(false);
      return;
    }

    router.push("/unidades");
  }

  if (!unidade) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Editar Unidade - {unidade.sigla}
      </h1>

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
            defaultValue={unidade.sigla}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            name="nome"
            required
            defaultValue={unidade.nome}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="ativo"
            defaultValue={unidade.ativo ? "true" : "false"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
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
