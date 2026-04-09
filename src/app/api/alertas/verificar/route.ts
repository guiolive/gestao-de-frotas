import { prisma } from "@/lib/prisma";
import { enviarEmailAlerta } from "@/lib/email";

export async function POST() {
  const alertas = await prisma.alertaKm.findMany({
    where: { ativo: true },
    include: { veiculo: true },
  });

  const resultados = [];

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

      resultados.push({
        alertaId: alerta.id,
        veiculo: alerta.veiculo.placa,
        tipo: alerta.tipo,
        enviado: resultado.success,
      });
    }
  }

  return Response.json({
    verificados: alertas.length,
    alertasEnviados: resultados.length,
    detalhes: resultados,
  });
}
