"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [senhaGerada, setSenhaGerada] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      tipo: formData.get("tipo"),
      matricula: formData.get("matricula") || null,
    };

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      setErro(result.error || "Erro ao criar usuario");
      setLoading(false);
      return;
    }

    setSenhaGerada(result.senhaTemporaria);
    setLoading(false);
  }

  if (senhaGerada) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuario Criado</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-lg">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-medium mb-2">Usuario criado com sucesso!</p>
            <p className="text-sm text-green-700">
              Informe a senha temporaria abaixo ao usuario. Ele devera troca-la no primeiro acesso.
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Senha temporaria:</p>
            <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider select-all">
              {senhaGerada}
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Esta senha so sera exibida uma vez. Anote-a antes de sair desta pagina.
          </p>
          <button
            onClick={() => router.push("/usuarios")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para lista de usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Usuario</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              name="nome"
              required
              placeholder="Nome completo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="usuario@ufg.br"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privilégio *
            </label>
            <select
              name="tipo"
              required
              defaultValue="OPERADOR"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="OPERADOR">Operador</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor *
            </label>
            <select
              name="setor"
              required
              defaultValue="AMBOS"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TRANSPORTE">Transporte</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="AMBOS">Ambos (visão geral)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matricula
            </label>
            <input
              name="matricula"
              placeholder="Opcional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          Uma senha temporaria sera gerada automaticamente. O usuario devera troca-la no primeiro login.
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Criando..." : "Criar Usuario"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/usuarios")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
