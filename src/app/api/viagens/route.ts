import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const veiculoId = searchParams.get("veiculoId");
  const motoristaId = searchParams.get("motoristaId");

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (veiculoId) where.veiculoId = veiculoId;
  if (motoristaId) where.motoristaId = motoristaId;

  const viagens = await prisma.viagem.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
    },
  });

  return Response.json(viagens);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const body = await request.json();

  // Validate required fields
  const required = ["veiculoId", "motoristaId", "origem", "destino", "dataSaida", "kmInicial"];
  for (const field of required) {
    if (!body[field]) {
      return Response.json(
        { error: `Campo obrigatório: ${field}` },
        { status: 400 }
      );
    }
  }

  // Validate vehicle is available
  const veiculo = await prisma.veiculo.findUnique({
    where: { id: body.veiculoId },
  });

  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  if (veiculo.status === "manutencao" || veiculo.status === "inativo") {
    return Response.json(
      { error: `Veículo não disponível (status: ${veiculo.status})` },
      { status: 400 }
    );
  }

  const viagem = await prisma.viagem.create({
    data: {
      veiculoId: body.veiculoId,
      motoristaId: body.motoristaId,
      motorista2Id: body.motorista2Id || null,
      origem: body.origem,
      destino: body.destino,
      dataSaida: new Date(body.dataSaida),
      kmInicial: Number(body.kmInicial),
      observacoes: body.observacoes || null,
      processoSei: body.processoSei || null,
      unidadeId: body.unidadeId || null,
      ufDestino: body.ufDestino || null,
      diaria: body.diaria ? Number(body.diaria) : null,
      solicitante: body.solicitante || null,
      kmPorTrecho: body.kmPorTrecho ? Number(body.kmPorTrecho) : null,
      qtdDiarias: body.qtdDiarias ? Number(body.qtdDiarias) : null,
      pcdpNumero: body.pcdpNumero || null,
      pcdpData: body.pcdpData || null,
      pcdpValor: body.pcdpValor ? Number(body.pcdpValor) : null,
      pcdp2Solicitante: body.pcdp2Solicitante || null,
      pcdp2Numero: body.pcdp2Numero || null,
      pcdp2Data: body.pcdp2Data || null,
      pcdp2Valor: body.pcdp2Valor ? Number(body.pcdp2Valor) : null,
      totalDiarias: body.totalDiarias ? Number(body.totalDiarias) : null,
    },
  });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "viagem",
    recursoId: viagem.id,
    dados: viagem,
  });

  return Response.json(viagem, { status: 201 });
}
