import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, servicoCreateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ativo = searchParams.get("ativo");
  const q = searchParams.get("q")?.trim();

  const where: {
    ativo?: boolean;
    nome?: { contains: string; mode: "insensitive" };
  } = {};
  if (ativo !== null) where.ativo = ativo === "true";
  if (q) where.nome = { contains: q, mode: "insensitive" };

  const servicos = await prisma.servico.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  return Response.json(servicos);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, servicoCreateSchema);
  if (err) return err;

  const existente = await prisma.servico.findUnique({ where: { nome: data.nome } });
  if (existente) {
    return Response.json(
      { error: "Já existe um serviço com esse nome." },
      { status: 409 }
    );
  }

  const servico = await prisma.servico.create({ data });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "servico_catalogo",
    recursoId: servico.id,
    dados: servico,
  });

  return Response.json(servico, { status: 201 });
}
