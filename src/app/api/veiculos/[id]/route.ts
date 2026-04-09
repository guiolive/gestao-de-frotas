import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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

  return Response.json(veiculo);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.veiculo.delete({ where: { id } });

  return Response.json({ ok: true });
}
