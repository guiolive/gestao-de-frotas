/**
 * Paginação simples por offset (page/limit).
 *
 * Padrão de uso em route handlers:
 *
 *   const { skip, take, page, limit } = parsePagination(request);
 *   const [items, total] = await Promise.all([
 *     prisma.viagem.findMany({ skip, take, ... }),
 *     prisma.viagem.count({ where }),
 *   ]);
 *   return Response.json(paginated(items, total, page, limit));
 *
 * Mantém compat com clientes antigos: quando `?page` não vem, retorna
 * o array bruto (resposta legada). Quando vem, retorna { items, page,
 * limit, total, totalPages }.
 */

import type { NextRequest } from "next/server";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
  take: number;
  /** True quando o cliente passou ?page= ou ?limit= explicitamente. */
  paginationRequested: boolean;
};

export function parsePagination(request: NextRequest): PaginationParams {
  const { searchParams } = request.nextUrl;
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");
  const paginationRequested = pageRaw !== null || limitRaw !== null;

  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = Math.max(
    1,
    Math.min(MAX_LIMIT, Number(limitRaw) || DEFAULT_LIMIT)
  );
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    paginationRequested,
  };
}

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
