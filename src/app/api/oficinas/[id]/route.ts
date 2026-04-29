import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, oficinaUpdateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const oficina = await prisma.oficina.findUnique({
    where: { id: params.id },
    include: { _count: { select: { manutencoes: true } } },
  });

  if (!oficina) {
    return Response.json({ error: "Oficina não encontrada" }, { status: 404 });
  }

  return Response.json(oficina);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, oficinaUpdateSchema);
  if (err) return err;

  if (data.cnpj) {
    const existente = await prisma.oficina.findUnique({ where: { cnpj: data.cnpj } });
    if (existente && existente.id !== params.id) {
      return Response.json(
        { error: "Já existe uma oficina com esse CNPJ" },
        { status: 409 }
      );
    }
  }

  const oficina = await prisma.oficina.update({
    where: { id: params.id },
    data,
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "oficina",
    recursoId: params.id,
    dados: oficina,
  });

  return Response.json(oficina);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const count = await prisma.manutencao.count({ where: { oficinaId: params.id } });
  if (count > 0) {
    return Response.json(
      { error: "Oficina possui manutenções vinculadas" },
      { status: 400 }
    );
  }

  const snapshot = await prisma.oficina.findUnique({ where: { id: params.id } });
  if (!snapshot) {
    return Response.json({ error: "Oficina não encontrada" }, { status: 404 });
  }

  await prisma.oficina.delete({ where: { id: params.id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "oficina",
    recursoId: params.id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
