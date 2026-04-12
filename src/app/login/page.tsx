"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao fazer login");
        return;
      }

      if (data.requirePasswordChange) {
        router.push("/trocar-senha");
      } else {
        router.push("/");
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecuperarSenha(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensagemRecuperacao("");

    try {
      await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailRecuperacao }),
      });
      setMensagemRecuperacao("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha. O link expira em 1 hora.");
    } catch {
      setMensagemRecuperacao("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha. O link expira em 1 hora.");
    } finally {
      setLoading(false);
    }
  }

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

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
          {!modoRecuperacao ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <h2 className="text-xl font-semibold text-white text-center mb-6">Entrar</h2>

              {erro && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={mostrarSenha ? "text" : "password"} required value={senha} onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <button type="button" onClick={() => setModoRecuperacao(true)}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors">
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecuperarSenha} className="space-y-5">
              <button type="button" onClick={() => { setModoRecuperacao(false); setMensagemRecuperacao(""); }}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </button>

              <h2 className="text-xl font-semibold text-white text-center">Recuperar Senha</h2>

              {mensagemRecuperacao && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm">
                  {mensagemRecuperacao}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email" required value={emailRecuperacao} onChange={(e) => setEmailRecuperacao(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
