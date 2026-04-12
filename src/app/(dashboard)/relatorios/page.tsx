"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CustoVeiculo {
  veiculoId: string;
  placa: string;
  modelo: string;
  marca: string;
  custoTotal: number;
  qtdManutencoes: number;
}

interface CustoMes {
  mes: string;
  custo: number;
}

interface RelatorioData {
  custoTotal: number;
  custosPorVeiculo: CustoVeiculo[];
  custosPorMes: CustoMes[];
  veiculoMaisCaro: { placa: string; modelo: string; custo: number } | null;
  mediaCustoPorVeiculo: number;
  totalManutencoes: number;
}

const CORES = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function exportCSV(data: CustoVeiculo[], custosPorMes: CustoMes[]) {
  // Sheet 1: Custos por veículo
  let csv = "Placa;Modelo;Marca;Custo Total;Qtd Manutenções\n";
  data.forEach((v) => {
    csv += `${v.placa};${v.modelo};${v.marca};${v.custoTotal.toFixed(2)};${v.qtdManutencoes}\n`;
  });
  csv += "\n\nMês;Custo\n";
  custosPorMes.forEach((m) => {
    csv += `${m.mes};${m.custo.toFixed(2)}\n`;
  });

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-custos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const fetchData = useCallback(
    async (inicio?: string, fim?: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (inicio) params.set("dataInicio", inicio);
      if (fim) params.set("dataFim", fim);

      const res = await fetch(`/api/relatorios/custos?${params.toString()}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFiltrar() {
    fetchData(dataInicio || undefined, dataFim || undefined);
  }

  function handleLimpar() {
    setDataInicio("");
    setDataFim("");
    fetchData();
  }

  if (loading || !data) {
    return <div className="text-gray-500">Carregando relatórios...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Relatórios de Custos
      </h1>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Início
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Fim
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleFiltrar}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Filtrar
        </button>
        <button
          onClick={handleLimpar}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Limpar
        </button>
        <button
          onClick={() => data && exportCSV(data.custosPorVeiculo, data.custosPorMes)}
          disabled={!data || data.custosPorVeiculo.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors ml-auto"
        >
          Exportar CSV
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Custo Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.custoTotal)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Média por Veículo</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.mediaCustoPorVeiculo)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Veículo Mais Caro</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.veiculoMaisCaro
              ? `${data.veiculoMaisCaro.placa} - ${data.veiculoMaisCaro.modelo}`
              : "N/A"}
          </p>
          {data.veiculoMaisCaro && (
            <p className="text-sm text-gray-500">
              {formatCurrency(data.veiculoMaisCaro.custo)}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Manutenções</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.totalManutencoes}
          </p>
        </div>
      </div>

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar chart - custo por veiculo */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Custo por Veículo
          </h2>
          {data.custosPorVeiculo.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.custosPorVeiculo}
                layout="vertical"
                margin={{ left: 60, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) =>
                    v.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                    })
                  }
                />
                <YAxis type="category" dataKey="placa" width={70} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Custo",
                  ]}
                />
                <Bar dataKey="custoTotal">
                  {data.custosPorVeiculo.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              Sem dados de custo.
            </p>
          )}
        </div>

        {/* Line chart - evolucao mensal */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Evolução Mensal
          </h2>
          {data.custosPorMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.custosPorMes}
                margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis
                  tickFormatter={(v) =>
                    v.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      notation: "compact",
                    })
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Custo",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="custo"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              Sem dados mensais.
            </p>
          )}
        </div>
      </div>

      {/* Tabela detalhada */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-800 p-4 border-b">
          Detalhamento por Veículo
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Placa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Modelo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Marca
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Custo Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Qtd Manutenções
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.custosPorVeiculo.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Nenhum dado disponível.
                </td>
              </tr>
            )}
            {data.custosPorVeiculo.map((v) => (
              <tr key={v.veiculoId} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {v.placa}
                </td>
                <td className="px-6 py-4 text-gray-700">{v.modelo}</td>
                <td className="px-6 py-4 text-gray-700">{v.marca}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  {formatCurrency(v.custoTotal)}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {v.qtdManutencoes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
