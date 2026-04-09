import { NextResponse } from "next/server";
import { createClient } from "@libsql/client/web";

export const runtime = "nodejs";

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const info: Record<string, string> = {
    TURSO_DATABASE_URL: tursoUrl ? tursoUrl.substring(0, 40) + "..." : "NOT SET",
    TURSO_AUTH_TOKEN: tursoToken ? `SET (len=${tursoToken.length})` : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL || "NOT SET",
    NODE_ENV: process.env.NODE_ENV || "unknown",
  };

  // Try raw libsql connection
  if (tursoUrl && tursoToken) {
    try {
      // Convert libsql:// to https:// for web client compatibility
      const httpUrl = tursoUrl.replace("libsql://", "https://");
      const client = createClient({ url: httpUrl, authToken: tursoToken });
      const result = await client.execute("SELECT COUNT(*) as cnt FROM Veiculo");
      info.libsql_raw = `OK - ${result.rows[0].cnt} veiculos`;
      client.close();
    } catch (e) {
      info.libsql_raw = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json(info);
}
