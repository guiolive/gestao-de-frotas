import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const imagens = await prisma.imagemVeiculo.findMany({
    where: { veiculoId: id },
    orderBy: { criadoEm: "desc" },
  });
  return Response.json(imagens);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verificar limite de 5 fotos
  const count = await prisma.imagemVeiculo.count({ where: { veiculoId: id } });
  if (count >= 5) {
    return Response.json(
      { error: "Limite de 5 imagens por veículo atingido." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const descricao = formData.get("descricao") as string | null;

  if (!file) {
    return Response.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "veiculos");
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  const url = `/uploads/veiculos/${fileName}`;

  const imagem = await prisma.imagemVeiculo.create({
    data: {
      veiculoId: id,
      url,
      descricao: descricao || null,
    },
  });

  return Response.json(imagem, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const imagemId = searchParams.get("imagemId");

  if (!imagemId) {
    return Response.json({ error: "imagemId é obrigatório" }, { status: 400 });
  }

  await prisma.imagemVeiculo.delete({
    where: { id: imagemId, veiculoId: id },
  });

  return Response.json({ ok: true });
}
