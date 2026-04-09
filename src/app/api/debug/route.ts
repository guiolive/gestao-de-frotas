import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || "";
  const tursoToken = process.env.TURSO_AUTH_TOKEN || "";

  // Show exact URL details for debugging
  const info: Record<string, unknown> = {
    url_length: tursoUrl.length,
    url_full: tursoUrl,
    url_chars: Array.from(tursoUrl.substring(0, 10)).map(c => c.charCodeAt(0)),
    token_length: tursoToken.length,
    token_first10: tursoToken.substring(0, 10),
  };

  // Try with hardcoded https URL
  try {
    const { createClient } = await import("@libsql/client/web");
    const httpUrl = tursoUrl.replace("libsql://", "https://");
    info.httpUrl = httpUrl;
    const client = createClient({ url: httpUrl, authToken: tursoToken });
    const result = await client.execute("SELECT COUNT(*) as cnt FROM Veiculo");
    info.result = `OK: ${result.rows[0].cnt}`;
  } catch (e) {
    info.error = e instanceof Error ? e.message : String(e);
    info.stack = e instanceof Error ? e.stack?.split("\n").slice(0, 3) : undefined;
  }

  return NextResponse.json(info);
}
