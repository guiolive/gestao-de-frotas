import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararSenha, gerarToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();
    if (!email || !senha) {
      return NextResponse.json({ error: "Email e senha sao obrigatorios" }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    if (!compararSenha(senha, usuario.senha)) {
      return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const token = await gerarToken({ id: usuario.id, email: usuario.email, tipo: usuario.tipo });

    const response = NextResponse.json({
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        primeiroAcesso: usuario.primeiroAcesso,
      },
      requirePasswordChange: usuario.primeiroAcesso,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[login] Erro:", err instanceof Error ? err.message : err);
    console.error("[login] Stack:", err instanceof Error ? err.stack : "no stack");
    return NextResponse.json({ error: "Erro interno", detail: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
