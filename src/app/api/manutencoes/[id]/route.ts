import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, manutencaoUpdateSchema } from "@/lib/validation";

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
    select: { id: true, veiculoId: true, previsaoSaida: true },
  });
  if (!current) {
    return Response.json({ error: "Manutenção não encontrada" }, { status: 404 });
  }

  // Patch parcial: só os campos enviados entram no update.
  const updateData: Record<string, unknown> = {};
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.dataEntrada !== undefined) updateData.dataEntrada = data.dataEntrada;
  if (data.previsaoDias !== undefined) updateData.previsaoDias = data.previsaoDias;
  if (data.custoEstimado !== undefined) updateData.custoEstimado = data.custoEstimado ?? null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.oficinaId !== undefined) updateData.oficinaId = data.oficinaId ?? null;
  if (data.enviadaPrimeEm !== undefined) updateData.enviadaPrimeEm = data.enviadaPrimeEm ?? null;
  if (data.retornoEfetivoEm !== undefined) updateData.retornoEfetivoEm = data.retornoEfetivoEm ?? null;

  if (data.previsaoSaida !== undefined) {
    const novaPrevisao = data.previsaoSaida ?? null;
    updateData.previsaoSaida = novaPrevisao;
    // Marca o timestamp da mudança quando o valor difere do atual — alimenta
    // o feed de "novidades da oficina" no painel de transporte.
    const atualMs = current.previsaoSaida ? new Date(current.previsaoSaida).getTime() : null;
    const novaMs = novaPrevisao ? novaPrevisao.getTime() : null;
    if (atualMs !== novaMs) {
      updateData.previsaoSaidaAtualizadaEm = new Date();
    }
  }

  if (data.itens !== undefined) {
    const valorTotal = data.itens.reduce((acc, it) => acc + (it.valor ?? 0), 0);
    updateData.valorTotal = valorTotal > 0 ? valorTotal : null;
  }

  // Tudo dentro de uma única transação: update da manutenção, recriação
  // de checklist/itens (delete + createMany), e sincronização do status do
  // veículo. Sem $transaction, qualquer falha no meio deixa OS órfã ou
  // veículo com status divergente.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.manutencao.update({ where: { id }, data: updateData });

    if (data.checklist !== undefined) {
      await tx.checklistItem.deleteMany({ where: { manutencaoId: id } });
      if (data.checklist.length > 0) {
        await tx.checklistItem.createMany({
          data: data.checklist.map((c) => ({
            manutencaoId: id,
            categoria: c.categoria,
            temProblema: c.temProblema,
            descricao: c.descricao ?? null,
          })),
        });
      }
    }

    if (data.itens !== undefined) {
      await tx.itemManutencao.deleteMany({ where: { manutencaoId: id } });
      if (data.itens.length > 0) {
        await tx.itemManutencao.createMany({
          data: data.itens.map((it) => ({
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

    // Regra de negócio: status da manutenção dita status do veículo.
    if (data.status === "concluida" || data.status === "cancelada") {
      await tx.veiculo.update({
        where: { id: current.veiculoId },
        data: { status: "disponivel" },
      });
    } else if (data.status === "aguardando" || data.status === "em_andamento") {
      await tx.veiculo.update({
        where: { id: current.veiculoId },
        data: { status: "manutencao" },
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
    dados: { status: data.status, ...updateData },
  });

  return Response.json(updated);
}
