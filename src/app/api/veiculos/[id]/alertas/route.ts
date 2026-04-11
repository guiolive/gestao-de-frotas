import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

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
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

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

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "alerta_km",
    recursoId: alerta.id,
    dados: alerta,
  });

  return Response.json(alerta, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const alertaId = searchParams.get("alertaId");

  if (!alertaId) {
    return Response.json({ error: "alertaId é obrigatório" }, { status: 400 });
  }

  // WHERE com parent + child previne IDOR. Usa deleteMany porque o filtro
  // composto não é único pra `delete()`.
  const deleted = await prisma.alertaKm.deleteMany({
    where: { id: alertaId, veiculoId: id },
  });

  if (deleted.count === 0) {
    return Response.json(
      { error: "Alerta não encontrado para este veículo." },
      { status: 404 }
    );
  }

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "alerta_km",
    recursoId: alertaId,
    dados: { veiculoId: id },
  });

  return Response.json({ ok: true });
}
