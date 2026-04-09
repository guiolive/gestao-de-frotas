"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  categoriaCnh: string;
  telefone: string;
  email: string;
  status: string;
}

export default function EditarMotoristaPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [motorista, setMotorista] = useState<Motorista | null>(null);

  useEffect(() => {
    fetch(`/api/motoristas/${params.id}`)
      .then((r) => r.json())
      .then(setMotorista);
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    await fetch(`/api/motoristas/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.push(`/motoristas/${params.id}`);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este motorista?")) return;
    await fetch(`/api/motoristas/${params.id}`, { method: "DELETE" });
    router.push("/motoristas");
  }

  if (!motorista) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Motorista — {motorista.nome}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input name="nome" required defaultValue={motorista.nome} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
            <input name="cpf" required defaultValue={motorista.cpf} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNH *</label>
            <input name="cnh" required defaultValue={motorista.cnh} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria CNH *</label>
            <select name="categoriaCnh" required defaultValue={motorista.categoriaCnh} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
            <input name="telefone" required defaultValue={motorista.telefone} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input name="email" type="email" required defaultValue={motorista.email} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue={motorista.status} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <button type="button" onClick={() => router.push(`/motoristas/${params.id}`)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors ml-auto">
            Excluir
          </button>
        </div>
      </form>
    </div>
  );
}
