/**
 * Cria (ou reseta) o usuário admin via upsert.
 *
 * Uso:
 *   ADMIN_EMAIL="oliveiraguilherme@ufg.br" ADMIN_SENHA="Trocar@2026" \
 *     npx tsx scripts/criar-admin.ts
 *
 * Quando aponta pra DATABASE_URL de produção, faz a alteração lá.
 * Sempre marca `primeiroAcesso=true` — sistema força troca no 1º login.
 *
 * Não usar em CI sem cuidado: o `npx tsx` precisa estar instalado e o
 * DATABASE_URL precisa estar exportado no shell que roda.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash as argonHash } from "@node-rs/argon2";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA ?? "";

  if (!email || !email.endsWith("@ufg.br")) {
    console.error("ADMIN_EMAIL deve ser um e-mail @ufg.br");
    process.exit(1);
  }
  if (senha.length < 8) {
    console.error("ADMIN_SENHA deve ter no mínimo 8 caracteres");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não setado");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const senhaHash = await argonHash(senha);

  const user = await prisma.usuario.upsert({
    where: { email },
    create: {
      nome: "Administrador",
      email,
      senha: senhaHash,
      tipo: "ADMINISTRADOR",
      setor: "AMBOS",
      primeiroAcesso: true,
      ativo: true,
    },
    update: {
      senha: senhaHash,
      tipo: "ADMINISTRADOR",
      setor: "AMBOS",
      primeiroAcesso: true,
      ativo: true,
    },
    select: {
      id: true,
      email: true,
      tipo: true,
      setor: true,
      primeiroAcesso: true,
    },
  });

  console.log("✅ Admin pronto:");
  console.log(JSON.stringify(user, null, 2));
  console.log(
    "\nLogin em https://gestao-de-frota-mu.vercel.app/login com a senha enviada."
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
