import { NextRequest, NextResponse } from "next/server";
import { verificarToken } from "@/lib/jwt";

const PUBLIC_PATHS = [
  "/login",
  "/resetar-senha",
  "/api/auth/login",
  "/api/auth/esqueci-senha",
  "/api/auth/resetar-senha",
  // Healthcheck pro orquestrador — precisa responder sem token.
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, static files, and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  // Get token from cookie or Authorization header
  const tokenFromCookie = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verificarToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  // Pass user info forward to route handlers via REQUEST headers.
  // IMPORTANT: NextResponse.next({ request: { headers } }) sets headers
  // upstream (visible to handlers via request.headers.get). Setting them on
  // response.headers would only send them back to the client, leaving
  // route handlers reading `null`.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-tipo", payload.tipo);
  requestHeaders.set("x-user-email", payload.email);
  // Tokens emitidos antes da migration de setor não trazem o campo —
  // fallback "AMBOS" garante que continuem podendo navegar normalmente.
  requestHeaders.set("x-user-setor", payload.setor ?? "AMBOS");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
