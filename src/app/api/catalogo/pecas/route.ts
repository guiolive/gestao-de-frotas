import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, pecaCreateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ativo = searchParams.get("ativo");
  const q = searchParams.get("q")?.trim();

  const where: {
    ativo?: boolean;
    OR?: object[];
  } = {};
  if (ativo !== null) where.ativo = ativo === "true";
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { codigo: { contains: q, mode: "insensitive" } },
    ];
  }

  const pecas = await prisma.peca.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  return Response.json(pecas);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, pecaCreateSchema);
  if (err) return err;

  const existente = await prisma.peca.findUnique({ where: { nome: data.nome } });
  if (existente) {
    return Response.json(
      { error: "Já existe uma peça com esse nome." },
      { status: 409 }
    );
  }

  const peca = await prisma.peca.create({ data });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "peca_catalogo",
    recursoId: peca.id,
    dados: peca,
  });

  return Response.json(peca, { status: 201 });
}
