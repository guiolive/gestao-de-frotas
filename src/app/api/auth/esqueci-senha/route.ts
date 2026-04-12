import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { validateBody, esqueciSenhaSchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { enviarEmailResetSenha } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const EXPIRA_MINUTOS = 60;
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 5 * 60 * 1000; // 5 min

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  // Fallback: deriva do host da própria request. NUNCA confie no Host em
  // produção sem uma whitelist — aqui é OK pra dev / deploy atrás de proxy
  // com X-Forwarded-Host confiável.
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit agressivo por IP — evita abuso do envio de emails
    const ip = clientKey(request);
    const rl = checkRateLimit(`esqueci:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Muitas solicitações. Tente novamente em alguns minutos.",
          retryAfterSeconds: Math.ceil(rl.resetInMs / 1000),
        },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    const [data, err] = await validateBody(request, esqueciSenhaSchema);
    if (err) return err;

    const usuario = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    // NUNCA revelar se o e-mail existe. Resposta idempotente: sempre 200.
    // Isso evita enumeração de usuários. Nós só mandamos o email (e criamos
    // o token) se o usuário existir E estiver ativo.
    if (usuario && usuario.ativo) {
      // Gera token opaco de 32 bytes = 64 hex chars. Armazena só o hash.
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiraEm = new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          usuarioId: usuario.id,
          tokenHash,
          expiraEm,
        },
      });

      const baseUrl = getBaseUrl(request);
      const resetUrl = `${baseUrl}/resetar-senha?token=${rawToken}`;

      // Fire-and-forget: falha de SMTP não deve bloquear resposta nem
      // revelar ao atacante que o email é válido.
      enviarEmailResetSenha({
        para: usuario.email,
        nome: usuario.nome,
        resetUrl,
        expiraEmMinutos: EXPIRA_MINUTOS,
      }).catch((err) =>
        logger.error({ err, usuarioId: usuario.id }, "falha ao enviar email de reset")
      );

      await logAudit({
        request,
        usuarioId: usuario.id,
        acao: "update",
        recurso: "password_reset_token",
        recursoId: usuario.id,
        dados: { email: usuario.email, expiraEm: expiraEm.toISOString() },
      });
    } else {
      // Log mesmo quando o email não existe — útil pra detectar scanning
      await logAudit({
        request,
        usuarioId: null,
        acao: "update",
        recurso: "password_reset_token",
        recursoId: null,
        dados: { email: data.email, motivo: usuario ? "inativo" : "nao_encontrado" },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
    });
  } catch (err) {
    logger.error({ err, route: "/api/auth/esqueci-senha" }, "esqueci-senha route failed");
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
