import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireAuth, requireSetor } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, manutencaoCreateSchema } from "@/lib/validation";
import { parsePagination, paginated } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { skip, take, page, limit, paginationRequested } =
    parsePagination(request);

  const manutencoes = await prisma.manutencao.findMany({
    orderBy: { criadoEm: "desc" },
    skip,
    take,
    include: { veiculo: true, checklist: true, itens: true },
  });

  if (!paginationRequested) {
    return Response.json(manutencoes);
  }
  const total = await prisma.manutencao.count();
  return Response.json(paginated(manutencoes, total, page, limit));
}

export async function POST(request: NextRequest) {
  // Quem cria OS é gente do setor de Manutenção (CMAN, mecânicos) ou ADM.
  // Operadores do setor TRANSPORTE não devem poder forçar veículo a ficar
  // em manutenção.
  const [user, authErr] = requireSetor(request, ["MANUTENCAO"]);
  if (authErr) return authErr;

  const [data, valErr] = await validateBody(request, manutencaoCreateSchema);
  if (valErr) return valErr;

  const valorTotal = data.itens.reduce((acc, it) => acc + (it.valor ?? 0), 0);

  // Atomic: criar OS + checklist + itens E mudar status do veículo. Sem
  // transaction, um timeout no update do veículo deixa OS gravada com
  // veículo ainda "disponivel".
  const manutencao = await prisma.$transaction(async (tx) => {
    const m = await tx.manutencao.create({
      data: {
        veiculoId: data.veiculoId,
        oficinaId: data.oficinaId ?? null,
        tipo: data.tipo,
        descricao: data.descricao,
        dataEntrada: data.dataEntrada,
        previsaoSaida: data.previsaoSaida ?? null,
        previsaoDias: data.previsaoDias,
        custoEstimado: data.custoEstimado ?? null,
        valorTotal: valorTotal > 0 ? valorTotal : null,
        // OS sempre nasce como "pendente revisão CMAN" — representada
        // tecnicamente pelo enum "aguardando" no schema. Cliente NÃO pode
        // ditar o status inicial; transições posteriores (em_andamento,
        // concluida, cancelada) acontecem via PUT após a revisão.
        status: "aguardando",
        enviadaPrimeEm: data.enviadaPrimeEm ?? null,
        retornoEfetivoEm: data.retornoEfetivoEm ?? null,
        checklist: {
          create: data.checklist.map((c) => ({
            categoria: c.categoria,
            temProblema: c.temProblema,
            descricao: c.descricao ?? null,
          })),
        },
        itens: {
          create: data.itens.map((it) => ({
            servico: it.servico,
            valor: it.valor,
            observacao: it.observacao ?? null,
            servicoRefId: it.servicoRefId ?? null,
            pecaId: it.pecaId ?? null,
          })),
        },
      },
      include: { checklist: true, itens: true },
    });

    await tx.veiculo.update({
      where: { id: data.veiculoId },
      data: { status: "manutencao" },
    });

    return m;
  });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "manutencao",
    recursoId: manutencao.id,
    dados: manutencao,
  });

  return Response.json(manutencao, { status: 201 });
}
