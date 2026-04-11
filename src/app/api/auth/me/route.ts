import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const [user, err] = requireAuth(request);
  if (err) return err;

  const usuario = await prisma.usuario.findUnique({
    where: { id: user.id },
    select: { id: true, nome: true, email: true, tipo: true, ativo: true, matricula: true, primeiroAcesso: true, criadoEm: true, ultimoLogin: true },
  });

  if (!usuario) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  return NextResponse.json(usuario);
}
