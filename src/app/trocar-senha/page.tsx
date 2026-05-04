"use client";

/**
 * Tela de troca de senha obrigatória no primeiro acesso.
 * Acessada via redirect do login quando `requirePasswordChange === true`.
 * POST `/api/auth/trocar-senha` (já protegido pelo cookie de sessão).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrar, setMostrar] = useState(false);
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
    if (novaSenha === senhaAtual) {
      setErro("A nova senha precisa ser diferente da atual.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao trocar senha");
        if (Array.isArray(data.erros)) setErrosSenha(data.erros);
        return;
      }
      setSucesso(true);
      // Cookie de sessão renovado pelo handler — vai pro dashboard
      setTimeout(() => router.push("/"), 1500);
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  if (sucesso) {
    return (
      <Layout>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Senha trocada!</h2>
          <p className="text-slate-300 text-sm">Redirecionando…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/10">
        <h2 className="text-xl font-semibold text-white mb-1">Trocar senha</h2>
        <p className="text-slate-300 text-sm mb-6">
          Primeiro acesso — escolha uma senha pessoal pra usar daqui pra frente.
        </p>

        {erro && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
            {erro}
            {errosSenha.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-xs">
                {errosSenha.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Campo
            label="Senha atual (temporária)"
            value={senhaAtual}
            onChange={setSenhaAtual}
            mostrar={mostrar}
            setMostrar={setMostrar}
          />
          <Campo
            label="Nova senha"
            value={novaSenha}
            onChange={setNovaSenha}
            mostrar={mostrar}
            setMostrar={setMostrar}
          />
          <Campo
            label="Confirmar nova senha"
            value={confirmarSenha}
            onChange={setConfirmarSenha}
            mostrar={mostrar}
            setMostrar={setMostrar}
          />

          <p className="text-slate-400 text-xs">
            Mín. 8 caracteres, com letras maiúsculas, minúsculas, número e símbolo.
          </p>

          <button
            type="submit"
            disabled={loading || !senhaAtual || !novaSenha || !confirmarSenha}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando…" : "Trocar senha"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mb-3">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl">Gestão de Frotas</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  mostrar,
  setMostrar,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mostrar: boolean;
  setMostrar: (v: boolean) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type={mostrar ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setMostrar(!mostrar)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          aria-label="Mostrar/ocultar senha"
        >
          {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
