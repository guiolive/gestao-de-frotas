import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, motoristaCreateSchema } from "@/lib/validation";

export async function GET() {
  const motoristas = await prisma.motorista.findMany({
    orderBy: { criadoEm: "desc" },
  });
  return Response.json(motoristas);
}

export async function POST(request: NextRequest) {
  const [data, err] = await validateBody(request, motoristaCreateSchema);
  if (err) return err;

  // CPF somente dígitos (remove formatação)
  const cpfLimpo = data.cpf.replace(/\D/g, "");

  // Unicidade
  const conflito = await prisma.motorista.findFirst({
    where: { OR: [{ cpf: cpfLimpo }, { cnh: data.cnh }] },
  });
  if (conflito) {
    return Response.json(
      { error: "CPF ou CNH já cadastrado." },
      { status: 409 }
    );
  }

  const motorista = await prisma.motorista.create({
    data: { ...data, cpf: cpfLimpo },
  });

  return Response.json(motorista, { status: 201 });
}
