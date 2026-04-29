import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, agendamentoCreateSchema } from "@/lib/validation";
import { inicioDoMes, fimDoMes } from "@/lib/calendario";

/**
 * GET /api/agendamentos
 *
 * Query params:
 *   - ano, mes: filtra agendamentos cujo intervalo cruza o mês indicado
 *     (default: mês corrente). Combina sobreposição com o intervalo
 *     [00:00 dia 1, 23:59 último dia].
 *   - status: filtra por status (ex.: lista_espera, cancelado).
 *
 * `lista_espera` aparece independente de mês — quem quer ver fila usa
 * `?status=lista_espera` sem ano/mes (devolve todas).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const anoParam = url.searchParams.get("ano");
  const mesParam = url.searchParams.get("mes");

  const where: Record<string, unknown> = {};

  if (statusParam) {
    where.status = statusParam;
  }

  // Filtro por mês só se ano+mes vierem juntos. Lista de espera ignora mês.
  if (anoParam && mesParam && statusParam !== "lista_espera") {
    const ano = Number(anoParam);
    const mes = Number(mesParam);
    if (
      Number.isFinite(ano) &&
      Number.isFinite(mes) &&
      mes >= 1 &&
      mes <= 12
    ) {
      const inicio = inicioDoMes(ano, mes);
      const fim = fimDoMes(ano, mes);
      where.AND = [
        { dataInicio: { lte: fim } },
        { dataFim: { gte: inicio } },
      ];
    }
  }

  const agendamentos = await prisma.agendamento.findMany({
    where,
    orderBy: { dataInicio: "asc" },
    include: { veiculo: true, unidade: true },
  });

  return Response.json(agendamentos);
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, agendamentoCreateSchema);
  if (err) return err;

  // Lista de espera não dispara conflito (pode haver várias para o mesmo
  // veículo/data — é justamente o ponto de uma fila de espera).
  if (data.status !== "lista_espera") {
    const conflito = await prisma.agendamento.findFirst({
      where: {
        veiculoId: data.veiculoId,
        status: { in: ["aprovado", "pendente"] }, // pendente p/ legados
        AND: [
          { dataInicio: { lt: data.dataFim } },
          { dataFim: { gt: data.dataInicio } },
        ],
      },
      include: { unidade: true },
    });

    if (conflito) {
      const sigla = conflito.unidade?.sigla ?? conflito.solicitante;
      return Response.json(
        {
          error: `Conflito de horário: este veículo já está agendado neste período (${sigla}).`,
          conflitoId: conflito.id,
        },
        { status: 409 }
      );
    }
  }

  // Resgata sigla da unidade pra preencher `solicitante` (retrocompat) e
  // garante que a unidade existe.
  const unidade = await prisma.unidade.findUnique({
    where: { id: data.unidadeId },
  });
  if (!unidade) {
    return Response.json(
      { error: "Unidade solicitante não encontrada." },
      { status: 400 }
    );
  }

  const agendamento = await prisma.agendamento.create({
    data: {
      veiculoId: data.veiculoId,
      unidadeId: data.unidadeId,
      solicitante: unidade.sigla, // retrocompat — campo legado
      motivo: data.motivo,
      observacao: data.observacao ?? null,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      status: data.status,
    },
    include: { veiculo: true, unidade: true },
  });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "agendamento",
    recursoId: agendamento.id,
    dados: agendamento,
  });

  return Response.json(agendamento, { status: 201 });
}
