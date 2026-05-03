// @ts-check
const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` em `style-src` é pragmaticamente necessário porque o
 * Next injeta tags de estilo inline (`<style data-n-...>`) pra otimizações de
 * crítico CSS e Tailwind.
 *
 * Em dev a CSP fica completamente aberta pra não quebrar HMR.
 */
// CSP de produção. `'unsafe-inline'` em script-src é necessário porque o
// Next 14 App Router injeta scripts inline pra hidratação (boot do React,
// passing de RSC payload, etc.). O ideal a longo prazo é gerar um nonce
// dinâmico no middleware e usar `'strict-dynamic'` — ver doc oficial:
// https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
// Pra essa fase de piloto, `'unsafe-inline'` resolve sem reescrever o
// pipeline de auth/middleware.
const cspProd = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // HSTS — só tem efeito em HTTPS. Em dev (HTTP/localhost) o browser ignora.
  // max-age 2 anos + includeSubDomains + preload
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Desabilita APIs de browser que o app não usa — reduz superfície
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // CSP só em prod
  ...(isProd
    ? [
        {
          key: "Content-Security-Policy",
          value: cspProd,
        },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `standalone` gera `.next/standalone/` com TUDO que o server precisa
  // (incluindo `node_modules` trimmed). É o formato que o Dockerfile
  // multi-stage copia — imagem final fica ~150MB em vez de ~1GB.
  output: "standalone",
  // Remove header `X-Powered-By: Next.js` (evita fingerprinting)
  poweredByHeader: false,
  experimental: {
    // Pacotes que são NATIVE modules (.node) ou puro Node — webpack não consegue
    // bundleizá-los. Esses ficam externos (require() em runtime no servidor).
    serverComponentsExternalPackages: [
      "@node-rs/argon2",
      "@prisma/client",
      "@prisma/adapter-pg",
      "pino",
      "pino-pretty",
    ],
  },
  async headers() {
    return [
      {
        // Aplica a tudo. Routes /api/* também pegam, o que é OK.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
