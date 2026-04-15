import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { hashSenha } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    return Response.json({ error: "Usuario nao encontrado" }, { status: 404 });
  }

  const senhaTemporaria = randomBytes(5).toString("hex");
  const senhaHash = await hashSenha(senhaTemporaria);

  await prisma.usuario.update({
    where: { id },
    data: {
      senha: senhaHash,
      primeiroAcesso: true,
    },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "usuario",
    recursoId: id,
    dados: { acao: "resetar_senha", nome: usuario.nome, email: usuario.email },
  });

  return Response.json({ senhaTemporaria });
}
