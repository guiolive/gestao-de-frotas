import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

function getDbUrl() {
  // Use DATABASE_URL from env, converting prisma format to libsql format
  const envUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (envUrl.startsWith("file:./")) {
    // Relative path - resolve from cwd
    const rel = envUrl.replace("file:./", "");
    return `file:${process.cwd()}/${rel}`;
  }
  return envUrl;
}

function createPrismaClient() {
  const url = getDbUrl();
  console.log("[prisma] Connecting to:", url);
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
