import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, servicoUpdateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const servico = await prisma.servico.findUnique({ where: { id: params.id } });
  if (!servico) {
    return Response.json({ error: "Serviço não encontrado" }, { status: 404 });
  }
  return Response.json(servico);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, servicoUpdateSchema);
  if (err) return err;

  if (data.nome) {
    const existente = await prisma.servico.findUnique({ where: { nome: data.nome } });
    if (existente && existente.id !== params.id) {
      return Response.json(
        { error: "Já existe um serviço com esse nome." },
        { status: 409 }
      );
    }
  }

  const servico = await prisma.servico.update({
    where: { id: params.id },
    data,
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "servico_catalogo",
    recursoId: params.id,
    dados: servico,
  });

  return Response.json(servico);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const count = await prisma.itemManutencao.count({
    where: { servicoRefId: params.id },
  });
  if (count > 0) {
    return Response.json(
      { error: "Serviço possui itens de manutenção vinculados" },
      { status: 400 }
    );
  }

  const snapshot = await prisma.servico.findUnique({ where: { id: params.id } });
  if (!snapshot) {
    return Response.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  await prisma.servico.delete({ where: { id: params.id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "servico_catalogo",
    recursoId: params.id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
