import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  return Response.json(unidade);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const count = await prisma.viagem.count({ where: { unidadeId: id } });
  if (count > 0) {
    return Response.json(
      { error: "Unidade possui viagens vinculadas" },
      { status: 400 }
    );
  }

  await prisma.unidade.delete({ where: { id } });

  return Response.json({ ok: true });
}
