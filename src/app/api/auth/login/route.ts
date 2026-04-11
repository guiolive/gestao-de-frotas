import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararSenha, gerarToken } from "@/lib/auth";
import { validateBody, loginSchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minuto

export async function POST(request: NextRequest) {
  try {
    // Rate limit por IP — aplicado ANTES de qualquer query ao banco
    const ip = clientKey(request);
    const rl = checkRateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Muitas tentativas. Tente novamente em alguns instantes.",
          retryAfterSeconds: Math.ceil(rl.resetInMs / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rl.resetInMs / 1000)),
            "X-RateLimit-Limit": String(MAX_ATTEMPTS),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const [data, err] = await validateBody(request, loginSchema);
    if (err) return err;

    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (!usuario || !usuario.ativo) {
      return NextResponse.json(
        { error: "Credenciais invalidas" },
        { status: 401 }
      );
    }

    if (!compararSenha(data.senha, usuario.senha)) {
      return NextResponse.json(
        { error: "Credenciais invalidas" },
        { status: 401 }
      );
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const token = await gerarToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
    });

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
    console.error("[login] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
