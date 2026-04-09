import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  return Response.json(agendamento);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.agendamento.delete({ where: { id } });
  return Response.json({ ok: true });
}
