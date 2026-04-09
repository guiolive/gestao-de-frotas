import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararSenha, hashSenha, gerarToken, validarSenhaForte } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });

  const { senhaAtual, novaSenha } = await request.json();
  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ error: "Senha atual e nova senha sao obrigatorias" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });

  if (!compararSenha(senhaAtual, usuario.senha)) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const { valida, erros } = validarSenhaForte(novaSenha);
  if (!valida) {
    return NextResponse.json({ error: "Senha fraca", erros }, { status: 400 });
  }

  const senhaHash = hashSenha(novaSenha);
  await prisma.usuario.update({
    where: { id: userId },
    data: { senha: senhaHash, primeiroAcesso: false },
  });

  const token = await gerarToken({ id: usuario.id, email: usuario.email, tipo: usuario.tipo });

  const response = NextResponse.json({
    token,
    user: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo, primeiroAcesso: false },
  });

  response.cookies.set("token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
  });

  return response;
}
