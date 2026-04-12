import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Permite testar o dev server via Tailscale (IP do Mac na tailnet).
  // Aceito só em dev — produção não usa esse campo.
  allowedDevOrigins: ["100.87.247.76"],
};

export default nextConfig;
