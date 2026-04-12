import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` em `style-src` é pragmaticamente necessário porque o
 * Next injeta tags de estilo inline (`<style data-n-...>`) pra otimizações de
 * crítico CSS e Tailwind. Substituir por nonce exige wiring manual no root
 * layout e quebra Server Components em alguns casos — fica pra depois se a
 * gente precisar de um A+ no Observatory.
 *
 * Em dev a CSP fica completamente aberta pra não quebrar HMR do Turbopack
 * (que usa websocket + inline scripts).
 */
const cspProd = [
  "default-src 'self'",
  "script-src 'self'",
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
  // max-age 2 anos + includeSubDomains + preload (pronto pra enviar ao hstspreload.org depois do deploy)
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
    // Desabilita APIs de browser que o app não usa — reduz superfície de
    // side-effects caso um script de terceiro seja comprometido
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  // CSP só em prod (ver nota acima)
  ...(isProd
    ? [
        {
          key: "Content-Security-Policy",
          value: cspProd,
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Permite testar o dev server via Tailscale (IP do Mac na tailnet).
  // Aceito só em dev — produção não usa esse campo.
  allowedDevOrigins: ["100.87.247.76"],
  // Remove header `X-Powered-By: Next.js` (evita fingerprinting)
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Aplica a tudo. Routes /api/* também pegam, o que é OK —
        // API JSON com headers de segurança não incomoda nenhum client.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
