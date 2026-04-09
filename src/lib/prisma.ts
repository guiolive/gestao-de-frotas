import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Local SQLite: resolve relative paths
  let resolvedUrl = url;
  if (url.startsWith("file:./")) {
    const rel = url.replace("file:./", "");
    resolvedUrl = `file:${process.cwd()}/${rel}`;
  }

  console.log("[prisma] Connecting to:", resolvedUrl.startsWith("libsql") ? resolvedUrl.split("?")[0] : resolvedUrl);

  const adapter = new PrismaLibSql({
    url: resolvedUrl,
    ...(authToken ? { authToken } : {}),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
