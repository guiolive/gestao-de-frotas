"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  status: string;
}
interface ServicoResult {
  categoria: string;
  servico: string;
}
interface ItemServico {
  servico: string;
  valor: string;
  observacao: string;
}

const CATEGORIAS_CHECKLIST = [
  { value: "motor", label: "Motor" },
  { value: "freios", label: "Freios" },
  { value: "pneus", label: "Pneus" },
  { value: "suspensao", label: "Suspens\u00e3o" },
  { value: "transmissao", label: "Transmiss\u00e3o" },
  { value: "eletrica", label: "El\u00e9trica" },
  { value: "fluidos", label: "Fluidos" },
  { value: "carroceria", label: "Carroceria" },
  { value: "documentacao", label: "Documenta\u00e7\u00e3o" },
];

export default function NovaManutencaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [checklist, setChecklist] = useState(
    CATEGORIAS_CHECKLIST.map((c) => ({
      categoria: c.value,
      temProblema: false,
      descricao: "",
    }))
  );

  // Service items
  const [itens, setItens] = useState<ItemServico[]>([]);
  const [buscaServico, setBuscaServico] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<ServicoResult[]>([]);
  const [showBusca, setShowBusca] = useState(false);

  useEffect(() => {
    fetch("/api/veiculos")
      .then((r) => r.json())
      .then(setVeiculos);
  }, []);

  useEffect(() => {
    if (buscaServico.length >= 2) {
      const timeout = setTimeout(() => {
        fetch(`/api/servicos?q=${encodeURIComponent(buscaServico)}`)
          .then((r) => r.json())
          .then((data) => {
            setResultadosBusca(data);
            setShowBusca(true);
          });
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      setResultadosBusca([]);
      setShowBusca(false);
    }
  }, [buscaServico]);

  function adicionarItem(servico: string) {
    setItens((prev) => [...prev, { servico, valor: "", observacao: "" }]);
    setBuscaServico("");
    setShowBusca(false);
  }

  function adicionarItemCustom() {
    if (buscaServico.trim()) {
      adicionarItem(buscaServico.trim());
    }
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarItem(
    index: number,
    field: keyof ItemServico,
    value: string
  ) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  const valorTotal = itens.reduce(
    (acc, item) => acc + (parseFloat(item.valor) || 0),
    0
  );

  function toggleProblema(index: number) {
    setChecklist((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, temProblema: !item.temProblema } : item
      )
    );
  }

  function updateDescricao(index: number, descricao: string) {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, descricao } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      veiculoId: formData.get("veiculoId"),
      tipo: formData.get("tipo"),
      descricao: formData.get("descricao"),
      dataEntrada: formData.get("dataEntrada"),
      previsaoSaida: formData.get("previsaoSaida") || null,
      custoEstimado: formData.get("custoEstimado") || null,
      observacoes: formData.get("observacoes") || null,
      checklist,
      itens: itens.map((item) => ({
        servico: item.servico,
        valor: parseFloat(item.valor) || 0,
        observacao: item.observacao || null,
      })),
    };

    const res = await fetch("/api/manutencoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/manutencoes");
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao criar manuten\u00e7\u00e3o");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Nova Manuten\u00e7\u00e3o
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Basic data */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Dados da Manuten\u00e7\u00e3o
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ve\u00edculo *
              </label>
              <select name="veiculoId" required className={inputClass}>
                <option value="">Selecione</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.modelo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <select name="tipo" required className={inputClass}>
                <option value="">Selecione</option>
                <option value="preventiva">Preventiva</option>
                <option value="corretiva">Corretiva</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descri\u00e7\u00e3o *
            </label>
            <textarea
              name="descricao"
              required
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Entrada *
              </label>
              <input
                name="dataEntrada"
                type="datetime-local"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previs\u00e3o Sa\u00edda
              </label>
              <input
                name="previsaoSaida"
                type="datetime-local"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo Estimado (R$)
              </label>
              <input
                name="custoEstimado"
                type="number"
                step="0.01"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observa\u00e7\u00f5es
            </label>
            <textarea name="observacoes" rows={2} className={inputClass} />
          </div>
        </div>

        {/* Service Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Itens de Servi\u00e7o
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Pesquise e adicione os servi\u00e7os realizados nesta manuten\u00e7\u00e3o.
          </p>

          {/* Service search */}
          <div className="relative mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={buscaServico}
                onChange={(e) => setBuscaServico(e.target.value)}
                placeholder="Pesquisar servi\u00e7o (ex: troca de \u00f3leo, farol, pastilha...)"
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={adicionarItemCustom}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
              >
                + Customizado
              </button>
            </div>

            {showBusca && resultadosBusca.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-auto">
                {resultadosBusca.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => adicionarItem(r.servico)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-900">
                      {r.servico}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {r.categoria}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Added items list */}
          {itens.length > 0 && (
            <div className="space-y-3">
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {item.servico}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Valor (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) =>
                          atualizarItem(index, "valor", e.target.value)
                        }
                        placeholder="0,00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Observa\u00e7\u00e3o
                      </label>
                      <input
                        type="text"
                        value={item.observacao}
                        onChange={(e) =>
                          atualizarItem(index, "observacao", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <p className="text-lg font-bold text-gray-900">
                  Total: R${" "}
                  {valorTotal.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          )}

          {itens.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              Nenhum item adicionado. Use a busca acima.
            </p>
          )}
        </div>

        {/* Problem Checklist */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Checklist de Problemas
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Marque os itens que apresentam problema.
          </p>
          <div className="space-y-3">
            {CATEGORIAS_CHECKLIST.map((cat, index) => (
              <div
                key={cat.value}
                className={`border rounded-lg p-4 transition-colors ${
                  checklist[index].temProblema
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checklist[index].temProblema}
                    onChange={() => toggleProblema(index)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span
                    className={`font-medium ${
                      checklist[index].temProblema
                        ? "text-red-700"
                        : "text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </span>
                </div>
                {checklist[index].temProblema && (
                  <div className="mt-3 ml-8">
                    <input
                      type="text"
                      placeholder="Descreva o problema..."
                      value={checklist[index].descricao}
                      onChange={(e) => updateDescricao(index, e.target.value)}
                      className="w-full border border-red-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando..." : "Registrar Manuten\u00e7\u00e3o"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/manutencoes")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
