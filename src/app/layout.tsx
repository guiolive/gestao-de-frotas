import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Next 14 não inclui Geist em next/font/google (adicionado no Next 15).
// Usando Inter (sans-serif similar, sempre disponível).
const interSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestão de Frotas",
  description: "Sistema de gestão de frotas de veículos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${interSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
