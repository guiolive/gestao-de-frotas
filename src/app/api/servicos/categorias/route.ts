import { listarTodasCategorias } from "@/lib/servicos-manutencao";

export async function GET() {
  return Response.json(listarTodasCategorias());
}
