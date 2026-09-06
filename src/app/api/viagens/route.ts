import { prisma } from "@/lib/prisma";
import { STATUS_OS_ABERTOS } from "@/lib/manutencao";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { parsePagination, paginated } from "@/lib/pagination";
import { validateBody, viagemCreateSchema } from "@/lib/validation";
import {
  STATUS_VIAGEM_ABERTOS,
  validarNovaViagem,
  dadosCriacao,
  mensagemErroViagem,
} from "@/lib/viagem";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const veiculoId = searchParams.get("veiculoId");
  const motoristaId = searchParams.get("motoristaId");
  const unidadeId = searchParams.get("unidadeId");
  const ufDestino = searchParams.get("ufDestino");
  const q = searchParams.get("q")?.slice(0, 100);
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (status) where.status = status;
  if (veiculoId) where.veiculoId = veiculoId;
  if (motoristaId) where.motoristaId = motoristaId;
  if (unidadeId) where.unidadeId = unidadeId;
  if (ufDestino) where.ufDestino = ufDestino;

  // Date range filter on dataSaida
  if (dataInicio || dataFim) {
    where.dataSaida = {};
    if (dataInicio) where.dataSaida.gte = new Date(dataInicio);
    if (dataFim) where.dataSaida.lte = new Date(dataFim + "T23:59:59.999Z");
  }

  // Free-text search across destino, origem, solicitante, processoSei.
  // mode: insensitive pra Postgres não fazer case-sensitive (default no like).
  if (q) {
    where.OR = [
      { destino: { contains: q, mode: "insensitive" } },
      { origem: { contains: q, mode: "insensitive" } },
      { solicitante: { contains: q, mode: "insensitive" } },
      { processoSei: { contains: q, mode: "insensitive" } },
    ];
  }

  const { skip, take, page, limit, paginationRequested } =
    parsePagination(request);

  const viagens = await prisma.viagem.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    skip,
    take,
    include: {
      veiculo: true,
      motorista: true,
      motorista2: true,
      unidade: true,
    },
  });

  // Compat: cliente legado recebe só o array (cap em DEFAULT_LIMIT
  // continua valendo). Count só roda quando o cliente pediu paginação —
  // economiza uma query por request legada.
  if (!paginationRequested) {
    return Response.json(viagens);
  }
  const total = await prisma.viagem.count({ where });
  return Response.json(paginated(viagens, total, page, limit));
}

export async function POST(request: NextRequest) {
  const [user, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const [body, valErr] = await validateBody(request, viagemCreateSchema);
  if (valErr) return valErr;

  const veiculo = await prisma.veiculo.findUnique({
    where: { id: body.veiculoId },
    select: { status: true },
  });
  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  // Regras de negócio (veículo em OS/baixado, PCDP, km) são do módulo.
  const validacao = validarNovaViagem(body, veiculo.status);
  if (!validacao.ok) {
    return Response.json(
      { error: mensagemErroViagem(validacao.erro, veiculo.status), code: validacao.erro },
      { status: 400 }
    );
  }

  // Conflitos de agenda (viagem × viagem, viagem × OS) são I/O e ficam aqui.
  const dataSaida = body.dataSaida;
  const fimPeriodo = body.dataRetorno ?? dataSaida;
  const conflictingTrip = await prisma.viagem.findFirst({
    where: {
      veiculoId: body.veiculoId,
      status: { not: "cancelada" },
      dataSaida: { lte: fimPeriodo },
      OR: [
        { dataRetorno: null, status: { in: [...STATUS_VIAGEM_ABERTOS] } },
        { dataRetorno: { gte: dataSaida } },
      ],
    },
    include: { motorista: { select: { nome: true } } },
  });

  if (conflictingTrip) {
    return Response.json(
      {
        error: `Veículo já possui viagem ${conflictingTrip.status === "em_andamento" ? "em andamento" : "agendada"} para ${conflictingTrip.destino} (motorista: ${conflictingTrip.motorista.nome})`,
      },
      { status: 409 }
    );
  }

  const conflictingMaintenance = await prisma.manutencao.findFirst({
    where: {
      veiculoId: body.veiculoId,
      status: { in: [...STATUS_OS_ABERTOS] },
      dataEntrada: { lte: fimPeriodo },
      OR: [
        { previsaoSaida: null },
        { previsaoSaida: { gte: dataSaida } },
      ],
    },
  });

  if (conflictingMaintenance) {
    return Response.json(
      { error: "Veículo possui manutenção agendada ou em andamento no período" },
      { status: 409 }
    );
  }

  // Se a viagem foi originada em um agendamento, valida que ele existe e
  // bate com o veículo escolhido (proteção contra payload inconsistente).
  if (body.agendamentoId) {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id: body.agendamentoId },
    });
    if (!agendamento) {
      return Response.json(
        { error: "Agendamento informado não existe." },
        { status: 400 }
      );
    }
    if (agendamento.veiculoId !== body.veiculoId) {
      return Response.json(
        { error: "Agendamento é de outro veículo. Selecione novamente." },
        { status: 400 }
      );
    }
  }

  const viagem = await prisma.viagem.create({ data: dadosCriacao(body) });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "viagem",
    recursoId: viagem.id,
    dados: viagem,
  });

  return Response.json(viagem, { status: 201 });
}
