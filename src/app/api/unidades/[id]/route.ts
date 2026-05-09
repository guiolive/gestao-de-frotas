import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;

  const unidade = await prisma.unidade.findUnique({
    where: { id },
    include: {
      _count: { select: { viagens: true } },
    },
  });

  if (!unidade) {
    return Response.json({ error: "Unidade não encontrada" }, { status: 404 });
  }

  return Response.json(unidade);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;
  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (body.sigla !== undefined) {
    const sigla = (body.sigla as string).trim().toUpperCase();
    const existente = await prisma.unidade.findUnique({ where: { sigla } });
    if (existente && existente.id !== id) {
      return Response.json(
        { error: "Já existe uma unidade com essa sigla" },
        { status: 409 }
      );
    }
    data.sigla = sigla;
  }

  if (body.nome !== undefined) {
    data.nome = (body.nome as string).trim();
  }

  if (body.ativo !== undefined) {
    data.ativo = body.ativo === true || body.ativo === "true";
  }

  const unidade = await prisma.unidade.update({
    where: { id },
    data,
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "unidade",
    recursoId: id,
    dados: unidade,
  });

  return Response.json(unidade);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

  // Soft delete: ativo=false. Mantém viagens históricas vinculadas (não
  // precisa mais bloquear quando há viagens — o registro continua existindo).
  // Idempotente: se já está inativa, retorna ok sem audit duplicado.
  const snapshot = await prisma.unidade.findUnique({ where: { id } });
  if (!snapshot) {
    return Response.json({ error: "Unidade não encontrada" }, { status: 404 });
  }
  if (!snapshot.ativo) {
    return Response.json({ ok: true, alreadyInactive: true });
  }

  await prisma.unidade.update({
    where: { id },
    data: { ativo: false },
  });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "unidade",
    recursoId: id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
