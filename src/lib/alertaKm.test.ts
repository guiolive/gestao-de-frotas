import { describe, it, expect } from "vitest";
import {
  calcularAlertaKm,
  kmMedioPorDia,
  proximoAlerta,
  labelTipoAlerta,
  TIPOS_ALERTA,
  alertaKmTipoEnum,
} from "./alertaKm";

const base = { intervaloKm: 10_000, ultimaTrocaKm: 50_000, alertaAntesDe: 1_000 };
const hoje = new Date("2026-09-04T12:00:00Z");

describe("calcularAlertaKm — status", () => {
  it("ok quando falta mais que alertaAntesDe", () => {
    const r = calcularAlertaKm(base, 58_999);
    expect(r).toMatchObject({ kmProxima: 60_000, kmRestante: 1_001, status: "ok" });
  });

  it("alerta exatamente na fronteira alertaAntesDe", () => {
    expect(calcularAlertaKm(base, 59_000).status).toBe("alerta");
  });

  it("alerta dentro da janela", () => {
    expect(calcularAlertaKm(base, 59_500).status).toBe("alerta");
  });

  it("vencido exatamente em kmProxima (kmRestante = 0)", () => {
    const r = calcularAlertaKm(base, 60_000);
    expect(r.kmRestante).toBe(0);
    expect(r.status).toBe("vencido");
  });

  it("vencido além de kmProxima, com kmRestante negativo", () => {
    const r = calcularAlertaKm(base, 61_500);
    expect(r).toMatchObject({ kmRestante: -1_500, status: "vencido" });
  });

  it("alertaAntesDe = 0 nunca dá alerta, só ok ou vencido", () => {
    const a = { ...base, alertaAntesDe: 0 };
    expect(calcularAlertaKm(a, 59_999).status).toBe("ok");
    expect(calcularAlertaKm(a, 60_000).status).toBe("vencido");
  });
});

describe("calcularAlertaKm — projeção de data", () => {
  it("sem kmMedioDia não projeta", () => {
    const r = calcularAlertaKm(base, 55_000, { hoje });
    expect(r.diasEstimados).toBeNull();
    expect(r.dataEstimada).toBeNull();
  });

  it("kmMedioDia = 0 não projeta", () => {
    const r = calcularAlertaKm(base, 55_000, { kmMedioDia: 0, hoje });
    expect(r.dataEstimada).toBeNull();
  });

  it("projeta com ceil e a partir de hoje", () => {
    // 5000 km restantes / 33.3 km/dia = 150.15 -> 151 dias
    const r = calcularAlertaKm(base, 55_000, { kmMedioDia: 33.3, hoje });
    expect(r.diasEstimados).toBe(151);
    const esperado = new Date(hoje);
    esperado.setDate(esperado.getDate() + 151);
    expect(r.dataEstimada?.getTime()).toBe(esperado.getTime());
  });

  it("não muta o `hoje` recebido", () => {
    const h = new Date(hoje);
    calcularAlertaKm(base, 55_000, { kmMedioDia: 10, hoje: h });
    expect(h.getTime()).toBe(hoje.getTime());
  });

  it("vencido não projeta mesmo com kmMedioDia", () => {
    const r = calcularAlertaKm(base, 60_000, { kmMedioDia: 50, hoje });
    expect(r.dataEstimada).toBeNull();
  });
});

describe("kmMedioPorDia", () => {
  const dia = (n: number) => new Date(hoje.getTime() - n * 24 * 60 * 60 * 1000);

  it("0 com menos de 2 viagens com km", () => {
    expect(kmMedioPorDia([], hoje)).toBe(0);
    expect(kmMedioPorDia([{ kmInicial: 100, kmFinal: 200, dataSaida: dia(5) }], hoje)).toBe(0);
  });

  it("ignora viagens sem kmFinal", () => {
    const viagens = [
      { kmInicial: 100, kmFinal: 200, dataSaida: dia(10) },
      { kmInicial: 200, kmFinal: null, dataSaida: dia(5) },
    ];
    expect(kmMedioPorDia(viagens, hoje)).toBe(0);
  });

  it("divide o km total pelos dias desde a primeira viagem, sem arredondar", () => {
    const viagens = [
      { kmInicial: 100, kmFinal: 200, dataSaida: dia(3) }, // 100 km
      { kmInicial: 200, kmFinal: 250, dataSaida: dia(1) }, // 50 km
    ];
    expect(kmMedioPorDia(viagens, hoje)).toBe(150 / 3);
  });

  it("usa no mínimo 1 dia", () => {
    const viagens = [
      { kmInicial: 0, kmFinal: 10, dataSaida: hoje },
      { kmInicial: 10, kmFinal: 30, dataSaida: hoje },
    ];
    expect(kmMedioPorDia(viagens, hoje)).toBe(30);
  });

  it("aceita dataSaida como string ISO", () => {
    const viagens = [
      { kmInicial: 0, kmFinal: 20, dataSaida: dia(2).toISOString() },
      { kmInicial: 20, kmFinal: 40, dataSaida: dia(1).toISOString() },
    ];
    expect(kmMedioPorDia(viagens, hoje)).toBe(20);
  });
});

describe("proximoAlerta", () => {
  const oleo = { id: "oleo", tipo: "troca_oleo", intervaloKm: 10_000, ultimaTrocaKm: 50_000, alertaAntesDe: 1_000 };
  const pneus = { id: "pneus", tipo: "troca_pneus", intervaloKm: 40_000, ultimaTrocaKm: 30_000, alertaAntesDe: 2_000 };
  const correia = { id: "correia", tipo: "correia_dentada", intervaloKm: 60_000, ultimaTrocaKm: 0, alertaAntesDe: 5_000 };

  it("null sem alertas", () => {
    expect(proximoAlerta([], 55_000)).toBeNull();
  });

  it("sem vencidos, o de menor kmRestante", () => {
    // km 55.000: oleo falta 5.000, pneus 15.000, correia 5.000 -> empate; primeiro vence
    const r = proximoAlerta([pneus, oleo, correia], 55_000);
    expect(r?.id).toBe("oleo");
    expect(r?.status).toBe("ok");
  });

  it("vencido tem prioridade sobre os demais", () => {
    // km 61.000: oleo vencido (-1.000), pneus 9.000, correia -1.000
    const r = proximoAlerta([pneus, oleo], 61_000);
    expect(r?.id).toBe("oleo");
    expect(r?.status).toBe("vencido");
  });

  it("entre vencidos, o mais atrasado", () => {
    // km 71.000: oleo -11.000, pneus -1.000
    const r = proximoAlerta([pneus, oleo], 71_000);
    expect(r?.id).toBe("oleo");
    expect(r?.kmRestante).toBe(-11_000);
  });

  it("preserva os campos do alerta original", () => {
    const r = proximoAlerta([oleo], 55_000);
    expect(r).toMatchObject({ id: "oleo", tipo: "troca_oleo", kmProxima: 60_000 });
  });
});

describe("tipos e labels", () => {
  it("todo tipo do enum tem label e entra em TIPOS_ALERTA na mesma ordem", () => {
    expect(TIPOS_ALERTA.map((t) => t.value)).toEqual(alertaKmTipoEnum.options);
    for (const t of TIPOS_ALERTA) expect(t.label).not.toBe(t.value);
  });

  it("labelTipoAlerta devolve o código quando desconhecido", () => {
    expect(labelTipoAlerta("troca_oleo")).toBe("Troca de Óleo");
    expect(labelTipoAlerta("legado_x")).toBe("legado_x");
  });
});
