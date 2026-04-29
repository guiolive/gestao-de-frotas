import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { consultarFipe } from "@/lib/fipe";

/**
 * POST /api/veiculos/[id]/fipe — consulta a FIPE pelos dados atuais do veículo
 * e atualiza `valorFipe`, `fipeCodigo`, `fipeAtualizadoEm`.
 *
 * Falha com 422 se a FIPE não encontrar correspondência — nesse caso o admin
 * deve preencher `valorFipe` manualmente no form.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const veiculo = await prisma.veiculo.findUnique({ where: { id: params.id } });
  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  try {
    const resultado = await consultarFipe({
      tipo: veiculo.tipo,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
    });

    const atualizado = await prisma.veiculo.update({
      where: { id: veiculo.id },
      data: {
        valorFipe: resultado.valor,
        fipeCodigo: resultado.codigoFipe,
        fipeAtualizadoEm: new Date(),
      },
    });

    await logAudit({
      request,
      user,
      acao: "update",
      recurso: "veiculo_fipe",
      recursoId: veiculo.id,
      dados: { resultado, mesReferencia: resultado.mesReferencia },
    });

    return Response.json({
      ok: true,
      valorFipe: atualizado.valorFipe,
      fipeCodigo: atualizado.fipeCodigo,
      fipeAtualizadoEm: atualizado.fipeAtualizadoEm,
      detalhe: {
        marca: resultado.marcaFipe,
        modelo: resultado.modeloFipe,
        ano: resultado.anoFipe,
        combustivel: resultado.combustivelFipe,
        mesReferencia: resultado.mesReferencia,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha na consulta FIPE";
    return Response.json({ error: msg }, { status: 422 });
  }
}
