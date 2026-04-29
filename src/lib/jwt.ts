import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it in .env or your deployment environment."
  );
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters long for security."
  );
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function gerarToken(payload: {
  id: string;
  email: string;
  tipo: string;
  setor: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verificarToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // `setor` é opcional para tokens emitidos antes da migration —
    // tratado em runtime como "AMBOS" (default) pelo fallback nos
    // chamadores.
    return payload as {
      id: string;
      email: string;
      tipo: string;
      setor?: string;
    };
  } catch {
    return null;
  }
}
