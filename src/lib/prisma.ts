import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

let _prisma: InstanceType<typeof PrismaClient> | null = null;

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  let url: string;
  let authToken: string | undefined;

  if (tursoUrl && tursoUrl.startsWith("libsql://")) {
    url = tursoUrl;
    authToken = tursoToken;
  } else {
    const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
    if (dbUrl.startsWith("file:./")) {
      const rel = dbUrl.replace("file:./", "");
      url = `file:${process.cwd()}/${rel}`;
    } else {
      url = dbUrl;
    }
  }

  console.log("[prisma] Creating client for:", url.substring(0, 50));
  const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url });
  return new PrismaClient({ adapter });
}

export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_target, prop) {
    if (!_prisma) {
      _prisma = createPrismaClient();
    }
    return (_prisma as Record<string | symbol, unknown>)[prop];
  },
});
