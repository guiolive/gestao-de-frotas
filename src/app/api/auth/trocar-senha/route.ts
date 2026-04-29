import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compararSenha, hashSenha, gerarToken, validarSenhaForte } from "@/lib/auth";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const userId = user.id;

  const { senhaAtual, novaSenha } = await request.json();
  if (!senhaAtual || !novaSenha) {
    return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const check = await compararSenha(senhaAtual, usuario.senha);
  if (!check.ok) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const { valida, erros } = validarSenhaForte(novaSenha);
  if (!valida) {
    return NextResponse.json({ error: "Senha fraca", erros }, { status: 400 });
  }

  const senhaHash = await hashSenha(novaSenha);
  await prisma.usuario.update({
    where: { id: userId },
    data: { senha: senhaHash, primeiroAcesso: false },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "usuario_senha",
    recursoId: userId,
    // NUNCA persistir senhas no audit log — só metadados
    dados: { primeiroAcesso: usuario.primeiroAcesso },
  });

  const token = await gerarToken({
    id: usuario.id,
    email: usuario.email,
    tipo: usuario.tipo,
    setor: usuario.setor,
  });

  const response = NextResponse.json({
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      setor: usuario.setor,
      primeiroAcesso: false,
    },
  });

  response.cookies.set("token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
  });

  return response;
}
