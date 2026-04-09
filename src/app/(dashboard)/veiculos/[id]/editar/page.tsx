"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  cor: string;
  quilometragem: number;
  tipo: string;
  status: string;
}

interface Imagem {
  id: string;
  url: string;
  descricao: string | null;
}

interface Alerta {
  id: string;
  tipo: string;
  intervaloKm: number;
  ultimaTrocaKm: number;
  alertaAntesDe: number;
  emailGestor: string;
}

const TIPOS_ALERTA = [
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "troca_pneus", label: "Troca de Pneus" },
  { value: "revisao", label: "Revisão Geral" },
  { value: "alinhamento", label: "Alinhamento e Balanceamento" },
  { value: "filtro_ar", label: "Filtro de Ar" },
  { value: "filtro_combustivel", label: "Filtro de Combustível" },
  { value: "correia_dentada", label: "Correia Dentada" },
  { value: "fluido_freio", label: "Fluido de Freio" },
  { value: "fluido_arrefecimento", label: "Fluido de Arrefecimento" },
];

export default function EditarVeiculoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"dados" | "fotos" | "alertas">("dados");

  const [novoAlerta, setNovoAlerta] = useState({
    tipo: "troca_oleo",
    intervaloKm: "10000",
    ultimaTrocaKm: "0",
    alertaAntesDe: "1000",
    emailGestor: "",
  });

  useEffect(() => {
    fetch(`/api/veiculos/${params.id}`).then((r) => r.json()).then(setVeiculo);
    fetch(`/api/veiculos/${params.id}/imagens`).then((r) => r.json()).then(setImagens);
    fetch(`/api/veiculos/${params.id}/alertas`).then((r) => r.json()).then(setAlertas);
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    await fetch(`/api/veiculos/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.push(`/veiculos/${params.id}`);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;
    await fetch(`/api/veiculos/${params.id}`, { method: "DELETE" });
    router.push("/veiculos");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/veiculos/${params.id}/imagens`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const img = await res.json();
      setImagens((prev) => [img, ...prev]);
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDeleteImagem(imagemId: string) {
    if (!confirm("Excluir esta imagem?")) return;
    await fetch(`/api/veiculos/${params.id}/imagens?imagemId=${imagemId}`, {
      method: "DELETE",
    });
    setImagens((prev) => prev.filter((i) => i.id !== imagemId));
  }

  async function handleAddAlerta(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/veiculos/${params.id}/alertas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoAlerta),
    });
    if (res.ok) {
      const alerta = await res.json();
      setAlertas((prev) => [alerta, ...prev]);
      setNovoAlerta({ ...novoAlerta, tipo: "troca_oleo", intervaloKm: "10000", ultimaTrocaKm: "0", alertaAntesDe: "1000" });
    }
  }

  async function handleDeleteAlerta(alertaId: string) {
    if (!confirm("Excluir este alerta?")) return;
    await fetch(`/api/veiculos/${params.id}/alertas?alertaId=${alertaId}`, {
      method: "DELETE",
    });
    setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
  }

  if (!veiculo) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Editar Veículo - {veiculo.placa} ({veiculo.marca} {veiculo.modelo})
      </h1>

      <div className="flex gap-1 mb-6 border-b">
        {(["dados", "fotos", "alertas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "dados" ? "Dados" : t === "fotos" ? `Fotos (${imagens.length}/5)` : `Alertas KM (${alertas.length})`}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa *</label>
              <input name="placa" required defaultValue={veiculo.placa} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <select name="tipo" required defaultValue={veiculo.tipo} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="carro">Carro</option>
                <option value="van">Van</option>
                <option value="caminhao">Caminhão</option>
                <option value="onibus">Ônibus</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
              <input name="marca" required defaultValue={veiculo.marca} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
              <input name="modelo" required defaultValue={veiculo.modelo} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
              <input name="ano" type="number" required defaultValue={veiculo.ano} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor *</label>
              <input name="cor" required defaultValue={veiculo.cor} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quilometragem</label>
              <input name="quilometragem" type="number" defaultValue={veiculo.quilometragem} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue={veiculo.status} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="disponivel">Disponível</option>
              <option value="em_uso">Em Uso</option>
              <option value="em_manutencao">Em Manutenção</option>
              <option value="indisponivel">Indisponível</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={() => router.push(`/veiculos/${params.id}`)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleDelete} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors ml-auto">
              Excluir
            </button>
          </div>
        </form>
      )}

      {tab === "fotos" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Fotos do Veículo</h2>
            {imagens.length < 5 && (
              <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                {uploading ? "Enviando..." : "+ Adicionar Foto"}
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            )}
          </div>
          {imagens.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-500">
              <p className="text-lg mb-2">Nenhuma foto cadastrada</p>
              <p className="text-sm">Adicione até 5 fotos do veículo</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagens.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt={img.descricao || "Foto do veículo"} className="w-full h-48 object-cover rounded-lg border" />
                  <button onClick={() => handleDeleteImagem(img.id)} className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm">
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "alertas" && (
        <div className="space-y-6">
          <form onSubmit={handleAddAlerta} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Novo Alerta de Manutenção</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Manutenção *</label>
                <select value={novoAlerta.tipo} onChange={(e) => setNovoAlerta({ ...novoAlerta, tipo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {TIPOS_ALERTA.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (KM) *</label>
                <input type="number" required value={novoAlerta.intervaloKm} onChange={(e) => setNovoAlerta({ ...novoAlerta, intervaloKm: e.target.value })} placeholder="10000" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KM da Última Troca</label>
                <input type="number" value={novoAlerta.ultimaTrocaKm} onChange={(e) => setNovoAlerta({ ...novoAlerta, ultimaTrocaKm: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alertar X km antes</label>
                <input type="number" value={novoAlerta.alertaAntesDe} onChange={(e) => setNovoAlerta({ ...novoAlerta, alertaAntesDe: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email do Gestor *</label>
                <input type="email" required value={novoAlerta.emailGestor} onChange={(e) => setNovoAlerta({ ...novoAlerta, emailGestor: e.target.value })} placeholder="gestor@empresa.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <button type="submit" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Adicionar Alerta
            </button>
          </form>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Alertas Configurados</h2>
            {alertas.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum alerta configurado para este veículo.</p>
            ) : (
              <div className="space-y-3">
                {alertas.map((a) => {
                  const tipoLabel = TIPOS_ALERTA.find((t) => t.value === a.tipo)?.label || a.tipo;
                  const kmProxima = a.ultimaTrocaKm + a.intervaloKm;
                  const kmRestante = kmProxima - (veiculo?.quilometragem || 0);
                  const urgente = kmRestante <= a.alertaAntesDe;
                  return (
                    <div key={a.id} className={`flex items-center justify-between p-4 rounded-lg border ${urgente ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                      <div>
                        <p className="font-medium text-gray-900">{tipoLabel}</p>
                        <p className="text-sm text-gray-500">
                          A cada {a.intervaloKm.toLocaleString("pt-BR")} km | Próxima: {kmProxima.toLocaleString("pt-BR")} km
                          {urgente && <span className="text-red-600 font-medium ml-2">ATENÇÃO: Faltam {Math.max(0, kmRestante).toLocaleString("pt-BR")} km</span>}
                        </p>
                        <p className="text-xs text-gray-400">Alertar para: {a.emailGestor}</p>
                      </div>
                      <button onClick={() => handleDeleteAlerta(a.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remover</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
