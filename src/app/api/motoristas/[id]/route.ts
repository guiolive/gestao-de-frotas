import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const body = await request.json();

  const motorista = await prisma.motorista.update({
    where: { id },
    data: {
      nome: body.nome,
      cpf: body.cpf,
      cnh: body.cnh,
      categoriaCnh: body.categoriaCnh,
      telefone: body.telefone,
      email: body.email,
      status: body.status,
    },
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
  const snapshot = await prisma.motorista.findUnique({ where: { id } });
  await prisma.motorista.delete({ where: { id } });

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
