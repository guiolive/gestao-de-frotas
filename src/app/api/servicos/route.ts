import { NextRequest } from "next/server";
import {
  buscarServicos,
  CATEGORIAS_SERVICOS,
  listarServicosPorCategoria,
} from "@/lib/servicos-manutencao";
import { requireAuth } from "@/lib/authz";

export async function GET(request: NextRequest) {
  const [, authErr] = requireAuth(request);
  if (authErr) return authErr;

  const { searchParams } = request.nextUrl;
  const termo = searchParams.get("q");
  const categoria = searchParams.get("categoria");

  if (termo) {
    return Response.json(buscarServicos(termo));
  }

  if (categoria) {
    const servicos = listarServicosPorCategoria(categoria);
    return Response.json(
      servicos.map((servico) => ({ categoria, servico }))
    );
  }

  // Retorna tudo como lista plana {categoria, servico}[]
  const todos: { categoria: string; servico: string }[] = [];
  for (const [cat, servicos] of Object.entries(CATEGORIAS_SERVICOS)) {
    for (const servico of servicos) {
      todos.push({ categoria: cat, servico });
    }
  }

  return Response.json(todos);
}
