import { prisma } from "@/lib/prisma";
import { enviarEmailAlerta, enviarEmailManutencao } from "@/lib/email";

export async function POST() {
  // 1. Check KM-based alerts
  const alertas = await prisma.alertaKm.findMany({
    where: { ativo: true },
    include: { veiculo: true },
  });

  const resultadosKm = [];

  for (const alerta of alertas) {
    const kmAtual = alerta.veiculo.quilometragem;
    const kmProximaTroca = alerta.ultimaTrocaKm + alerta.intervaloKm;
    const kmParaAlerta = kmProximaTroca - alerta.alertaAntesDe;

    if (kmAtual >= kmParaAlerta) {
      const resultado = await enviarEmailAlerta({
        para: alerta.emailGestor,
        veiculo: {
          placa: alerta.veiculo.placa,
          modelo: alerta.veiculo.modelo,
          marca: alerta.veiculo.marca,
          quilometragem: kmAtual,
        },
        tipoAlerta: alerta.tipo,
        intervaloKm: alerta.intervaloKm,
        kmProximaTroca,
      });

      resultadosKm.push({
        alertaId: alerta.id,
        veiculo: alerta.veiculo.placa,
        tipo: alerta.tipo,
        enviado: resultado.success,
      });
    }
  }

  // 2. Check overdue or near-deadline maintenance
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const manutencoesAtrasadas = await prisma.manutencao.findMany({
    where: {
      status: { in: ["aguardando", "em_andamento"] },
      previsaoSaida: { lte: amanha },
    },
    include: { veiculo: true },
  });

  const resultadosManut = [];
  const emailGestor = process.env.EMAIL_GESTOR_FROTA;

  if (emailGestor) {
    for (const m of manutencoesAtrasadas) {
      const previsao = m.previsaoSaida
        ? new Date(m.previsaoSaida).toLocaleDateString("pt-BR")
        : null;

      const isAtrasada = m.previsaoSaida && new Date(m.previsaoSaida) < hoje;
      const statusLabel = isAtrasada ? "ATRASADA" : m.status;

      const resultado = await enviarEmailManutencao({
        para: emailGestor,
        veiculo: {
          placa: m.veiculo.placa,
          modelo: m.veiculo.modelo,
          marca: m.veiculo.marca,
        },
        tipo: m.tipo,
        descricao: m.descricao,
        previsaoSaida: previsao,
        status: statusLabel,
      });

      resultadosManut.push({
        manutencaoId: m.id,
        veiculo: m.veiculo.placa,
        tipo: m.tipo,
        status: statusLabel,
        enviado: resultado.success,
      });
    }
  }

  return Response.json({
    km: {
      verificados: alertas.length,
      alertasEnviados: resultadosKm.length,
      detalhes: resultadosKm,
    },
    manutencao: {
      verificadas: manutencoesAtrasadas.length,
      alertasEnviados: resultadosManut.length,
      detalhes: resultadosManut,
    },
  });
}
