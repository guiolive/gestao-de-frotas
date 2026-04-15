import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const count = await prisma.viagem.count({ where: { unidadeId: id } });
  if (count > 0) {
    return Response.json(
      { error: "Unidade possui viagens vinculadas" },
      { status: 400 }
    );
  }

  const snapshot = await prisma.unidade.findUnique({ where: { id } });
  await prisma.unidade.delete({ where: { id } });

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
