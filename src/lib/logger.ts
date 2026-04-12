import pino from "pino";

/**
 * Logger estruturado (JSON em produção, pretty em dev).
 *
 * Uso:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ userId, route }, "login bem sucedido");
 *   logger.error({ err }, "falha ao enviar email");
 *
 * Campos sensíveis (`senha`, `token`, `tokenHash`, `authorization`) são
 * redactados automaticamente — mesmo que você logue um objeto inteiro por
 * acidente, segredos nunca vão pro stdout.
 *
 * Em Edge runtime (Next.js proxy), pino tem limitações e cai pra stub.
 * Este módulo é pra uso em Node runtime (route handlers `export const
 * runtime = "nodejs"`).
 */

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: {
    env: process.env.NODE_ENV ?? "development",
    // `service` ajuda a filtrar no agregador de logs quando tiver mais de
    // um serviço no mesmo backend
    service: "gestao-de-frota",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "senha",
      "senhaAtual",
      "novaSenha",
      "password",
      "token",
      "tokenHash",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "headers.authorization",
      "headers.cookie",
      "*.senha",
      "*.senhaAtual",
      "*.novaSenha",
      "*.token",
      "*.tokenHash",
    ],
    censor: "[REDACTED]",
  },
  // pino-pretty só em dev (JSON puro em prod fica melhor pra parsing)
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname,env,service",
          },
        },
      }),
});
