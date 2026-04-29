import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const body = await request.json();

  // Fetch current manutencao
  const current = await prisma.manutencao.findUnique({
    where: { id },
    include: { veiculo: true },
  });

  if (!current) {
    return Response.json({ error: "Manutenção não encontrada" }, { status: 404 });
  }

  // Build basic update data
  const data: Record<string, unknown> = {};
  if (body.tipo !== undefined) data.tipo = body.tipo;
  if (body.descricao !== undefined) data.descricao = body.descricao;
  if (body.dataEntrada !== undefined) data.dataEntrada = new Date(body.dataEntrada);
  if (body.previsaoSaida !== undefined) data.previsaoSaida = body.previsaoSaida ? new Date(body.previsaoSaida) : null;
  if (body.previsaoDias !== undefined) data.previsaoDias = Number(body.previsaoDias) || 0;
  if (body.custoEstimado !== undefined) data.custoEstimado = body.custoEstimado ? Number(body.custoEstimado) : null;
  if (body.status !== undefined) data.status = body.status;

  // Rastreio Prime (terceirizada) — campos manuais até integração com webservice
  if (body.oficinaId !== undefined) {
    const v = body.oficinaId;
    data.oficinaId = typeof v === "string" && v.trim() !== "" ? v : null;
  }
  if (body.enviadaPrimeEm !== undefined) {
    data.enviadaPrimeEm = body.enviadaPrimeEm ? new Date(body.enviadaPrimeEm) : null;
  }
  if (body.retornoEfetivoEm !== undefined) {
    data.retornoEfetivoEm = body.retornoEfetivoEm ? new Date(body.retornoEfetivoEm) : null;
  }

  // If itens provided, recalculate valorTotal
  if (body.itens !== undefined) {
    const valorTotal = (body.itens as { valor: number }[]).reduce(
      (acc, item) => acc + (Number(item.valor) || 0),
      0
    );
    data.valorTotal = valorTotal > 0 ? valorTotal : null;
  }

  // Update manutencao (re-fetched below com checklist/itens atualizados)
  await prisma.manutencao.update({
    where: { id },
    data,
  });

  // If checklist provided: delete all existing and create new
  if (body.checklist !== undefined) {
    await prisma.checklistItem.deleteMany({ where: { manutencaoId: id } });
    if (body.checklist.length > 0) {
      await prisma.checklistItem.createMany({
        data: (body.checklist as { categoria: string; temProblema: boolean; descricao?: string }[]).map(
          (item) => ({
            manutencaoId: id,
            categoria: item.categoria,
            temProblema: item.temProblema,
            descricao: item.descricao || null,
          })
        ),
      });
    }
  }

  // If itens provided: delete all existing and create new
  if (body.itens !== undefined) {
    await prisma.itemManutencao.deleteMany({ where: { manutencaoId: id } });
    if (body.itens.length > 0) {
      await prisma.itemManutencao.createMany({
        data: (body.itens as { servico: string; valor: number; observacao?: string }[]).map(
          (item) => ({
            manutencaoId: id,
            servico: item.servico,
            valor: Number(item.valor) || 0,
            observacao: item.observacao || null,
          })
        ),
      });
    }
  }

  // Business rules for vehicle status based on manutencao status
  if (body.status === "concluida" || body.status === "cancelada") {
    await prisma.veiculo.update({
      where: { id: current.veiculoId },
      data: { status: "disponivel" },
    });
  } else if (body.status === "aguardando" || body.status === "em_andamento") {
    await prisma.veiculo.update({
      where: { id: current.veiculoId },
      data: { status: "manutencao" },
    });
  }

  // Re-fetch with updated relations
  const updated = await prisma.manutencao.findUnique({
    where: { id },
    include: { veiculo: true, checklist: true, itens: true },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "manutencao",
    recursoId: id,
    dados: { status: body.status, ...data },
  });

  return Response.json(updated);
}
