import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, pecaUpdateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const peca = await prisma.peca.findUnique({ where: { id: params.id } });
  if (!peca) {
    return Response.json({ error: "Peça não encontrada" }, { status: 404 });
  }
  return Response.json(peca);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, pecaUpdateSchema);
  if (err) return err;

  if (data.nome) {
    const existente = await prisma.peca.findUnique({ where: { nome: data.nome } });
    if (existente && existente.id !== params.id) {
      return Response.json(
        { error: "Já existe uma peça com esse nome." },
        { status: 409 }
      );
    }
  }

  const peca = await prisma.peca.update({
    where: { id: params.id },
    data,
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "peca_catalogo",
    recursoId: params.id,
    dados: peca,
  });

  return Response.json(peca);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const count = await prisma.itemManutencao.count({
    where: { pecaId: params.id },
  });
  if (count > 0) {
    return Response.json(
      { error: "Peça possui itens de manutenção vinculados" },
      { status: 400 }
    );
  }

  const snapshot = await prisma.peca.findUnique({ where: { id: params.id } });
  if (!snapshot) {
    return Response.json({ error: "Peça não encontrada" }, { status: 404 });
  }

  await prisma.peca.delete({ where: { id: params.id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "peca_catalogo",
    recursoId: params.id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
