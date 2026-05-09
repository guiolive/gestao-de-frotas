"use client";

import { useEffect } from "react";

/**
 * Captura erros não tratados em qualquer rota do dashboard. Por contrato
 * do Next, precisa ser client component. Mostra mensagem amigável e
 * botão de retry; o erro real vai pro console (server logs já capturam
 * pelo lado do server quando o erro nasce lá).
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("dashboard error boundary", error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto mt-12 text-center">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Algo deu errado
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Não conseguimos carregar essa página. Tente de novo — se persistir,
          recarregue a janela ou avise o administrador.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6 font-mono">
            ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
