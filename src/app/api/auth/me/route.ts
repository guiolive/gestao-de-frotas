import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, tipo: true, ativo: true, matricula: true, primeiroAcesso: true, criadoEm: true, ultimoLogin: true },
  });

  if (!usuario) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });
  return NextResponse.json(usuario);
}
