import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtCPF(c: string) {
  const d = c.replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : c;
}

function fmtTel(t: string) {
  const d = t.replace(/\D/g, "");
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : t;
}

export default async function VisualizarMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const motorista = await prisma.motorista.findUnique({
    where: { id },
    include: {
      viagens: {
        include: { veiculo: true },
        orderBy: { dataSaida: "desc" },
        take: 10,
      },
      viagensComoM2: {
        include: { veiculo: true },
        orderBy: { dataSaida: "desc" },
        take: 10,
      },
    },
  });

  if (!motorista) return notFound();

  const todasViagens = [...motorista.viagens, ...motorista.viagensComoM2]
    .sort((a, b) => new Date(b.dataSaida).getTime() - new Date(a.dataSaida).getTime())
    .slice(0, 10);

  const totalViagens = motorista.viagens.length + motorista.viagensComoM2.length;

  const kmTotal = [...motorista.viagens, ...motorista.viagensComoM2].reduce((acc, v) => {
    if (v.kmFinal && v.kmInicial) return acc + (v.kmFinal - v.kmInicial);
    return acc;
  }, 0);

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{motorista.nome}</h1>
          <p className="text-gray-500 mt-1">CNH: {motorista.cnh} | Categoria: {motorista.categoriaCnh}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/motoristas/${id}/editar`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Editar
          </Link>
          <Link href="/motoristas" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Voltar
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Status</p>
          <div className="mt-1"><StatusBadge status={motorista.status} /></div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total de Viagens</p>
          <p className="text-xl font-bold text-gray-900">{totalViagens}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">KM Total Percorrido</p>
          <p className="text-xl font-bold text-gray-900">{kmTotal.toLocaleString("pt-BR")} km</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dados Pessoais</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">CPF</span>
              <p className="font-medium text-gray-900 mt-1">{fmtCPF(motorista.cpf)}</p>
            </div>
            <div>
              <span className="text-gray-500">Telefone</span>
              <p className="font-medium text-gray-900 mt-1">{fmtTel(motorista.telefone)}</p>
            </div>
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-gray-900 mt-1">{motorista.email}</p>
            </div>
            <div>
              <span className="text-gray-500">Data Cadastro</span>
              <p className="font-medium text-gray-900 mt-1">{new Date(motorista.criadoEm).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </div>

        {/* Recent trips */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Ultimas Viagens</h2>
            <Link href="/viagens" className="text-sm text-blue-600 hover:text-blue-800">Ver todas</Link>
          </div>
          {todasViagens.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma viagem registrada.</p>
          ) : (
            <div className="space-y-3">
              {todasViagens.map((v) => (
                <Link key={v.id} href={`/viagens/${v.id}`} className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{v.origem} → {v.destino}</p>
                      <p className="text-sm text-gray-500 mt-1">{v.veiculo.placa} | {new Date(v.dataSaida).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      {v.kmFinal && v.kmInicial && (
                        <p className="text-sm font-medium text-gray-700">{(v.kmFinal - v.kmInicial).toLocaleString("pt-BR")} km</p>
                      )}
                      <div className="mt-1"><StatusBadge status={v.status} /></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
