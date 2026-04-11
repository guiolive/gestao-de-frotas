import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, veiculoCreateSchema } from "@/lib/validation";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

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
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const [data, err] = await validateBody(request, veiculoCreateSchema);
  if (err) return err;

  // Unicidade de placa
  const existente = await prisma.veiculo.findUnique({ where: { placa: data.placa } });
  if (existente) {
    return Response.json(
      { error: "Já existe um veículo com essa placa." },
      { status: 409 }
    );
  }

  const veiculo = await prisma.veiculo.create({ data });

  await logAudit({
    request,
    user,
    acao: "create",
    recurso: "veiculo",
    recursoId: veiculo.id,
    dados: veiculo,
  });

  return Response.json(veiculo, { status: 201 });
}
