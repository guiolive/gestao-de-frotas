"use client";

/**
 * Toggle "Transporte / Manutenção" pra usuários AMBOS escolherem qual
 * dashboard ver. A escolha vai num cookie `gf-dashboard-view` que o
 * server component lê na próxima request — persiste entre sessões.
 *
 * Por que cookie e não localStorage:
 *   - Server component precisa saber qual view antes de buscar dados.
 *   - Cookie viaja com a request automaticamente; localStorage não.
 *   - Não precisa ser httpOnly (não é informação sensível); deixamos
 *     legível no cliente pra evitar flicker se quiser ler antes do server.
 */
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Calendar, Wrench } from "lucide-react";

type Visao = "TRANSPORTE" | "MANUTENCAO";

const COOKIE_NAME = "gf-dashboard-view";
// 1 ano em segundos — escolha do user é "permanente" até trocar de novo.
const UM_ANO = 60 * 60 * 24 * 365;

export default function DashboardViewSwitcher({ atual }: { atual: Visao }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();

  function trocar(visao: Visao) {
    if (visao === atual) return;
    document.cookie = `${COOKIE_NAME}=${visao}; path=/; max-age=${UM_ANO}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  const base =
    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors";
  const ativo = "bg-blue-600 text-white";
  const inativo = "bg-white text-gray-700 hover:bg-gray-50";

  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 overflow-hidden ${
        pendente ? "opacity-60" : ""
      }`}
      role="tablist"
      aria-label="Escolher visão do dashboard"
    >
      <button
        type="button"
        role="tab"
        aria-selected={atual === "TRANSPORTE"}
        onClick={() => trocar("TRANSPORTE")}
        className={`${base} ${atual === "TRANSPORTE" ? ativo : inativo}`}
      >
        <Calendar className="w-4 h-4" /> Transporte
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={atual === "MANUTENCAO"}
        onClick={() => trocar("MANUTENCAO")}
        className={`${base} ${atual === "MANUTENCAO" ? ativo : inativo} border-l border-gray-200`}
      >
        <Wrench className="w-4 h-4" /> Manutenção
      </button>
    </div>
  );
}
