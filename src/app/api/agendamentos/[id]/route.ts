import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;
  const body = await request.json();

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: {
      status: body.status,
      solicitante: body.solicitante,
      motivo: body.motivo,
      dataInicio: body.dataInicio ? new Date(body.dataInicio) : undefined,
      dataFim: body.dataFim ? new Date(body.dataFim) : undefined,
    },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "agendamento",
    recursoId: id,
    dados: agendamento,
  });

  return Response.json(agendamento);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;
  const snapshot = await prisma.agendamento.findUnique({ where: { id } });
  await prisma.agendamento.delete({ where: { id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "agendamento",
    recursoId: id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
