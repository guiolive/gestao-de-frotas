import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

function formatCnpj(cnpj: string) {
  if (cnpj.length !== 14) return cnpj;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

function whatsappLink(whatsapp: string | null) {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}`;
}

export default async function OficinaDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const oficina = await prisma.oficina.findUnique({
    where: { id: params.id },
    include: { _count: { select: { manutencoes: true } } },
  });

  if (!oficina) {
    return <div className="text-center py-12 text-gray-500">Oficina não encontrada.</div>;
  }

  const waLink = whatsappLink(oficina.whatsapp);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{oficina.nome}</h1>
        <Link
          href={`/oficinas/${oficina.id}/editar`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Editar
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">CNPJ</p>
            <p className="text-lg font-medium text-gray-900">{formatCnpj(oficina.cnpj)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <StatusBadge status={oficina.ativa ? "ativo" : "inativo"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">WhatsApp</p>
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-blue-600 hover:text-blue-800"
              >
                {oficina.whatsapp}
              </a>
            ) : (
              <p className="text-lg font-medium text-gray-400">—</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Manutenções vinculadas</p>
            <p className="text-lg font-medium text-gray-900">{oficina._count.manutencoes}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Endereço</p>
          <p className="text-lg font-medium text-gray-900">{oficina.enderecoTexto || "—"}</p>
        </div>

        {oficina.googleMapsUrl && (
          <div>
            <p className="text-sm text-gray-500">Localização</p>
            <a
              href={oficina.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Abrir no Google Maps ↗
            </a>
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link href="/oficinas" className="text-blue-600 hover:text-blue-800 font-medium">
          Voltar para lista
        </Link>
      </div>
    </div>
  );
}
