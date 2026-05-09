import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // O cookie é HttpOnly — só o servidor pode apagá-lo. requireAuth garante
  // que requests sem sessão válida não geram audit ruidoso.
  const [user] = requireAuth(request);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete({ name: "token", path: "/" });

  if (user) {
    await logAudit({
      request,
      usuarioId: user.id,
      acao: "logout",
      recurso: "auth",
    });
  }

  return response;
}
