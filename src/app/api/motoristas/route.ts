import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, motoristaCreateSchema } from "@/lib/validation";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { searchParams } = request.nextUrl;
  const incluirInativos = searchParams.get("incluirInativos") === "true";

  // Filtro padrão pós soft-delete: oculta motoristas com status="inativo".
  // ?incluirInativos=true mostra todos.
  const motoristas = await prisma.motorista.findMany({
    where: incluirInativos ? undefined : { status: { not: "inativo" } },
    orderBy: { criadoEm: "desc" },
  });
  return Response.json(motoristas);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, motoristaCreateSchema);
  if (err) return err;

  // CPF somente dígitos (remove formatação)
  const cpfLimpo = data.cpf.replace(/\D/g, "");

  // Unicidade
  const conflito = await prisma.motorista.findFirst({
    where: { OR: [{ cpf: cpfLimpo }, { cnh: data.cnh }] },
  });
  if (conflito) {
    return Response.json(
      { error: "CPF ou CNH já cadastrado." },
      { status: 409 }
    );
  }

  const motorista = await prisma.motorista.create({
    data: { ...data, cpf: cpfLimpo },
  });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "motorista",
    recursoId: motorista.id,
    dados: motorista,
  });

  return Response.json(motorista, { status: 201 });
}
