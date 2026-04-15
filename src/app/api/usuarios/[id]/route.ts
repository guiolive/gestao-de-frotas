import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, usuarioUpdateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      ativo: true,
      matricula: true,
      primeiroAcesso: true,
      criadoEm: true,
      atualizadoEm: true,
      ultimoLogin: true,
      _count: { select: { auditLogs: true } },
    },
  });

  if (!usuario) {
    return Response.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  return Response.json(usuario);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = await params;

  const [data, err] = await validateBody(request, usuarioUpdateSchema);
  if (err) return err;

  // Verificar se existe
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) {
    return Response.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  // Nao permitir que o admin desative a si mesmo
  if (data.ativo === false && id === user.id) {
    return Response.json(
      { error: "Voce nao pode desativar sua propria conta." },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.matricula !== undefined ? { matricula: data.matricula } : {}),
      ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      ativo: true,
      matricula: true,
      primeiroAcesso: true,
      criadoEm: true,
    },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "usuario",
    recursoId: id,
    dados: { antes: { nome: existente.nome, tipo: existente.tipo, ativo: existente.ativo }, depois: data },
  });

  return Response.json(usuario);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = await params;

  // Nao permitir auto-exclusao
  if (id === user.id) {
    return Response.json(
      { error: "Voce nao pode excluir sua propria conta." },
      { status: 400 }
    );
  }

  const snapshot = await prisma.usuario.findUnique({ where: { id } });
  if (!snapshot) {
    return Response.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  await prisma.usuario.delete({ where: { id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "usuario",
    recursoId: id,
    dados: { nome: snapshot.nome, email: snapshot.email, tipo: snapshot.tipo },
  });

  return Response.json({ ok: true });
}
