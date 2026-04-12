"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Eye, EyeOff, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetarSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [errosSenha, setErrosSenha] = useState<string[]>([]);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setErrosSenha([]);

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    if (!token) {
      setErro("Link inválido. Solicite um novo link de redefinição.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/resetar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao redefinir senha");
        if (Array.isArray(data.erros)) setErrosSenha(data.erros);
        return;
      }
      setSucesso(true);
      // Redireciona pro login depois de 3s
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
          Link inválido ou ausente. Volte para o login e solicite um novo link.
        </div>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </button>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Senha redefinida!</h2>
        <p className="text-slate-300 text-sm mb-6">
          Sua senha foi atualizada com sucesso. Redirecionando para o login...
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Ir para login
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-xl font-semibold text-white text-center mb-2">Redefinir Senha</h2>
        <p className="text-sm text-slate-400 text-center mb-4">
          Escolha uma senha nova e segura.
        </p>

        {erro && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
            <p>{erro}</p>
            {errosSenha.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-xs">
                {errosSenha.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={mostrarSenha ? "text" : "password"}
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Confirmar nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={mostrarSenha ? "text" : "password"}
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a senha"
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Redefinindo..." : "Redefinir senha"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </button>
      </form>
    </div>
  );
}

export default function ResetarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Gestão de Frotas</h1>
          <p className="text-slate-400 mt-1">Sistema de Gerenciamento de Veículos</p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10 text-center text-slate-300">
              Carregando...
            </div>
          }
        >
          <ResetarSenhaForm />
        </Suspense>
      </div>
    </div>
  );
}
