import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, bateriaCreateSchema } from "@/lib/validation";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

/**
 * Lista histórico de baterias do veículo (mais recente primeiro).
 * Operadores podem ver; só admin cria/substitui.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const baterias = await prisma.bateria.findMany({
    where: { veiculoId: params.id },
    orderBy: [{ dataSubstituicao: "desc" }, { dataInstalacao: "desc" }],
  });
  return Response.json(baterias);
}

/**
 * Cria uma nova bateria "ativa". Se houver uma ativa anterior
 * (dataSubstituicao = null), marca-a como substituída agora.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, bateriaCreateSchema);
  if (err) return err;

  const veiculo = await prisma.veiculo.findUnique({ where: { id: params.id } });
  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  const nova = await prisma.$transaction(async (tx) => {
    // Encerra a bateria ativa anterior, se houver.
    await tx.bateria.updateMany({
      where: { veiculoId: params.id, dataSubstituicao: null },
      data: { dataSubstituicao: new Date() },
    });
    return tx.bateria.create({
      data: { ...data, veiculoId: params.id },
    });
  });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "bateria",
    recursoId: nova.id,
    dados: nova,
  });

  return Response.json(nova, { status: 201 });
}
