import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  let url: string;
  let authToken: string | undefined;

  if (tursoUrl) {
    // Production: use Turso
    url = tursoUrl;
    authToken = tursoToken;
    console.log("[prisma] Using Turso:", url);
  } else if (dbUrl.startsWith("file:./")) {
    // Local: resolve relative path
    const rel = dbUrl.replace("file:./", "");
    url = `file:${process.cwd()}/${rel}`;
    console.log("[prisma] Using local SQLite:", url);
  } else {
    url = dbUrl;
    console.log("[prisma] Using:", url);
  }

  const adapter = new PrismaLibSql({
    url,
    ...(authToken ? { authToken } : {}),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
