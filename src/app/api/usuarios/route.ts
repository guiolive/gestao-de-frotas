import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, usuarioCreateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { hashSenha } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  const [, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { searchParams } = request.nextUrl;
  const tipo = searchParams.get("tipo");
  const ativo = searchParams.get("ativo");
  const search = searchParams.get("search");

  const usuarios = await prisma.usuario.findMany({
    where: {
      ...(tipo ? { tipo } : {}),
      ...(ativo !== null ? { ativo: ativo === "true" } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
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
      ultimoLogin: true,
    },
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(usuarios);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, usuarioCreateSchema);
  if (err) return err;

  // Unicidade de e-mail
  const existente = await prisma.usuario.findUnique({
    where: { email: data.email },
  });
  if (existente) {
    return Response.json(
      { error: "Ja existe um usuario com esse e-mail." },
      { status: 409 }
    );
  }

  // Gerar senha temporaria
  const senhaTemporaria = randomBytes(5).toString("hex"); // 10 chars
  const senhaHash = await hashSenha(senhaTemporaria);

  const usuario = await prisma.usuario.create({
    data: {
      nome: data.nome,
      email: data.email,
      senha: senhaHash,
      tipo: data.tipo ?? "OPERADOR",
      matricula: data.matricula ?? null,
      primeiroAcesso: true,
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
    acao: "create",
    recurso: "usuario",
    recursoId: usuario.id,
    dados: { nome: usuario.nome, email: usuario.email, tipo: usuario.tipo },
  });

  return Response.json(
    { ...usuario, senhaTemporaria },
    { status: 201 }
  );
}
