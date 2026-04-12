import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const veiculoId = searchParams.get("veiculoId");
  const motoristaId = searchParams.get("motoristaId");
  const unidadeId = searchParams.get("unidadeId");
  const ufDestino = searchParams.get("ufDestino");
  const q = searchParams.get("q");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (veiculoId) where.veiculoId = veiculoId;
  if (motoristaId) where.motoristaId = motoristaId;
  if (unidadeId) where.unidadeId = unidadeId;
  if (ufDestino) where.ufDestino = ufDestino;

  // Date range filter on dataSaida
  if (dataInicio || dataFim) {
    where.dataSaida = {};
    if (dataInicio) where.dataSaida.gte = new Date(dataInicio);
    if (dataFim) where.dataSaida.lte = new Date(dataFim + "T23:59:59.999Z");
  }

  // Free-text search across destino, origem, solicitante, processoSei
  if (q) {
    where.OR = [
      { destino: { contains: q } },
      { origem: { contains: q } },
      { solicitante: { contains: q } },
      { processoSei: { contains: q } },
    ];
  }

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

  // Check for conflicting trips (same vehicle, overlapping dates, not cancelled)
  const dataSaida = new Date(body.dataSaida);
  const conflictingTrip = await prisma.viagem.findFirst({
    where: {
      veiculoId: body.veiculoId,
      status: { not: "cancelada" },
      dataSaida: { lte: body.dataRetorno ? new Date(body.dataRetorno) : dataSaida },
      OR: [
        { dataRetorno: null, status: { in: ["agendada", "em_andamento"] } },
        { dataRetorno: { gte: dataSaida } },
      ],
    },
    include: { motorista: { select: { nome: true } } },
  });

  if (conflictingTrip) {
    return Response.json(
      {
        error: `Veículo já possui viagem ${conflictingTrip.status === "em_andamento" ? "em andamento" : "agendada"} para ${conflictingTrip.destino} (motorista: ${conflictingTrip.motorista.nome})`,
      },
      { status: 409 }
    );
  }

  // Check for conflicting maintenance
  const conflictingMaintenance = await prisma.manutencao.findFirst({
    where: {
      veiculoId: body.veiculoId,
      status: { in: ["aguardando", "em_andamento"] },
      dataEntrada: { lte: body.dataRetorno ? new Date(body.dataRetorno) : dataSaida },
      OR: [
        { previsaoSaida: null },
        { previsaoSaida: { gte: dataSaida } },
      ],
    },
  });

  if (conflictingMaintenance) {
    return Response.json(
      { error: "Veículo possui manutenção agendada ou em andamento no período" },
      { status: 409 }
    );
  }

  // PCDP obrigatório quando há diárias
  if (body.diaria && body.qtdDiarias && !body.pcdpNumero) {
    return Response.json(
      { error: "PCDP Motorista 1 é obrigatório quando há diárias" },
      { status: 400 }
    );
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
      totalDiarias: (() => {
        const d = body.diaria ? Number(body.diaria) : null;
        const q = body.qtdDiarias ? Number(body.qtdDiarias) : null;
        return d && q ? d * q : (body.totalDiarias ? Number(body.totalDiarias) : null);
      })(),
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
