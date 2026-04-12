"use client";

import { useRouter, useParams } from "next/navigation";
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
interface Viagem {
  id: string;
  veiculoId: string;
  motoristaId: string;
  motorista2Id: string | null;
  origem: string;
  destino: string;
  dataSaida: string;
  dataRetorno: string | null;
  kmInicial: number;
  kmFinal: number | null;
  status: string;
  observacoes: string | null;
  processoSei: string | null;
  unidadeId: string | null;
  ufDestino: string | null;
  diaria: number | null;
  solicitante: string | null;
  kmPorTrecho: number | null;
  qtdDiarias: number | null;
  pcdpNumero: string | null;
  pcdpData: string | null;
  pcdpValor: number | null;
  pcdp2Solicitante: string | null;
  pcdp2Numero: string | null;
  pcdp2Data: string | null;
  pcdp2Valor: number | null;
  totalDiarias: number | null;
  veiculo: { placa: string; modelo: string };
  motorista: { nome: string };
  motorista2: { nome: string } | null;
}

const UF_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function formatDatetimeLocal(d: string | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 16);
}

export default function EditarViagemPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [viagem, setViagem] = useState<Viagem | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [showPcdp1, setShowPcdp1] = useState(false);
  const [showPcdp2, setShowPcdp2] = useState(false);

  // Auto-calc totalDiarias
  const [diaria, setDiaria] = useState<number | null>(null);
  const [qtdDiarias, setQtdDiarias] = useState<number | null>(null);
  const totalDiarias = diaria && qtdDiarias ? diaria * qtdDiarias : null;

  useEffect(() => {
    fetch(`/api/viagens/${params.id}`).then((r) => r.json()).then((data) => {
      setViagem(data);
      setDiaria(data.diaria);
      setQtdDiarias(data.qtdDiarias);
      if (data.pcdpNumero || data.pcdpData || data.pcdpValor) setShowPcdp1(true);
      if (data.pcdp2Numero || data.pcdp2Data || data.pcdp2Valor) setShowPcdp2(true);
    });
    fetch("/api/veiculos").then((r) => r.json()).then(setVeiculos);
    fetch("/api/motoristas").then((r) => r.json()).then(setMotoristas);
    fetch("/api/unidades").then((r) => r.json()).then(setUnidades);
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value === "" ? null : value;
    }

    // Auto-calc
    if (totalDiarias !== null) {
      data.totalDiarias = totalDiarias;
    }

    // PCDP validation: if diárias exist, PCDP número is required
    if (diaria && qtdDiarias && !data.pcdpNumero) {
      alert("PCDP Motorista 1 é obrigatório quando há diárias.");
      setShowPcdp1(true);
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/viagens/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push(`/viagens/${params.id}`);
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao atualizar viagem");
      setLoading(false);
    }
  }

  if (!viagem) return <div className="text-gray-500">Carregando...</div>;

  const motoristasAtivos = motoristas.filter((m) => m.status === "ativo");
  const unidadesAtivas = unidades.filter((u) => u.ativo);

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Editar Viagem &mdash; {viagem.veiculo.placa}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Basic info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Dados da Viagem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Veículo</label>
              <select name="veiculoId" defaultValue={viagem.veiculoId} className={inputClass}>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motorista</label>
              <select name="motoristaId" defaultValue={viagem.motoristaId} className={inputClass}>
                {motoristas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motorista 2</label>
              <select name="motorista2Id" defaultValue={viagem.motorista2Id || ""} className={inputClass}>
                <option value="">Nenhum</option>
                {motoristasAtivos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <input name="origem" defaultValue={viagem.origem} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
              <input name="destino" defaultValue={viagem.destino} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Saída</label>
              <input name="dataSaida" type="datetime-local" defaultValue={formatDatetimeLocal(viagem.dataSaida)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Retorno</label>
              <input name="dataRetorno" type="datetime-local" defaultValue={formatDatetimeLocal(viagem.dataRetorno)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select name="status" defaultValue={viagem.status} className={inputClass}>
                <option value="agendada">Agendada</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM Inicial</label>
              <input name="kmInicial" type="number" step="0.1" defaultValue={viagem.kmInicial} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM Final</label>
              <input name="kmFinal" type="number" step="0.1" defaultValue={viagem.kmFinal ?? ""} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select name="unidadeId" defaultValue={viagem.unidadeId || ""} className={inputClass}>
                <option value="">Selecione</option>
                {unidadesAtivas.map((u) => (
                  <option key={u.id} value={u.id}>{u.sigla} - {u.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF Destino</label>
              <select name="ufDestino" defaultValue={viagem.ufDestino || ""} className={inputClass}>
                <option value="">Selecione</option>
                {UF_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processo SEI</label>
              <input name="processoSei" defaultValue={viagem.processoSei || ""} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
              <input name="solicitante" defaultValue={viagem.solicitante || ""} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diária (R$)</label>
              <input
                name="diaria"
                type="number"
                step="0.01"
                defaultValue={viagem.diaria ?? ""}
                className={inputClass}
                onChange={(e) => setDiaria(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM por Trecho</label>
              <input name="kmPorTrecho" type="number" step="0.1" defaultValue={viagem.kmPorTrecho ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Diárias</label>
              <input
                name="qtdDiarias"
                type="number"
                step="0.5"
                defaultValue={viagem.qtdDiarias ?? ""}
                className={inputClass}
                onChange={(e) => setQtdDiarias(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>

          {/* Auto-calc total diárias */}
          {totalDiarias !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-blue-700">Total Diárias (calculado automaticamente)</span>
              <span className="text-lg font-semibold text-blue-900">
                R$ {totalDiarias.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
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
              {diaria && qtdDiarias && (
                <span className="ml-2 text-xs text-red-600 font-normal">(obrigatório com diárias)</span>
              )}
            </h2>
            <span className="text-gray-500">{showPcdp1 ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showPcdp1 && (
            <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número {diaria && qtdDiarias && <span className="text-red-500">*</span>}
                </label>
                <input name="pcdpNumero" defaultValue={viagem.pcdpNumero || ""} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input name="pcdpData" defaultValue={viagem.pcdpData || ""} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input name="pcdpValor" type="number" step="0.01" defaultValue={viagem.pcdpValor ?? ""} className={inputClass} />
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
            <h2 className="text-lg font-semibold text-gray-800">PCDP Motorista 2</h2>
            <span className="text-gray-500">{showPcdp2 ? "\u25B2" : "\u25BC"}</span>
          </button>
          {showPcdp2 && (
            <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                <input name="pcdp2Solicitante" defaultValue={viagem.pcdp2Solicitante || ""} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input name="pcdp2Numero" defaultValue={viagem.pcdp2Numero || ""} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input name="pcdp2Data" defaultValue={viagem.pcdp2Data || ""} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input name="pcdp2Valor" type="number" step="0.01" defaultValue={viagem.pcdp2Valor ?? ""} className={inputClass} />
              </div>
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea name="observacoes" rows={3} defaultValue={viagem.observacoes || ""} className={inputClass} />
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
            onClick={() => router.push(`/viagens/${params.id}`)}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
