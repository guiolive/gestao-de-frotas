import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const viagem = await prisma.viagem.findUnique({
    where: { id },
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
    },
  });

  if (!viagem) {
    return Response.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  return Response.json(viagem);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;
  const body = await request.json();

  // Fetch current viagem to check business rules
  const current = await prisma.viagem.findUnique({
    where: { id },
    include: { veiculo: true },
  });

  if (!current) {
    return Response.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  // Build update data
  const data: Record<string, unknown> = {};

  if (body.veiculoId !== undefined) data.veiculoId = body.veiculoId;
  if (body.motoristaId !== undefined) data.motoristaId = body.motoristaId;
  if (body.motorista2Id !== undefined) data.motorista2Id = body.motorista2Id || null;
  if (body.origem !== undefined) data.origem = body.origem;
  if (body.destino !== undefined) data.destino = body.destino;
  if (body.dataSaida !== undefined) data.dataSaida = new Date(body.dataSaida);
  if (body.dataRetorno !== undefined) data.dataRetorno = body.dataRetorno ? new Date(body.dataRetorno) : null;
  if (body.kmInicial !== undefined) data.kmInicial = Number(body.kmInicial);
  if (body.kmFinal !== undefined) data.kmFinal = body.kmFinal ? Number(body.kmFinal) : null;
  if (body.status !== undefined) data.status = body.status;
  if (body.observacoes !== undefined) data.observacoes = body.observacoes || null;
  if (body.processoSei !== undefined) data.processoSei = body.processoSei || null;
  if (body.unidadeId !== undefined) data.unidadeId = body.unidadeId || null;
  if (body.ufDestino !== undefined) data.ufDestino = body.ufDestino || null;
  if (body.diaria !== undefined) data.diaria = body.diaria ? Number(body.diaria) : null;
  if (body.solicitante !== undefined) data.solicitante = body.solicitante || null;
  if (body.kmPorTrecho !== undefined) data.kmPorTrecho = body.kmPorTrecho ? Number(body.kmPorTrecho) : null;
  if (body.qtdDiarias !== undefined) data.qtdDiarias = body.qtdDiarias ? Number(body.qtdDiarias) : null;
  if (body.pcdpNumero !== undefined) data.pcdpNumero = body.pcdpNumero || null;
  if (body.pcdpData !== undefined) data.pcdpData = body.pcdpData || null;
  if (body.pcdpValor !== undefined) data.pcdpValor = body.pcdpValor ? Number(body.pcdpValor) : null;
  if (body.pcdp2Solicitante !== undefined) data.pcdp2Solicitante = body.pcdp2Solicitante || null;
  if (body.pcdp2Numero !== undefined) data.pcdp2Numero = body.pcdp2Numero || null;
  if (body.pcdp2Data !== undefined) data.pcdp2Data = body.pcdp2Data || null;
  if (body.pcdp2Valor !== undefined) data.pcdp2Valor = body.pcdp2Valor ? Number(body.pcdp2Valor) : null;
  if (body.totalDiarias !== undefined) data.totalDiarias = body.totalDiarias ? Number(body.totalDiarias) : null;

  // Business rules based on status change
  if (body.status === "em_andamento") {
    // Set vehicle to em_uso
    await prisma.veiculo.update({
      where: { id: current.veiculoId },
      data: { status: "em_uso" },
    });
  }

  if (body.status === "concluida") {
    const kmFinal = body.kmFinal ? Number(body.kmFinal) : current.kmFinal;
    if (kmFinal) {
      // Update vehicle quilometragem and set to disponivel
      await prisma.veiculo.update({
        where: { id: current.veiculoId },
        data: {
          quilometragem: kmFinal,
          status: "disponivel",
        },
      });
    } else {
      await prisma.veiculo.update({
        where: { id: current.veiculoId },
        data: { status: "disponivel" },
      });
    }
    // Set dataRetorno to now if not provided
    if (!body.dataRetorno && !current.dataRetorno) {
      data.dataRetorno = new Date();
    }
  }

  if (body.status === "cancelada" && current.veiculo.status === "em_uso") {
    await prisma.veiculo.update({
      where: { id: current.veiculoId },
      data: { status: "disponivel" },
    });
  }

  const viagem = await prisma.viagem.update({
    where: { id },
    data,
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
    },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "viagem",
    recursoId: id,
    dados: { status: body.status, ...data },
  });

  return Response.json(viagem);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

  const viagem = await prisma.viagem.findUnique({ where: { id } });
  if (!viagem) {
    return Response.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  if (viagem.status === "em_andamento") {
    return Response.json(
      { error: "Não é possível excluir uma viagem em andamento" },
      { status: 400 }
    );
  }

  await prisma.viagem.delete({ where: { id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "viagem",
    recursoId: id,
    dados: viagem,
  });

  return Response.json({ ok: true });
}
