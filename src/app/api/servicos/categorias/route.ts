import { NextRequest } from "next/server";
import { listarTodasCategorias } from "@/lib/servicos-manutencao";
import { requireAuth } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  return Response.json(listarTodasCategorias());
}
