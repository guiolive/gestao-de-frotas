import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, unidadeCreateSchema } from "@/lib/validation";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { searchParams } = request.nextUrl;
  const ativoParam = searchParams.get("ativo");
  const incluirInativos = searchParams.get("incluirInativos") === "true";

  // Filtro padrão pós soft-delete: só ativas. ?ativo=false mostra só inativas;
  // ?incluirInativos=true mostra ambas.
  let where: { ativo?: boolean } | undefined;
  if (ativoParam !== null) {
    where = { ativo: ativoParam === "true" };
  } else if (!incluirInativos) {
    where = { ativo: true };
  }

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
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

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

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "unidade",
    recursoId: unidade.id,
    dados: unidade,
  });

  return Response.json(unidade, { status: 201 });
}
