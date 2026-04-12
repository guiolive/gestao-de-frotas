/**
 * Audit log helper. Persists sensitive operations into the AuditLog table.
 *
 * Usage (after a successful mutation):
 *   await logAudit({
 *     request,
 *     user,
 *     acao: "create",
 *     recurso: "veiculo",
 *     recursoId: veiculo.id,
 *     dados: veiculo,
 *   });
 *
 * Logging is fire-and-forget — failures are swallowed and reported via
 * logger.error so they never break the request being audited. If audit
 * persistence becomes mission-critical (e.g. compliance), revisit and
 * make it a hard dependency.
 */

import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import type { AuthUser } from "./authz";
import { logger } from "./logger";

export type AuditAcao =
  | "login_success"
  | "login_failure"
  | "create"
  | "update"
  | "delete";

type LogAuditInput = {
  request: NextRequest;
  user?: AuthUser | null;
  /** Used when there's no authenticated user yet (e.g. login_failure). */
  usuarioId?: string | null;
  acao: AuditAcao;
  recurso: string;
  recursoId?: string | null;
  /** Snapshot of the relevant payload. Will be JSON.stringify'd. */
  dados?: unknown;
};

function clientIp(request: NextRequest): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

export async function logAudit(input: LogAuditInput): Promise<void> {
  try {
    const usuarioId = input.user?.id ?? input.usuarioId ?? null;
    const ip = clientIp(input.request);
    const userAgent = input.request.headers.get("user-agent")?.slice(0, 500) ?? null;

    let dadosString: string | null = null;
    if (input.dados !== undefined && input.dados !== null) {
      try {
        dadosString = JSON.stringify(input.dados);
      } catch {
        dadosString = "[unserializable]";
      }
    }

    await prisma.auditLog.create({
      data: {
        usuarioId,
        acao: input.acao,
        recurso: input.recurso,
        recursoId: input.recursoId ?? null,
        dados: dadosString,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    // Never fail the parent request because of audit persistence
    logger.error({ err, acao: input.acao, recurso: input.recurso }, "falha ao gravar AuditLog");
  }
}
