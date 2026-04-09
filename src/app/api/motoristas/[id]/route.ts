import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const motorista = await prisma.motorista.findUnique({
    where: { id },
    include: { viagens: true },
  });

  if (!motorista) {
    return Response.json({ error: "Motorista não encontrado" }, { status: 404 });
  }

  return Response.json(motorista);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const motorista = await prisma.motorista.update({
    where: { id },
    data: {
      nome: body.nome,
      cpf: body.cpf,
      cnh: body.cnh,
      categoriaCnh: body.categoriaCnh,
      telefone: body.telefone,
      email: body.email,
      status: body.status,
    },
  });

  return Response.json(motorista);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.motorista.delete({ where: { id } });
  return Response.json({ ok: true });
}
