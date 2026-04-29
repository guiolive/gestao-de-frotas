import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, bateriaUpdateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; bid: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const existente = await prisma.bateria.findFirst({
    where: { id: params.bid, veiculoId: params.id },
  });
  if (!existente) {
    return Response.json({ error: "Bateria não encontrada" }, { status: 404 });
  }

  const [data, err] = await validateBody(request, bateriaUpdateSchema);
  if (err) return err;

  const atualizada = await prisma.bateria.update({
    where: { id: params.bid },
    data,
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "bateria",
    recursoId: params.bid,
    dados: atualizada,
  });

  return Response.json(atualizada);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bid: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const snapshot = await prisma.bateria.findFirst({
    where: { id: params.bid, veiculoId: params.id },
  });
  if (!snapshot) {
    return Response.json({ error: "Bateria não encontrada" }, { status: 404 });
  }

  await prisma.bateria.delete({ where: { id: params.bid } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "bateria",
    recursoId: params.bid,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
