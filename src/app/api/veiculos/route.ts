import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const veiculos = await prisma.veiculo.findMany({
    where: status ? { status } : undefined,
    orderBy: { criadoEm: "desc" },
  });

  return Response.json(veiculos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const veiculo = await prisma.veiculo.create({
    data: {
      placa: body.placa,
      modelo: body.modelo,
      marca: body.marca,
      ano: Number(body.ano),
      cor: body.cor,
      quilometragem: Number(body.quilometragem) || 0,
      tipo: body.tipo,
    },
  });

  return Response.json(veiculo, { status: 201 });
}
