import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { requireTipo } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { validateBody, veiculoUpdateSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
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
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;
  const [data, err] = await validateBody(request, veiculoUpdateSchema);
  if (err) return err;

  // Unicidade — só checa quando o campo está sendo enviado e tem valor.
  if (data.renavam) {
    const existente = await prisma.veiculo.findUnique({
      where: { renavam: data.renavam },
    });
    if (existente && existente.id !== id) {
      return Response.json(
        { error: "Já existe um veículo com esse Renavam" },
        { status: 409 }
      );
    }
  }
  if (data.chassi) {
    const existente = await prisma.veiculo.findUnique({
      where: { chassi: data.chassi },
    });
    if (existente && existente.id !== id) {
      return Response.json(
        { error: "Já existe um veículo com esse chassi" },
        { status: 409 }
      );
    }
  }

  // O update schema é `.partial()` — só os campos enviados entram no `data`.
  // Strings vazias não passam aqui (form converte para null antes de enviar).
  const veiculo = await prisma.veiculo.update({ where: { id }, data });

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
  { params }: { params: { id: string } }
) {
  const [user, authErr] = requireTipo(request, ["ADMINISTRADOR"]);
  if (authErr) return authErr;

  const { id } = params;

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
