import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, manutencaoUpdateSchema } from "@/lib/validation";
import { planejarAtualizacao, STATUS_OS_ABERTOS } from "@/lib/manutencao";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;
  const manutencao = await prisma.manutencao.findUnique({
    where: { id },
    include: { veiculo: true, checklist: true, itens: true },
  });

  if (!manutencao) {
    return Response.json({ error: "Manutenção não encontrada" }, { status: 404 });
  }

  return Response.json(manutencao);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;

  const [data, valErr] = await validateBody(request, manutencaoUpdateSchema);
  if (valErr) return valErr;

  const current = await prisma.manutencao.findUnique({
    where: { id },
    select: { id: true, veiculoId: true, status: true, previsaoSaida: true },
  });
  if (!current) {
    return Response.json({ error: "Manutenção não encontrada" }, { status: 404 });
  }

  // Outras OS abertas do mesmo veículo: concluir/cancelar esta só libera o
  // veículo se não sobrar nenhuma.
  const outrasAbertas = await prisma.manutencao.count({
    where: {
      veiculoId: current.veiculoId,
      id: { not: id },
      status: { in: [...STATUS_OS_ABERTOS] },
    },
  });

  // Toda decisão (patch parcial, valorTotal, carimbo de previsão, transição
  // de status e efeito no veículo) é do módulo; aqui só I/O.
  const plano = planejarAtualizacao(current, data, { agora: new Date(), outrasAbertas });
  if (!plano.ok) {
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

  // Tudo dentro de uma única transação: update da manutenção, recriação
  // de checklist/itens (delete + createMany), e sincronização do status do
  // veículo. Sem $transaction, qualquer falha no meio deixa OS órfã ou
  // veículo com status divergente.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.manutencao.update({ where: { id }, data: plano.manutencao });

    if (plano.checklist !== undefined) {
      await tx.checklistItem.deleteMany({ where: { manutencaoId: id } });
      if (plano.checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: plano.checklist.map((c) => ({
            manutencaoId: id,
            categoria: c.categoria,
            temProblema: c.temProblema,
            descricao: c.descricao ?? null,
          })),
        });
      }
    }

    if (plano.itens !== undefined) {
      await tx.itemManutencao.deleteMany({ where: { manutencaoId: id } });
      if (plano.itens.length > 0) {
        await tx.itemManutencao.createMany({
          data: plano.itens.map((it) => ({
            manutencaoId: id,
            servico: it.servico,
            valor: it.valor,
            observacao: it.observacao ?? null,
            servicoRefId: it.servicoRefId ?? null,
            pecaId: it.pecaId ?? null,
          })),
        });
      }
    }

    // Veículo soft-deletado (status="inativo") nunca volta sozinho — guard
    // de I/O via updateMany, pra não reativar inativos sem ação explícita.
    if (plano.veiculo) {
      await tx.veiculo.updateMany({
        where: { id: current.veiculoId, status: { not: "inativo" } },
        data: { status: plano.veiculo },
      });
    }

    return tx.manutencao.findUnique({
      where: { id },
      include: { veiculo: true, checklist: true, itens: true },
    });
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "manutencao",
    recursoId: id,
    dados: { status: data.status, ...plano.manutencao, veiculo: plano.veiculo },
  });

  return Response.json(updated);
}
