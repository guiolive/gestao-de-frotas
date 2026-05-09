import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, oficinaCreateSchema } from "@/lib/validation";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { searchParams } = request.nextUrl;
  const ativaParam = searchParams.get("ativa");
  const incluirInativas = searchParams.get("incluirInativas") === "true";
  const q = searchParams.get("q")?.trim();

  // Filtro padrão pós soft-delete: só ativas. ?ativa=false mostra só inativas;
  // ?incluirInativas=true mostra ambas.
  const where: { ativa?: boolean; OR?: object[] } = {};
  if (ativaParam !== null) {
    where.ativa = ativaParam === "true";
  } else if (!incluirInativas) {
    where.ativa = true;
  }
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { cnpj: { contains: q.replace(/\D/g, "") } },
    ];
  }

  const oficinas = await prisma.oficina.findMany({
    where,
    orderBy: { nome: "asc" },
    include: { _count: { select: { manutencoes: true } } },
  });

  return Response.json(oficinas);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, oficinaCreateSchema);
  if (err) return err;

  const existente = await prisma.oficina.findUnique({
    where: { cnpj: data.cnpj },
  });
  if (existente) {
    return Response.json(
      { error: "Já existe uma oficina com esse CNPJ" },
      { status: 409 }
    );
  }

  const oficina = await prisma.oficina.create({ data });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "oficina",
    recursoId: oficina.id,
    dados: oficina,
  });

  return Response.json(oficina, { status: 201 });
}
