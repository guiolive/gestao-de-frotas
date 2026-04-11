import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const agendamentos = await prisma.agendamento.findMany({
    orderBy: { dataInicio: "asc" },
    include: { veiculo: true },
  });
  return Response.json(agendamentos);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const body = await request.json();

  const dataInicio = new Date(body.dataInicio);
  const dataFim = new Date(body.dataFim);

  // Verificar conflito de horário
  const conflito = await prisma.agendamento.findFirst({
    where: {
      veiculoId: body.veiculoId,
      status: { not: "cancelado" },
      AND: [
        { dataInicio: { lt: dataFim } },
        { dataFim: { gt: dataInicio } },
      ],
    },
  });

  if (conflito) {
    return Response.json(
      { error: "Conflito de horário: este veículo já está agendado neste período." },
      { status: 409 }
    );
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      veiculoId: body.veiculoId,
      solicitante: body.solicitante,
      motivo: body.motivo,
      dataInicio,
      dataFim,
    },
  });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "agendamento",
    recursoId: agendamento.id,
    dados: agendamento,
  });

  return Response.json(agendamento, { status: 201 });
}
