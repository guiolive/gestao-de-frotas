/**
 * Healthcheck pro Docker/load balancer/uptime monitor.
 *
 * Pinga o Postgres com `SELECT 1` (não usa modelo Prisma — não queremos
 * que `migrate` em curso afete a checagem). Devolve 200 quando tudo OK
 * e 503 se o banco estiver inacessível, pra orquestrador reiniciar.
 *
 * Aberto sem auth (precisa ser, pra LB pré-autenticado conseguir bater).
 * NÃO expõe nada sensível — só `ok`/`down` + tempo de resposta.
 */
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      db: "ok",
      uptime: Math.round(process.uptime()),
      latencyMs: Date.now() - t0,
    });
  } catch {
    return Response.json(
      {
        status: "down",
        db: "down",
        latencyMs: Date.now() - t0,
      },
      { status: 503 }
    );
  }
}
