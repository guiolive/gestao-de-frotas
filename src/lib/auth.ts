import { hashSync, compareSync } from "bcryptjs";

export { gerarToken, verificarToken } from "./jwt";

export function hashSenha(senha: string): string {
  return hashSync(senha, 10);
}

export function compararSenha(senha: string, hash: string): boolean {
  return compareSync(senha, hash);
}

export function validarSenhaForte(senha: string): { valida: boolean; erros: string[] } {
  const erros: string[] = [];
  if (senha.length < 8) erros.push("Minimo 8 caracteres");
  if (!/[A-Z]/.test(senha)) erros.push("Pelo menos 1 letra maiuscula");
  if (!/[a-z]/.test(senha)) erros.push("Pelo menos 1 letra minuscula");
  if (!/[0-9]/.test(senha)) erros.push("Pelo menos 1 numero");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) erros.push("Pelo menos 1 caractere especial");
  return { valida: erros.length === 0, erros };
}
