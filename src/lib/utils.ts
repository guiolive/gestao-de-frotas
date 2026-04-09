export function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatarData(data: string | Date): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

export function formatarDataHora(data: string | Date): string {
  return new Date(data).toLocaleString("pt-BR");
}

export function formatarKm(km: number): string {
  return `${km.toLocaleString("pt-BR")} km`;
}

export function formatarPlaca(placa: string): string {
  if (!placa) return "";
  const p = placa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (p.length === 7) return `${p.slice(0, 3)}-${p.slice(3)}`;
  return placa;
}

export function formatarCPF(cpf: string): string {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11) return cpf;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

export function formatarTelefone(tel: string): string {
  const t = tel.replace(/\D/g, "");
  if (t.length === 11) return `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}`;
  if (t.length === 10) return `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;
  return tel;
}
