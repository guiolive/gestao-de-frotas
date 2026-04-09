import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ativo = searchParams.get("ativo");

  const where = ativo !== null ? { ativo: ativo === "true" } : undefined;

  const unidades = await prisma.unidade.findMany({
    where,
    orderBy: { sigla: "asc" },
    include: {
      _count: { select: { viagens: true } },
    },
  });

  return Response.json(unidades);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const sigla = (body.sigla as string).trim().toUpperCase();
  const nome = (body.nome as string).trim();

  if (!sigla || !nome) {
    return Response.json(
      { error: "Sigla e nome são obrigatórios" },
      { status: 400 }
    );
  }

  const existente = await prisma.unidade.findUnique({ where: { sigla } });
  if (existente) {
    return Response.json(
      { error: "Já existe uma unidade com essa sigla" },
      { status: 409 }
    );
  }

  const unidade = await prisma.unidade.create({
    data: { sigla, nome },
  });

  return Response.json(unidade, { status: 201 });
}
