import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, unidadeCreateSchema } from "@/lib/validation";

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
  const [data, err] = await validateBody(request, unidadeCreateSchema);
  if (err) return err;

  const existente = await prisma.unidade.findUnique({
    where: { sigla: data.sigla },
  });
  if (existente) {
    return Response.json(
      { error: "Já existe uma unidade com essa sigla" },
      { status: 409 }
    );
  }

  const unidade = await prisma.unidade.create({ data });
  return Response.json(unidade, { status: 201 });
}
