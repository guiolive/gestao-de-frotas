import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const where: Record<string, unknown> = {};
  if (dataInicio || dataFim) {
    const dataEntrada: Record<string, Date> = {};
    if (dataInicio) dataEntrada.gte = new Date(dataInicio);
    if (dataFim) dataEntrada.lte = new Date(dataFim);
    where.dataEntrada = dataEntrada;
  }

  const manutencoes = await prisma.manutencao.findMany({
    where,
    include: {
      itens: true,
      veiculo: true,
    },
  });

  // Calculate cost per maintenance
  const custosPorManutencao = manutencoes.map((m) => {
    const custoItens = m.itens.reduce((acc, i) => acc + i.valor, 0);
    const custo = custoItens > 0 ? custoItens : m.valorTotal || 0;
    return { ...m, custo };
  });

  const custoTotal = custosPorManutencao.reduce((acc, m) => acc + m.custo, 0);

  // Custos por veiculo
  const veiculoMap = new Map<
    string,
    {
      veiculoId: string;
      placa: string;
      modelo: string;
      marca: string;
      custoTotal: number;
      qtdManutencoes: number;
    }
  >();

  for (const m of custosPorManutencao) {
    const entry = veiculoMap.get(m.veiculoId) || {
      veiculoId: m.veiculoId,
      placa: m.veiculo.placa,
      modelo: m.veiculo.modelo,
      marca: m.veiculo.marca,
      custoTotal: 0,
      qtdManutencoes: 0,
    };
    entry.custoTotal += m.custo;
    entry.qtdManutencoes += 1;
    veiculoMap.set(m.veiculoId, entry);
  }

  const custosPorVeiculo = Array.from(veiculoMap.values()).sort(
    (a, b) => b.custoTotal - a.custoTotal
  );

  // Custos por mes
  const mesMap = new Map<string, number>();
  for (const m of custosPorManutencao) {
    const mes = m.dataEntrada.toISOString().slice(0, 7);
    mesMap.set(mes, (mesMap.get(mes) || 0) + m.custo);
  }
  const custosPorMes = Array.from(mesMap.entries())
    .map(([mes, custo]) => ({ mes, custo }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  // Veiculo mais caro
  const veiculoMaisCaro =
    custosPorVeiculo.length > 0
      ? {
          placa: custosPorVeiculo[0].placa,
          modelo: custosPorVeiculo[0].modelo,
          custo: custosPorVeiculo[0].custoTotal,
        }
      : null;

  // Media
  const veiculosComCusto = custosPorVeiculo.filter((v) => v.custoTotal > 0);
  const mediaCustoPorVeiculo =
    veiculosComCusto.length > 0 ? custoTotal / veiculosComCusto.length : 0;

  return Response.json({
    custoTotal,
    custosPorVeiculo,
    custosPorMes,
    veiculoMaisCaro,
    mediaCustoPorVeiculo,
    totalManutencoes: manutencoes.length,
  });
}
