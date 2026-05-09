import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, motoristaUpdateSchema } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;
  const motorista = await prisma.motorista.findUnique({
    where: { id },
    include: { viagens: true },
  });

  if (!motorista) {
    return Response.json({ error: "Motorista não encontrado" }, { status: 404 });
  }

  return Response.json(motorista);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

  const [data, valErr] = await validateBody(request, motoristaUpdateSchema);
  if (valErr) return valErr;

  // CPF/CNH são unique no schema. Sem checagem prévia, conflito vira 500
  // cru com mensagem do Postgres ("duplicate key…"). Fail fast com 409.
  if (data.cpf || data.cnh) {
    const conflito = await prisma.motorista.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              ...(data.cpf ? [{ cpf: data.cpf }] : []),
              ...(data.cnh ? [{ cnh: data.cnh }] : []),
            ],
          },
        ],
      },
      select: { id: true, cpf: true, cnh: true },
    });
    if (conflito) {
      const campo = conflito.cpf === data.cpf ? "CPF" : "CNH";
      return Response.json(
        { error: `${campo} já cadastrado para outro motorista.` },
        { status: 409 }
      );
    }
  }

  const motorista = await prisma.motorista.update({
    where: { id },
    data,
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "motorista",
    recursoId: id,
    dados: motorista,
  });

  return Response.json(motorista);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

  // Soft delete: marca como inativo. Preserva FKs em viagens históricas
  // (motorista1/motorista2). Idempotente.
  const snapshot = await prisma.motorista.findUnique({ where: { id } });
  if (!snapshot) {
    return Response.json({ error: "Motorista não encontrado" }, { status: 404 });
  }

  await prisma.motorista.update({
    where: { id },
    data: { status: "inativo" },
  });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "motorista",
    recursoId: id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
