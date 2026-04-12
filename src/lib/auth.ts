import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { compareSync as bcryptCompareSync } from "bcryptjs";

export { gerarToken, verificarToken } from "./jwt";

/**
 * Hash de senha usando Argon2id (recomendado pelo OWASP).
 *
 * Argon2id é o default do @node-rs/argon2 — não precisa passar `algorithm`
 * (além de evitar problemas com `const enum` + isolatedModules). Usa os
 * defaults de memoryCost=4096/timeCost=3 que já estão bem acima do que
 * bcrypt cost 10 oferece. Essa chamada é async e leva ~100-300 ms — é o
 * ponto: ser devagar pra dificultar brute-force offline.
 */
export async function hashSenha(senha: string): Promise<string> {
  return argonHash(senha);
}

/**
 * Resultado da verificação de senha.
 *
 * - `ok`: senha correta
 * - `needsRehash`: hash armazenado é legacy (bcrypt). Se `ok === true`, o
 *   chamador deve rehashear a senha com `hashSenha()` e persistir o novo hash.
 *   Estratégia de migração gradual: cada usuário migra no próximo login
 *   bem-sucedido, sem forçar reset em massa.
 */
export type CompareResult = { ok: boolean; needsRehash: boolean };

/**
 * Verifica senha contra hash armazenado. Detecta automaticamente o formato:
 * - bcrypt legado (`$2a$` / `$2b$` / `$2y$`) → verifica com bcryptjs e sinaliza rehash
 * - argon2 (`$argon2id$...`) → verifica com @node-rs/argon2
 *
 * Nunca joga exceção — retorna `{ ok: false, needsRehash: false }` em erro.
 */
export async function compararSenha(
  senha: string,
  hashArmazenado: string
): Promise<CompareResult> {
  // bcrypt legado: formato $2a$ / $2b$ / $2y$ + cost + salt + hash
  if (
    hashArmazenado.startsWith("$2a$") ||
    hashArmazenado.startsWith("$2b$") ||
    hashArmazenado.startsWith("$2y$")
  ) {
    try {
      const ok = bcryptCompareSync(senha, hashArmazenado);
      // Se bateu, marca pra rehash em argon2 na próxima oportunidade.
      return { ok, needsRehash: ok };
    } catch {
      return { ok: false, needsRehash: false };
    }
  }

  // argon2: formato $argon2id$v=19$...
  try {
    const ok = await argonVerify(hashArmazenado, senha);
    return { ok, needsRehash: false };
  } catch {
    return { ok: false, needsRehash: false };
  }
}

export function validarSenhaForte(senha: string): { valida: boolean; erros: string[] } {
  const erros: string[] = [];
  if (senha.length < 8) erros.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(senha)) erros.push("Pelo menos 1 letra maiúscula");
  if (!/[a-z]/.test(senha)) erros.push("Pelo menos 1 letra minúscula");
  if (!/[0-9]/.test(senha)) erros.push("Pelo menos 1 número");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) erros.push("Pelo menos 1 caractere especial");
  return { valida: erros.length === 0, erros };
}
