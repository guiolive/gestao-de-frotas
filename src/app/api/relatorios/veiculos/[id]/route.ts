import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");

  const veiculo = await prisma.veiculo.findUnique({
    where: { id },
    include: {
      manutencoes: { include: { itens: true } },
      viagens: true,
      alertasKm: true,
    },
  });

  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  // Custo total de manutencao
  const custoTotalManutencao = veiculo.manutencoes.reduce((acc, m) => {
    const custoItens = m.itens.reduce((a, i) => a + i.valor, 0);
    return acc + (custoItens > 0 ? custoItens : m.valorTotal || 0);
  }, 0);

  // Custo no periodo (filtrado)
  let custoNoPeriodo = custoTotalManutencao;
  if (dataInicio || dataFim) {
    const inicio = dataInicio ? new Date(dataInicio) : new Date("1970-01-01");
    const fim = dataFim ? new Date(dataFim) : new Date("2999-12-31");
    custoNoPeriodo = veiculo.manutencoes
      .filter((m) => m.dataEntrada >= inicio && m.dataEntrada <= fim)
      .reduce((acc, m) => {
        const custoItens = m.itens.reduce((a, i) => a + i.valor, 0);
        return acc + (custoItens > 0 ? custoItens : m.valorTotal || 0);
      }, 0);
  }

  // Percentual sobre valor do veiculo
  const percentualValor =
    veiculo.valorVeiculo && veiculo.valorVeiculo > 0
      ? (custoTotalManutencao / veiculo.valorVeiculo) * 100
      : null;

  // Dias parado
  const diasParado = veiculo.manutencoes.reduce(
    (acc, m) => acc + (m.previsaoDias || 0),
    0
  );

  // Proxima revisao (alerta mais proximo)
  const alertasAtivos = veiculo.alertasKm.filter((a) => a.ativo);
  let proximaRevisao = null;
  if (alertasAtivos.length > 0) {
    const kmAtual = veiculo.quilometragem;
    let menorDiff = Infinity;
    for (const alerta of alertasAtivos) {
      const kmProxima = alerta.ultimaTrocaKm + alerta.intervaloKm;
      const diff = kmProxima - kmAtual;
      if (diff < menorDiff) {
        menorDiff = diff;
        proximaRevisao = {
          tipo: alerta.tipo,
          kmFaltando: Math.max(0, diff),
          kmProxima,
        };
      }
    }
  }

  // Viagens
  const viagensConcluidas = veiculo.viagens.filter(
    (v) => v.status === "concluida"
  );
  const totalViagens = veiculo.viagens.length;
  const kmRodado = viagensConcluidas.reduce(
    (acc, v) => acc + ((v.kmFinal || 0) - v.kmInicial),
    0
  );

  // Historico manutencoes
  const historicoManutencoes = veiculo.manutencoes.map((m) => {
    const custoItens = m.itens.reduce((a, i) => a + i.valor, 0);
    return {
      id: m.id,
      tipo: m.tipo,
      descricao: m.descricao,
      dataEntrada: m.dataEntrada,
      status: m.status,
      custo: custoItens > 0 ? custoItens : m.valorTotal || 0,
      itens: m.itens,
    };
  });

  // Custos por mes
  const mesMap = new Map<string, number>();
  for (const m of historicoManutencoes) {
    const mes = new Date(m.dataEntrada).toISOString().slice(0, 7);
    mesMap.set(mes, (mesMap.get(mes) || 0) + m.custo);
  }
  const custosPorMes = Array.from(mesMap.entries())
    .map(([mes, custo]) => ({ mes, custo }))
    .sort((a, b) => a.mes.localeCompare(b.mes));

  return Response.json({
    veiculo: {
      id: veiculo.id,
      placa: veiculo.placa,
      modelo: veiculo.modelo,
      marca: veiculo.marca,
      ano: veiculo.ano,
      quilometragem: veiculo.quilometragem,
      valorVeiculo: veiculo.valorVeiculo,
    },
    custoTotalManutencao,
    custoNoPeriodo,
    percentualValor,
    diasParado,
    proximaRevisao,
    totalViagens,
    kmRodado,
    historicoManutencoes,
    custosPorMes,
  });
}
