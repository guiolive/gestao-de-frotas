import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashSenha, validarSenhaForte } from "@/lib/auth";
import { validateBody, resetarSenhaSchema } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 1000; // 1 minuto

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit moderado — protege contra força bruta de tokens, embora
    // o espaço de 32 bytes random já seja infactível de quebrar.
    const ip = clientKey(request);
    const rl = checkRateLimit(`reset:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Muitas tentativas. Tente novamente em alguns instantes.",
          retryAfterSeconds: Math.ceil(rl.resetInMs / 1000),
        },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } }
      );
    }

    const [data, err] = await validateBody(request, resetarSenhaSchema);
    if (err) return err;

    // Valida força da senha
    const { valida, erros } = validarSenhaForte(data.novaSenha);
    if (!valida) {
      return NextResponse.json({ error: "Senha fraca", erros }, { status: 400 });
    }

    // Busca o token pelo hash (armazenamos só o hash, nunca o raw)
    const tokenHash = hashToken(data.token);
    const registro = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });

    if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
      return NextResponse.json(
        { error: "Link inválido ou expirado. Solicite um novo." },
        { status: 400 }
      );
    }

    if (!registro.usuario.ativo) {
      return NextResponse.json(
        { error: "Conta inativa. Contate o administrador." },
        { status: 403 }
      );
    }

    // Transação: atualiza a senha do usuário + marca token como usado +
    // invalida TODOS os outros tokens pendentes do mesmo usuário (caso tenha
    // pedido reset várias vezes, só o primeiro uso vale)
    const senhaHash = await hashSenha(data.novaSenha);
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: registro.usuarioId },
        data: { senha: senhaHash, primeiroAcesso: false },
      }),
      prisma.passwordResetToken.update({
        where: { id: registro.id },
        data: { usadoEm: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          usuarioId: registro.usuarioId,
          id: { not: registro.id },
          usadoEm: null,
        },
        data: { usadoEm: new Date() },
      }),
    ]);

    await logAudit({
      request,
      usuarioId: registro.usuarioId,
      acao: "update",
      recurso: "usuario_senha",
      recursoId: registro.usuarioId,
      dados: { via: "password_reset" },
    });

    return NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso. Faça login com a nova senha.",
    });
  } catch (err) {
    console.error("[resetar-senha] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
