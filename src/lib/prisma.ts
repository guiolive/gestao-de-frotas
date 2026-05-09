import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não configurada");
  }
  // Loga apenas host/db pra evitar leak de credenciais em produção.
  try {
    const u = new URL(url);
    logger.info(
      { host: u.hostname, db: u.pathname.replace(/^\//, "") },
      "prisma connecting"
    );
  } catch {
    logger.info({}, "prisma connecting (url unparseable)");
  }

  // Pool pequeno por instância: cada função serverless é isolada, e o Neon
  // (pgbouncer) gerencia o pool real do lado do banco. Sem isso, dezenas de
  // cold starts somam centenas de conexões e estouram o limite do Neon.
  const pool = new pg.Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 1),
    idleTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Cacheia em globalThis SEMPRE — inclusive em produção. Sem isso, cada
// reload de módulo (Next.js HMR em dev, hot module em serverless) abre um
// pool novo, vazando conexões até saturar o Neon.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
