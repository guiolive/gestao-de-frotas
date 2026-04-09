import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export const runtime = "nodejs";

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const dbUrl = process.env.DATABASE_URL;

  const info: Record<string, string> = {
    TURSO_DATABASE_URL: tursoUrl ? tursoUrl.substring(0, 40) + "..." : "NOT SET",
    TURSO_AUTH_TOKEN: tursoToken ? `SET (len=${tursoToken.length})` : "NOT SET",
    DATABASE_URL: dbUrl || "NOT SET",
    NODE_ENV: process.env.NODE_ENV || "unknown",
  };

  // Try connecting with Turso
  if (tursoUrl && tursoToken) {
    try {
      const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
      const prisma = new PrismaClient({ adapter });
      const count = await prisma.veiculo.count();
      info.turso_test = `OK - ${count} veiculos`;
      await prisma.$disconnect();
    } catch (e) {
      info.turso_test = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json(info);
}
