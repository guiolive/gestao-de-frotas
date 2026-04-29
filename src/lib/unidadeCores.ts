/**
 * Cores das células da grade de agendamentos (uma cor por unidade
 * solicitante). Mapa fixo para as siglas que aparecem na planilha
 * histórica + fallback determinístico por hash da sigla para unidades
 * novas. Classes Tailwind para que o JIT mantenha tudo no bundle.
 *
 * As classes são listadas explicitamente abaixo (e não construídas como
 * `bg-${cor}-500`) porque o JIT do Tailwind só inclui no CSS final as
 * classes que existem como string literal no código.
 */

export type CorUnidade = { bg: string; fg: string; ring: string };

// Tons -100 (fundo bem claro) + texto -800 (alto contraste). Mais
// próximo do visual de planilha do que cores chapadas e saturadas.
const PALETAS: CorUnidade[] = [
  { bg: "bg-purple-100", fg: "text-purple-800", ring: "ring-purple-200" },
  { bg: "bg-blue-100", fg: "text-blue-800", ring: "ring-blue-200" },
  { bg: "bg-emerald-100", fg: "text-emerald-800", ring: "ring-emerald-200" },
  { bg: "bg-amber-100", fg: "text-amber-800", ring: "ring-amber-200" },
  { bg: "bg-rose-100", fg: "text-rose-800", ring: "ring-rose-200" },
  { bg: "bg-cyan-100", fg: "text-cyan-800", ring: "ring-cyan-200" },
  { bg: "bg-indigo-100", fg: "text-indigo-800", ring: "ring-indigo-200" },
  { bg: "bg-teal-100", fg: "text-teal-800", ring: "ring-teal-200" },
  { bg: "bg-pink-100", fg: "text-pink-800", ring: "ring-pink-200" },
  { bg: "bg-orange-100", fg: "text-orange-800", ring: "ring-orange-200" },
  { bg: "bg-lime-100", fg: "text-lime-800", ring: "ring-lime-200" },
  { bg: "bg-fuchsia-100", fg: "text-fuchsia-800", ring: "ring-fuchsia-200" },
];

// Mapa fixo das siglas que aparecem na planilha original — assim a cor
// permanece estável ainda que a paleta cresça depois.
const FIXAS: Record<string, CorUnidade> = {
  DASS: PALETAS[0],
  EVZ: PALETAS[1],
  FIRM: PALETAS[2],
  ICB: PALETAS[3],
  SEINFRA: PALETAS[4],
  PRAE: PALETAS[5],
  IESA: PALETAS[6],
  IV: PALETAS[7],
  EA: PALETAS[8],
  SECOM: PALETAS[9],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function corParaSigla(sigla: string | null | undefined): CorUnidade {
  if (!sigla) return { bg: "bg-gray-100", fg: "text-gray-700", ring: "ring-gray-200" };
  const upper = sigla.toUpperCase();
  if (FIXAS[upper]) return FIXAS[upper];
  return PALETAS[hash(upper) % PALETAS.length];
}
