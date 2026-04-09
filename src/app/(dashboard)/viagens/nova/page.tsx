"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  status: string;
}
interface Motorista {
  id: string;
  nome: string;
  status: string;
}
interface Unidade {
  id: string;
  sigla: string;
  nome: string;
  ativo: boolean;
}

const UF_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export default function NovaViagemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [showPcdp1, setShowPcdp1] = useState(false);
  const [showPcdp2, setShowPcdp2] = useState(false);

  useEffect(() => {
    fetch("/api/veiculos").then((r) => r.json()).then(setVeiculos);
    fetch("/api/motoristas").then((r) => r.json()).then(setMotoristas);
    fetch("/api/unidades").then((r) => r.json()).then(setUnidades);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (value !== "") {
        data[key] = value;
      }
    }

    const res = await fetch("/api/viagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/viagens");
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao criar viagem");
      setLoading(false);
    }
  }

  const veiculosDisponiveis = veiculos.filter((v) => v.status === "disponivel");
  const motoristasAtivos = motoristas.filter((m) => m.status === "ativo");
  const unidadesAtivas = unidades.filter((u) => u.ativo);

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Viagem</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Dados da Viagem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ve\u00edculo *
              </label>
              <select name="veiculoId" required className={inputClass}>
                <option value="">Selecione</option>
                {veiculosDisponiveis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.modelo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motorista *
              </label>
              <select name="motoristaId" required className={inputClass}>
                <option value="">Selecione</option>
                {motoristasAtivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motorista 2
              </label>
              <select name="motorista2Id" className={inputClass}>
                <option value="">Nenhum</option>
                {motoristasAtivos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino *
              </label>
              <input name="destino" required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origem *
              </label>
              <input
                name="origem"
                required
                defaultValue="Goiania, GO"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Sa\u00edda *
              </label>
              <input
                name="dataSaida"
                type="datetime-local"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM Inicial *
              </label>
              <input
                name="kmInicial"
                type="number"
                step="0.1"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade
              </label>
              <select name="unidadeId" className={inputClass}>
                <option value="">Selecione</option>
                {unidadesAtivas.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.sigla} - {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF Destino
              </label>
              <select name="ufDestino" className={inputClass}>
                <option value="">Selecione</option>
                {UF_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processo SEI
              </label>
              <input name="processoSei" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solicitante
              </label>
              <input name="solicitante" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Di\u00e1ria (R$)
              </label>
              <input
                name="diaria"
                type="number"
                step="0.01"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KM por Trecho
              </label>
              <input
                name="kmPorTrecho"
                type="number"
                step="0.1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qtd Di\u00e1rias
              </label>
              <input
                name="qtdDiarias"
                type="number"
                step="0.5"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* PCDP Motorista 1 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPcdp1(!showPcdp1)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              PCDP Motorista 1
            </h2>
            <span className="text-gray-500">{showPcdp1 ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showPcdp1 && (
            <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N\u00famero
                </label>
                <input name="pcdpNumero" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input name="pcdpData" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  name="pcdpValor"
                  type="number"
                  step="0.01"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* PCDP Motorista 2 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPcdp2(!showPcdp2)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              PCDP Motorista 2
            </h2>
            <span className="text-gray-500">{showPcdp2 ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showPcdp2 && (
            <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solicitante
                </label>
                <input name="pcdp2Solicitante" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  N\u00famero
                </label>
                <input name="pcdp2Numero" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input name="pcdp2Data" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$)
                </label>
                <input
                  name="pcdp2Valor"
                  type="number"
                  step="0.01"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Observacoes */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observa\u00e7\u00f5es
          </label>
          <textarea name="observacoes" rows={3} className={inputClass} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/viagens")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
