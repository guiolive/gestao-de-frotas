import { z } from "zod";

/**
 * Helper to validate request body against a Zod schema.
 * Returns [data, null] on success or [null, errorResponse] on failure.
 *
 * Usage in a route handler:
 *   const [data, err] = await validateBody(request, veiculoCreateSchema);
 *   if (err) return err;
 *   // data is fully typed and validated
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<[T, null] | [null, Response]> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return [
      null,
      Response.json({ error: "JSON inválido no body da requisição." }, { status: 400 }),
    ];
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return [
      null,
      Response.json({ error: "Dados inválidos", issues }, { status: 400 }),
    ];
  }

  return [result.data, null];
}

// ─────────────────────────────────────────────────────────
// Schemas comuns
// ─────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();

export const veiculoCreateSchema = z.object({
  placa: z
    .string()
    .trim()
    .min(7, "Placa deve ter no mínimo 7 caracteres")
    .max(8, "Placa deve ter no máximo 8 caracteres")
    .regex(/^[A-Z0-9-]+$/i, "Placa contém caracteres inválidos")
    .transform((s) => s.toUpperCase()),
  modelo: z.string().trim().min(1).max(100),
  marca: z.string().trim().min(1).max(100),
  ano: z.coerce
    .number()
    .int()
    .min(1900, "Ano inválido")
    .max(currentYear + 1, "Ano no futuro"),
  cor: z.string().trim().min(1).max(50),
  quilometragem: z.coerce.number().nonnegative().default(0),
  valorVeiculo: z.coerce.number().nonnegative().optional().nullable(),
  tipo: z.enum(["carro", "van", "caminhao", "onibus"]),
  status: z
    .enum(["disponivel", "em_uso", "manutencao", "inativo"])
    .default("disponivel"),
});

export const veiculoUpdateSchema = veiculoCreateSchema.partial();

export const motoristaCreateSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  cpf: z
    .string()
    .trim()
    .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  cnh: z.string().trim().min(5).max(20),
  categoriaCnh: z.enum(["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"]),
  telefone: z.string().trim().min(8).max(20),
  email: z.string().trim().email("E-mail inválido").max(200),
  status: z.enum(["ativo", "inativo", "suspenso"]).default("ativo"),
});

export const motoristaUpdateSchema = motoristaCreateSchema.partial();

export const unidadeCreateSchema = z.object({
  sigla: z
    .string()
    .trim()
    .min(1, "Sigla é obrigatória")
    .max(20)
    .transform((s) => s.toUpperCase()),
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  ativo: z.boolean().default(true),
});

export const unidadeUpdateSchema = unidadeCreateSchema.partial();

export const viagemCreateSchema = z.object({
  veiculoId: z.string().min(1),
  motoristaId: z.string().min(1),
  origem: z.string().trim().min(1).max(200),
  destino: z.string().trim().min(1).max(200),
  dataSaida: z.coerce.date(),
  dataRetorno: z.coerce.date().optional().nullable(),
  kmInicial: z.coerce.number().nonnegative(),
  kmFinal: z.coerce.number().nonnegative().optional().nullable(),
  status: z
    .enum(["agendada", "em_andamento", "concluida", "cancelada"])
    .default("agendada"),
  observacoes: z.string().max(2000).optional().nullable(),
  processoSei: z.string().max(100).optional().nullable(),
  unidadeId: z.string().optional().nullable(),
  ufDestino: z.string().length(2).optional().nullable(),
  diaria: z.coerce.number().nonnegative().optional().nullable(),
  solicitante: z.string().max(200).optional().nullable(),
  motorista2Id: z.string().optional().nullable(),
  kmPorTrecho: z.coerce.number().nonnegative().optional().nullable(),
  qtdDiarias: z.coerce.number().nonnegative().optional().nullable(),
  pcdpNumero: z.string().max(100).optional().nullable(),
  pcdpData: z.string().max(20).optional().nullable(),
  pcdpValor: z.coerce.number().nonnegative().optional().nullable(),
  pcdp2Solicitante: z.string().max(200).optional().nullable(),
  pcdp2Numero: z.string().max(100).optional().nullable(),
  pcdp2Data: z.string().max(20).optional().nullable(),
  pcdp2Valor: z.coerce.number().nonnegative().optional().nullable(),
  totalDiarias: z.coerce.number().nonnegative().optional().nullable(),
});

export const viagemUpdateSchema = viagemCreateSchema.partial();

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
  senha: z.string().min(1, "Senha é obrigatória").max(200),
});

export const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1).max(200),
  novaSenha: z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres").max(200),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
});

export const resetarSenhaSchema = z.object({
  token: z.string().min(32, "Token inválido").max(200),
  novaSenha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(200),
});
