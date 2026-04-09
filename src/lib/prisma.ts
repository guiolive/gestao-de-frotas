import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function getUrl(): { url: string; authToken?: string } {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.startsWith("libsql://")) {
    return { url: tursoUrl, authToken: tursoToken };
  }

  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (dbUrl.startsWith("file:./")) {
    const rel = dbUrl.replace("file:./", "");
    return { url: `file:${process.cwd()}/${rel}` };
  }

  return { url: dbUrl };
}

function createPrismaClient() {
  const { url, authToken } = getUrl();
  console.log("[prisma] Connecting to:", url.startsWith("libsql") ? url : url);
  const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url });
  return new PrismaClient({ adapter });
}

// In production (Vercel serverless), create fresh client each cold start
// In development, reuse singleton to avoid too many connections
const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

export const prisma = (() => {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
})();
