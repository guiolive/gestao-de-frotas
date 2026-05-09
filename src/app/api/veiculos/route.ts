import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { validateBody, veiculoCreateSchema } from "@/lib/validation";
import { requireAuth, requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const incluirInativos = searchParams.get("incluirInativos") === "true";

  // Filtro padrão pós soft-delete: oculta veículos com status="inativo".
  // Se ?status=X explícito, respeita. Se ?incluirInativos=true, mostra todos.
  let where: { status?: string | { not: string } } | undefined;
  if (status) {
    where = { status };
  } else if (!incluirInativos) {
    where = { status: { not: "inativo" } };
  }

  const veiculos = await prisma.veiculo.findMany({
    where,
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
  if (data.renavam) {
    const r = await prisma.veiculo.findUnique({ where: { renavam: data.renavam } });
    if (r) return Response.json({ error: "Já existe um veículo com esse Renavam." }, { status: 409 });
  }
  if (data.chassi) {
    const c = await prisma.veiculo.findUnique({ where: { chassi: data.chassi } });
    if (c) return Response.json({ error: "Já existe um veículo com esse chassi." }, { status: 409 });
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
