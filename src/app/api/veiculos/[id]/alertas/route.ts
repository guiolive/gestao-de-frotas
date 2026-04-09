import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const alertas = await prisma.alertaKm.findMany({
    where: { veiculoId: id },
    orderBy: { criadoEm: "desc" },
  });
  return Response.json(alertas);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const alerta = await prisma.alertaKm.create({
    data: {
      veiculoId: id,
      tipo: body.tipo,
      intervaloKm: Number(body.intervaloKm),
      ultimaTrocaKm: Number(body.ultimaTrocaKm) || 0,
      alertaAntesDe: Number(body.alertaAntesDe) || 1000,
      emailGestor: body.emailGestor,
    },
  });

  return Response.json(alerta, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const alertaId = searchParams.get("alertaId");

  if (!alertaId) {
    return Response.json({ error: "alertaId é obrigatório" }, { status: 400 });
  }

  await prisma.alertaKm.delete({
    where: { id: alertaId, veiculoId: id },
  });

  return Response.json({ ok: true });
}
