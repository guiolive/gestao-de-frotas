"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  ativo: boolean;
  matricula: string | null;
  primeiroAcesso: boolean;
}

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [erro, setErro] = useState("");
  const [senhaResetada, setSenhaResetada] = useState("");
  const [resetando, setResetando] = useState(false);

  useEffect(() => {
    fetch(`/api/usuarios/${params.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsuario)
      .catch(() => {});
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      tipo: formData.get("tipo"),
      matricula: formData.get("matricula") || null,
      ativo: formData.get("ativo") === "true",
    };

    const res = await fetch(`/api/usuarios/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const result = await res.json();
      setErro(result.error || "Erro ao atualizar usuario");
      setLoading(false);
      return;
    }

    router.push(`/usuarios/${params.id}`);
  }

  async function handleResetarSenha() {
    if (!confirm("Tem certeza que deseja resetar a senha deste usuario?")) return;
    setResetando(true);
    setErro("");

    const res = await fetch(`/api/usuarios/${params.id}/resetar-senha`, {
      method: "PATCH",
    });

    const result = await res.json();
    if (!res.ok) {
      setErro(result.error || "Erro ao resetar senha");
      setResetando(false);
      return;
    }

    setSenhaResetada(result.senhaTemporaria);
    setResetando(false);
  }

  async function handleExcluir() {
    if (!confirm("Tem certeza que deseja EXCLUIR este usuario? Esta acao nao pode ser desfeita.")) return;

    const res = await fetch(`/api/usuarios/${params.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const result = await res.json();
      setErro(result.error || "Erro ao excluir usuario");
      return;
    }

    router.push("/usuarios");
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Editar Usuario: {usuario.nome}
      </h1>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
          {erro}
        </div>
      )}

      {senhaResetada && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-800 font-medium mb-2">Senha resetada com sucesso!</p>
          <p className="text-sm text-green-700 mb-2">Nova senha temporaria:</p>
          <p className="text-xl font-mono font-bold text-green-900 tracking-wider select-all">
            {senhaResetada}
          </p>
          <p className="text-xs text-green-600 mt-2">
            Esta senha so sera exibida uma vez. Anote-a antes de sair desta pagina.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              name="nome"
              required
              defaultValue={usuario.nome}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              value={usuario.email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">E-mail nao pode ser alterado</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              name="tipo"
              required
              defaultValue={usuario.tipo}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="OPERADOR">Operador</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matricula
            </label>
            <input
              name="matricula"
              defaultValue={usuario.matricula || ""}
              placeholder="Opcional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="ativo"
              defaultValue={usuario.ativo ? "true" : "false"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
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
            onClick={() => router.push(`/usuarios/${params.id}`)}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acoes</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleResetarSenha}
            disabled={resetando}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            {resetando ? "Resetando..." : "Resetar Senha"}
          </button>
          <button
            type="button"
            onClick={handleExcluir}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Excluir Usuario
          </button>
        </div>
      </div>
    </div>
  );
}
