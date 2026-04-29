"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

const CATEGORIAS_LABELS: Record<string, string> = {
  motor: "Motor", freios: "Freios", pneus: "Pneus", suspensao: "Suspensão",
  eletrica: "Elétrica", lataria: "Lataria", ar_condicionado: "Ar Condicionado",
  farois: "Faróis", outros: "Outros",
};

interface ChecklistItem { id: string; categoria: string; temProblema: boolean; descricao: string | null; }
interface ItemManutencao { id: string; servico: string; valor: number; observacao: string | null; }
interface Manutencao {
  id: string; veiculoId: string; tipo: string; descricao: string;
  dataEntrada: string; previsaoDias: number; previsaoSaida: string | null;
  custoEstimado: number | null; valorTotal: number | null; status: string;
  oficinaId: string | null;
  enviadaPrimeEm: string | null;
  retornoEfetivoEm: string | null;
  veiculo: { placa: string; modelo: string };
  checklist: ChecklistItem[]; itens: ItemManutencao[];
}
interface OficinaSelect { id: string; nome: string; cnpj: string; ativa: boolean; }

export default function DetalhesManutencaoPage() {
  const router = useRouter();
  const params = useParams();
  const [manutencao, setManutencao] = useState<Manutencao | null>(null);
  const [loading, setLoading] = useState(false);
  const [oficinas, setOficinas] = useState<OficinaSelect[]>([]);
  const [primeMsg, setPrimeMsg] = useState("");

  useEffect(() => {
    fetch(`/api/manutencoes/${params.id}`).then((r) => r.json()).then(setManutencao);
    fetch(`/api/oficinas?ativa=true`).then((r) => r.json()).then(setOficinas);
  }, [params.id]);

  async function atualizarStatus(status: string) {
    setLoading(true);
    await fetch(`/api/manutencoes/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (status === "concluida") {
      router.push("/manutencoes");
    } else {
      const res = await fetch(`/api/manutencoes/${params.id}`);
      setManutencao(await res.json());
    }
    setLoading(false);
  }

  async function atualizarPrime(payload: Record<string, unknown>, msg: string) {
    setLoading(true);
    setPrimeMsg("");
    const res = await fetch(`/api/manutencoes/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setPrimeMsg("Erro ao atualizar.");
    } else {
      setPrimeMsg(msg);
      const novo = await fetch(`/api/manutencoes/${params.id}`);
      setManutencao(await novo.json());
    }
    setLoading(false);
  }

  if (!manutencao) return <div className="text-gray-500">Carregando...</div>;

  const problemas = manutencao.checklist.filter((c) => c.temProblema);
  const valorTotalItens = manutencao.itens.reduce((acc, i) => acc + i.valor, 0);

  // Status Prime / atraso
  const hoje = new Date();
  const previsao = manutencao.previsaoSaida ? new Date(manutencao.previsaoSaida) : null;
  const enviada = !!manutencao.enviadaPrimeEm;
  const retornou = !!manutencao.retornoEfetivoEm;
  const emAtraso = enviada && !retornou && previsao && previsao < hoje;
  const diasAtraso = emAtraso && previsao
    ? Math.floor((hoje.getTime() - previsao.getTime()) / 86400000)
    : 0;
  const oficinaAtual = oficinas.find((o) => o.id === manutencao.oficinaId) || null;

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manutenção - {manutencao.veiculo.placa}</h1>
        <button onClick={() => router.push("/manutencoes")} className="text-gray-600 hover:text-gray-800">Voltar</button>
      </div>

      <div className="space-y-6">
        {/* Info geral */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Veículo:</span>
              <p className="font-medium">{manutencao.veiculo.placa} - {manutencao.veiculo.modelo}</p>
            </div>
            <div>
              <span className="text-gray-500">Tipo:</span>
              <p className="font-medium capitalize">{manutencao.tipo}</p>
            </div>
            <div>
              <span className="text-gray-500">Data de Entrada:</span>
              <p className="font-medium">{new Date(manutencao.dataEntrada).toLocaleDateString("pt-BR")}</p>
            </div>
            <div>
              <span className="text-gray-500">Previsão:</span>
              <p className="font-medium">{manutencao.previsaoDias} dia(s)</p>
            </div>
            <div>
              <span className="text-gray-500">Previsão de Saída:</span>
              <p className="font-medium">{manutencao.previsaoSaida ? new Date(manutencao.previsaoSaida).toLocaleDateString("pt-BR") : "—"}</p>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <p className="font-medium capitalize">{manutencao.status.replace("_", " ")}</p>
            </div>
            <div>
              <span className="text-gray-500">Custo Estimado:</span>
              <p className="font-medium">
                {manutencao.custoEstimado
                  ? `R$ ${manutencao.custoEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Custo Real:</span>
              <p className={`font-medium ${manutencao.custoEstimado && valorTotalItens > manutencao.custoEstimado ? "text-red-600" : ""}`}>
                {valorTotalItens > 0
                  ? `R$ ${valorTotalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                  : "—"}
                {manutencao.custoEstimado && valorTotalItens > 0 && (
                  <span className={`text-xs ml-2 ${valorTotalItens > manutencao.custoEstimado ? "text-red-500" : "text-green-500"}`}>
                    ({valorTotalItens <= manutencao.custoEstimado ? "dentro" : "acima"} do estimado)
                  </span>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Descrição:</span>
              <p className="font-medium">{manutencao.descricao}</p>
            </div>
          </div>

          {manutencao.status !== "concluida" && (
            <div className="flex gap-3 mt-6 pt-4 border-t">
              {manutencao.status === "aguardando" && (
                <button onClick={() => atualizarStatus("em_andamento")} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  Iniciar Manutenção
                </button>
              )}
              <button onClick={() => atualizarStatus("concluida")} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                Concluir Manutenção
              </button>
            </div>
          )}
        </div>

        {/* Prime / Oficina */}
        <div
          className={`bg-white rounded-lg shadow p-6 border ${
            emAtraso ? "border-red-300 bg-red-50/30" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Oficina / Prime</h2>
              <p className="text-xs text-gray-500 mt-1">
                Rastreio manual. Integração com webservice da Prime pendente.
              </p>
            </div>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
                retornou
                  ? "bg-emerald-600 text-white"
                  : emAtraso
                    ? "bg-red-600 text-white"
                    : enviada
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-700"
              }`}
            >
              {retornou
                ? "Retornou"
                : emAtraso
                  ? `${diasAtraso}d em atraso`
                  : enviada
                    ? "Em Prime"
                    : "Não enviada"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500">Oficina</span>
              <p className="font-medium mt-1">{oficinaAtual ? oficinaAtual.nome : "—"}</p>
              {oficinaAtual && (
                <Link
                  href={`/oficinas/${oficinaAtual.id}`}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Ver oficina ↗
                </Link>
              )}
            </div>
            <div>
              <span className="text-gray-500">Enviada para Prime</span>
              <p className="font-medium mt-1">
                {manutencao.enviadaPrimeEm
                  ? new Date(manutencao.enviadaPrimeEm).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Retorno efetivo</span>
              <p className="font-medium mt-1">
                {manutencao.retornoEfetivoEm
                  ? new Date(manutencao.retornoEfetivoEm).toLocaleDateString("pt-BR")
                  : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vincular oficina
              </label>
              <select
                value={manutencao.oficinaId || ""}
                onChange={(e) =>
                  atualizarPrime(
                    { oficinaId: e.target.value || null },
                    "Oficina atualizada."
                  )
                }
                disabled={loading}
                className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">— sem oficina —</option>
                {oficinas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {!enviada && (
                <button
                  onClick={() =>
                    atualizarPrime(
                      { enviadaPrimeEm: new Date().toISOString() },
                      "Marcada como enviada para Prime."
                    )
                  }
                  disabled={loading || !manutencao.oficinaId}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  title={!manutencao.oficinaId ? "Vincule uma oficina primeiro" : ""}
                >
                  Marcar enviada para Prime
                </button>
              )}
              {enviada && !retornou && (
                <button
                  onClick={() =>
                    atualizarPrime(
                      { retornoEfetivoEm: new Date().toISOString() },
                      "Retorno do veículo registrado."
                    )
                  }
                  disabled={loading}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Marcar retorno efetivo
                </button>
              )}
              {(enviada || retornou) && (
                <button
                  onClick={() =>
                    atualizarPrime(
                      { enviadaPrimeEm: null, retornoEfetivoEm: null },
                      "Marcações Prime limpas."
                    )
                  }
                  disabled={loading}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Limpar Prime
                </button>
              )}
            </div>

            {primeMsg && (
              <p className="text-sm text-emerald-700">{primeMsg}</p>
            )}
            {emAtraso && (
              <p className="text-sm text-red-700 font-medium">
                Veículo está {diasAtraso} dias além da previsão de saída.
              </p>
            )}
          </div>
        </div>

        {/* Itens de Serviço */}
        {manutencao.itens.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Itens de Serviço</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500 font-medium">Serviço</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Valor</th>
                  <th className="text-left py-2 text-gray-500 font-medium pl-4">Observação</th>
                </tr>
              </thead>
              <tbody>
                {manutencao.itens.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 text-gray-900">{item.servico}</td>
                    <td className="py-3 text-right text-gray-900 font-medium">
                      R$ {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-gray-500 pl-4">{item.observacao || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td className="py-3 font-bold text-gray-900">Total</td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    R$ {valorTotalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Checklist */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Checklist ({problemas.length} problema{problemas.length !== 1 ? "s" : ""})
          </h2>
          {manutencao.checklist.length === 0 ? (
            <p className="text-gray-500">Nenhum item no checklist.</p>
          ) : (
            <div className="space-y-2">
              {manutencao.checklist.map((item) => (
                <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${item.temProblema ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <span className={`text-lg ${item.temProblema ? "text-red-500" : "text-green-500"}`}>
                    {item.temProblema ? "✗" : "✓"}
                  </span>
                  <div>
                    <p className={`font-medium ${item.temProblema ? "text-red-700" : "text-green-700"}`}>
                      {CATEGORIAS_LABELS[item.categoria] || item.categoria}
                    </p>
                    {item.temProblema && item.descricao && (
                      <p className="text-sm text-red-600 mt-1">{item.descricao}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
