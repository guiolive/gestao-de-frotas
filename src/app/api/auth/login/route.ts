import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararSenha, gerarToken, hashSenha } from "@/lib/auth";
import { validateBody, loginSchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

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
      await logAudit({
        request,
        usuarioId: usuario?.id ?? null,
        acao: "login_failure",
        recurso: "auth",
        dados: { email: data.email, motivo: usuario ? "inativo" : "nao_encontrado" },
      });
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const check = await compararSenha(data.senha, usuario.senha);
    if (!check.ok) {
      await logAudit({
        request,
        usuarioId: usuario.id,
        acao: "login_failure",
        recurso: "auth",
        dados: { email: data.email, motivo: "senha_incorreta" },
      });
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Migração gradual bcrypt → argon2: se o hash armazenado é legacy bcrypt,
    // rehashamos com argon2 agora que sabemos a senha correta. Await garante
    // consistência (próximo login já usa argon2). Custa ~300 ms extras só no
    // primeiro login de cada usuário — aceitável.
    const novaSenhaHash = check.needsRehash ? await hashSenha(data.senha) : undefined;

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ultimoLogin: new Date(),
        ...(novaSenhaHash ? { senha: novaSenhaHash } : {}),
      },
    });

    await logAudit({
      request,
      usuarioId: usuario.id,
      acao: "login_success",
      recurso: "auth",
      dados: { email: usuario.email, tipo: usuario.tipo },
    });

    const token = await gerarToken({
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      setor: usuario.setor,
    });

    const response = NextResponse.json({
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        setor: usuario.setor,
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
    logger.error({ err, route: "/api/auth/login" }, "login route failed");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
