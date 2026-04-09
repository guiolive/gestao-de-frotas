import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  const motoristas = await prisma.motorista.findMany({
    orderBy: { criadoEm: "desc" },
  });
  return Response.json(motoristas);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const motorista = await prisma.motorista.create({
    data: {
      nome: body.nome,
      cpf: body.cpf,
      cnh: body.cnh,
      categoriaCnh: body.categoriaCnh,
      telefone: body.telefone,
      email: body.email,
    },
  });

  return Response.json(motorista, { status: 201 });
}
