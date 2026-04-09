import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const manutencoes = await prisma.manutencao.findMany({
    orderBy: { criadoEm: "desc" },
    include: { veiculo: true, checklist: true, itens: true },
  });
  return Response.json(manutencoes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate required fields
  const required = ["veiculoId", "tipo", "descricao", "dataEntrada"];
  for (const field of required) {
    if (!body[field]) {
      return Response.json(
        { error: `Campo obrigatório: ${field}` },
        { status: 400 }
      );
    }
  }

  // Calculate total from itens
  const itens = body.itens || [];
  const valorTotal = itens.reduce(
    (acc: number, item: { valor: number }) => acc + (Number(item.valor) || 0),
    0
  );

  // Transaction-like flow: create manutencao with checklist and itens, then update vehicle
  const manutencao = await prisma.manutencao.create({
    data: {
      veiculoId: body.veiculoId,
      tipo: body.tipo,
      descricao: body.descricao,
      dataEntrada: new Date(body.dataEntrada),
      previsaoSaida: body.previsaoSaida ? new Date(body.previsaoSaida) : null,
      previsaoDias: Number(body.previsaoDias) || 0,
      custoEstimado: body.custoEstimado ? Number(body.custoEstimado) : null,
      valorTotal: valorTotal > 0 ? valorTotal : null,
      checklist: {
        create: (body.checklist || []).map(
          (item: { categoria: string; temProblema: boolean; descricao?: string }) => ({
            categoria: item.categoria,
            temProblema: item.temProblema,
            descricao: item.descricao || null,
          })
        ),
      },
      itens: {
        create: itens.map(
          (item: { servico: string; valor: number; observacao?: string }) => ({
            servico: item.servico,
            valor: Number(item.valor) || 0,
            observacao: item.observacao || null,
          })
        ),
      },
    },
    include: { checklist: true, itens: true },
  });

  // Update vehicle status to manutencao
  await prisma.veiculo.update({
    where: { id: body.veiculoId },
    data: { status: "manutencao" },
  });

  return Response.json(manutencao, { status: 201 });
}
