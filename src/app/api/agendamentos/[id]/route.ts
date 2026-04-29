import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, agendamentoUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
    include: { veiculo: true, unidade: true },
  });

  if (!agendamento) {
    return Response.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  return Response.json(agendamento);
}

/**
 * PATCH — atualização parcial. Quando muda datas/veículo e o status alvo
 * não é `lista_espera`, refaz o check de conflito ignorando o próprio
 * registro. Para mudar a unidade solicitante, atualiza também o
 * `solicitante` legado com a nova sigla.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { id } = params;
  const [data, err] = await validateBody(request, agendamentoUpdateSchema);
  if (err) return err;

  const atual = await prisma.agendamento.findUnique({ where: { id } });
  if (!atual) {
    return Response.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  // Datas finais (mescla). Validação cruzada se ambas presentes.
  const dataInicio = data.dataInicio ?? atual.dataInicio;
  const dataFim = data.dataFim ?? atual.dataFim;
  if (dataFim <= dataInicio) {
    return Response.json(
      { error: "Data fim deve ser posterior à data início" },
      { status: 400 }
    );
  }

  const veiculoId = data.veiculoId ?? atual.veiculoId;
  const statusAlvo = data.status ?? atual.status;

  // Conflito: qualquer agendamento aprovado (ou pendente legado) sobreposto
  // no mesmo veículo, exceto o próprio registro. Lista de espera/cancelado
  // não disparam.
  if (statusAlvo === "aprovado" || statusAlvo === "pendente") {
    const conflito = await prisma.agendamento.findFirst({
      where: {
        id: { not: id },
        veiculoId,
        status: { in: ["aprovado", "pendente"] },
        AND: [
          { dataInicio: { lt: dataFim } },
          { dataFim: { gt: dataInicio } },
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

  // Se trocou unidade, atualiza solicitante legado também.
  let novoSolicitante: string | undefined;
  if (data.unidadeId && data.unidadeId !== atual.unidadeId) {
    const unidade = await prisma.unidade.findUnique({
      where: { id: data.unidadeId },
    });
    if (!unidade) {
      return Response.json(
        { error: "Unidade solicitante não encontrada." },
        { status: 400 }
      );
    }
    novoSolicitante = unidade.sigla;
  }

  const agendamento = await prisma.agendamento.update({
    where: { id },
    data: {
      ...data,
      ...(novoSolicitante ? { solicitante: novoSolicitante } : {}),
    },
    include: { veiculo: true, unidade: true },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "agendamento",
    recursoId: id,
    dados: agendamento,
  });

  return Response.json(agendamento);
}

/**
 * DELETE — hard delete só para ADMINISTRADOR. Operadores devem usar
 * PATCH com status: "cancelado" para preservar histórico (por design,
 * igual ao comportamento das planilhas: a linha "Canceladas" não some).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;
  const snapshot = await prisma.agendamento.findUnique({ where: { id } });
  if (!snapshot) {
    return Response.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  await prisma.agendamento.delete({ where: { id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "agendamento",
    recursoId: id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
