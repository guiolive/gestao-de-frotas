import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, viagemUpdateSchema } from "@/lib/validation";
import { planejarAtualizacao, mensagemErroViagem } from "@/lib/viagem";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;
  const viagem = await prisma.viagem.findUnique({
    where: { id },
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
      agendamento: { include: { unidade: true } },
    },
  });

  if (!viagem) {
    return Response.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  return Response.json(viagem);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;

  const [patch, valErr] = await validateBody(request, viagemUpdateSchema);
  if (valErr) return valErr;

  const current = await prisma.viagem.findUnique({
    where: { id },
    include: { veiculo: { select: { status: true, quilometragem: true } } },
  });
  if (!current) {
    return Response.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  // Toda decisão (patch parcial, totalDiarias, dataRetorno ao concluir,
  // PCDP/km sobre o estado resultante, transição de status e efeito no
  // veículo) é do módulo; aqui só I/O.
  const plano = planejarAtualizacao(current, patch, {
    agora: new Date(),
    veiculo: current.veiculo,
  });
  if (!plano.ok) {
    if (plano.erro === "transicao_invalida") {
      return Response.json(
        {
          error: `Transição de status inválida: ${plano.de} → ${plano.para}`,
          code: plano.erro,
          de: plano.de,
          para: plano.para,
        },
        { status: 409 }
      );
    }
    return Response.json(
      { error: mensagemErroViagem(plano.erro, current.veiculo.status), code: plano.erro },
      { status: 400 }
    );
  }

  // Viagem e veículo na mesma transação: sem isso, uma falha no meio deixa
  // o veículo "em_uso" sem viagem em andamento (ou o contrário).
  const viagem = await prisma.$transaction(async (tx) => {
    await tx.viagem.update({ where: { id }, data: plano.viagem });

    // Veículo soft-deletado (status="inativo") nunca volta sozinho — guard
    // de I/O via updateMany, pra não reativar inativos sem ação explícita.
    if (plano.veiculo) {
      await tx.veiculo.updateMany({
        where: { id: current.veiculoId, status: { not: "inativo" } },
        data: plano.veiculo,
      });
    }

    return tx.viagem.findUnique({
      where: { id },
      include: {
        veiculo: true,
        motorista: true,
        motorista2: true,
        unidade: true,
      },
    });
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "viagem",
    recursoId: id,
    dados: { status: patch.status, ...plano.viagem, veiculo: plano.veiculo },
  });

  return Response.json(viagem);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

  const viagem = await prisma.viagem.findUnique({ where: { id } });
  if (!viagem) {
    return Response.json({ error: "Viagem não encontrada" }, { status: 404 });
  }

  if (viagem.status === "em_andamento") {
    return Response.json(
      { error: "Não é possível excluir uma viagem em andamento" },
      { status: 400 }
    );
  }

  await prisma.viagem.delete({ where: { id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "viagem",
    recursoId: id,
    dados: viagem,
  });

  return Response.json({ ok: true });
}
