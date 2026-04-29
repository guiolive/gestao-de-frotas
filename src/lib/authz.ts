/**
 * Authorization helpers for API routes.
 *
 * The proxy (`src/proxy.ts`) forwards the authenticated user's id, email and
 * tipo to route handlers via request headers. These helpers wrap the read +
 * tipo check so individual routes don't repeat the same boilerplate.
 *
 * Convention (mirrors `validateBody` in `lib/validation.ts`):
 *   const [user, err] = requireAuth(request);
 *   if (err) return err;
 *
 *   const [user, err] = requireTipo(request, ["ADMINISTRADOR"]);
 *   if (err) return err;
 */

import { NextRequest, NextResponse } from "next/server";

export type UsuarioTipo = "OPERADOR" | "ADMINISTRADOR";
export type UsuarioSetor = "TRANSPORTE" | "MANUTENCAO" | "AMBOS";

export type AuthUser = {
  id: string;
  email: string;
  tipo: UsuarioTipo;
  setor: UsuarioSetor;
};

type AuthResult = [AuthUser, null] | [null, NextResponse];

/**
 * Read the authenticated user from request headers (set by proxy).
 * Returns 401 if absent — should never happen on routes that pass through
 * the proxy, but acts as a defense in depth in case the proxy matcher
 * misses a path.
 */
export function requireAuth(request: NextRequest): AuthResult {
  const id = request.headers.get("x-user-id");
  const email = request.headers.get("x-user-email");
  const tipo = request.headers.get("x-user-tipo");
  const setor = request.headers.get("x-user-setor") ?? "AMBOS";

  if (!id || !email || !tipo) {
    return [
      null,
      NextResponse.json({ error: "Nao autorizado" }, { status: 401 }),
    ];
  }

  return [
    {
      id,
      email,
      tipo: tipo as UsuarioTipo,
      setor: setor as UsuarioSetor,
    },
    null,
  ];
}

/**
 * Require the user to have one of the allowed tipos. Returns 403 otherwise.
 * Always runs requireAuth first so callers don't need to chain both.
 */
export function requireTipo(
  request: NextRequest,
  allowed: UsuarioTipo[]
): AuthResult {
  const [user, err] = requireAuth(request);
  if (err) return [null, err];

  if (!allowed.includes(user.tipo)) {
    return [
      null,
      NextResponse.json(
        { error: "Acesso negado: privilegios insuficientes" },
        { status: 403 }
      ),
    ];
  }

  return [user, null];
}
