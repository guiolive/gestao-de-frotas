import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Magic bytes (file signatures) para validar o conteúdo real, não o header HTTP
function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

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

  // Confirmar veículo existe
  const veiculo = await prisma.veiculo.findUnique({ where: { id } });
  if (!veiculo) {
    return Response.json({ error: "Veículo não encontrado." }, { status: 404 });
  }

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

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return Response.json({ error: "Arquivo vazio." }, { status: 400 });
  }

  // Validar MIME declarado
  if (!ALLOWED_MIME_TYPES[file.type]) {
    return Response.json(
      { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WEBP." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Validar magic bytes (conteúdo real do arquivo)
  const realMime = detectMimeFromBuffer(buffer);
  if (!realMime || realMime !== file.type) {
    return Response.json(
      { error: "Conteúdo do arquivo não corresponde à extensão declarada." },
      { status: 400 }
    );
  }

  // Extensão derivada do MIME validado (NÃO do nome original)
  const ext = ALLOWED_MIME_TYPES[realMime];
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

  // WHERE com ambos os IDs previne IDOR
  const deleted = await prisma.imagemVeiculo.deleteMany({
    where: { id: imagemId, veiculoId: id },
  });

  if (deleted.count === 0) {
    return Response.json(
      { error: "Imagem não encontrada para este veículo." },
      { status: 404 }
    );
  }

  return Response.json({ ok: true });
}
