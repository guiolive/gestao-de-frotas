import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const veiculo = await prisma.veiculo.findUnique({
    where: { id },
    include: { viagens: true, agendamentos: true, manutencoes: true },
  });

  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  return Response.json(veiculo);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = await params;
  const body = await request.json();

  const veiculo = await prisma.veiculo.update({
    where: { id },
    data: {
      placa: body.placa,
      modelo: body.modelo,
      marca: body.marca,
      ano: body.ano ? Number(body.ano) : undefined,
      cor: body.cor,
      quilometragem: body.quilometragem
        ? Number(body.quilometragem)
        : undefined,
      tipo: body.tipo,
      status: body.status,
    },
  });

  await logAudit({
    request,
    user,
    acao: "update",
    recurso: "veiculo",
    recursoId: id,
    dados: veiculo,
  });

  return Response.json(veiculo);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = await params;

  // Snapshot pré-delete pra trilha (se sumir, ainda temos os dados)
  const snapshot = await prisma.veiculo.findUnique({ where: { id } });

  await prisma.veiculo.delete({ where: { id } });

  await logAudit({
    request,
    user,
    acao: "delete",
    recurso: "veiculo",
    recursoId: id,
    dados: snapshot,
  });

  return Response.json({ ok: true });
}
