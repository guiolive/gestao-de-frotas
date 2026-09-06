import { describe, it, expect } from "vitest";
import {
  transicaoPermitida,
  transicoesDe,
  viagemAberta,
  calcularTotalDiarias,
  validarPcdp,
  validarKm,
  validarNovaViagem,
  dadosCriacao,
  planejarAtualizacao,
  type ViagemAtual,
} from "./viagem";
import { viagemCreateSchema, viagemUpdateSchema } from "./validation";

const agora = new Date("2026-09-05T12:00:00Z");

const base: ViagemAtual = {
  status: "agendada",
  kmInicial: 1000,
  kmFinal: null,
  dataRetorno: null,
  diaria: null,
  qtdDiarias: null,
  pcdpNumero: null,
  totalDiarias: null,
};

const veiculoEmUso = { status: "em_uso", quilometragem: 1000 };
const veiculoDisponivel = { status: "disponivel", quilometragem: 1000 };

describe("máquina de estados", () => {
  it("segue agendada → em_andamento → concluida", () => {
    expect(transicaoPermitida("agendada", "em_andamento")).toBe(true);
    expect(transicaoPermitida("em_andamento", "concluida")).toBe(true);
  });

  it("permite concluir direto de agendada (registro retroativo)", () => {
    expect(transicaoPermitida("agendada", "concluida")).toBe(true);
  });

  it("cancela a partir de qualquer status aberto", () => {
    expect(transicaoPermitida("agendada", "cancelada")).toBe(true);
    expect(transicaoPermitida("em_andamento", "cancelada")).toBe(true);
  });

  it("não reabre terminal nem volta etapa", () => {
    expect(transicaoPermitida("concluida", "em_andamento")).toBe(false);
    expect(transicaoPermitida("cancelada", "agendada")).toBe(false);
    expect(transicaoPermitida("concluida", "cancelada")).toBe(false);
    expect(transicaoPermitida("em_andamento", "agendada")).toBe(false);
  });

  it("mesmo status é permitido; desconhecido só aceita a si mesmo", () => {
    expect(transicaoPermitida("concluida", "concluida")).toBe(true);
    expect(transicaoPermitida("legado", "em_andamento")).toBe(false);
  });

  it("transicoesDe lista o atual mais as saídas permitidas", () => {
    expect(transicoesDe("agendada")).toEqual(["agendada", "em_andamento", "concluida", "cancelada"]);
    expect(transicoesDe("em_andamento")).toEqual(["em_andamento", "concluida", "cancelada"]);
    expect(transicoesDe("concluida")).toEqual(["concluida"]);
    expect(transicoesDe("legado")).toEqual(["legado"]);
  });

  it("viagemAberta", () => {
    expect(viagemAberta("agendada")).toBe(true);
    expect(viagemAberta("em_andamento")).toBe(true);
    expect(viagemAberta("concluida")).toBe(false);
    expect(viagemAberta("cancelada")).toBe(false);
  });
});

describe("diárias e PCDP", () => {
  it("total = diária × quantidade quando os dois existem", () => {
    expect(calcularTotalDiarias(150, 3)).toBe(450);
    expect(calcularTotalDiarias(150, 3, 999)).toBe(450);
  });

  it("sem os dois, usa o valor informado ou null", () => {
    expect(calcularTotalDiarias(150, null, 80)).toBe(80);
    expect(calcularTotalDiarias(null, 2)).toBeNull();
    expect(calcularTotalDiarias(0, 2, undefined)).toBeNull();
  });

  it("PCDP obrigatória só quando há diárias", () => {
    expect(validarPcdp({ diaria: 150, qtdDiarias: 2, pcdpNumero: null })).toEqual({
      ok: false,
      erro: "pcdp_obrigatorio",
    });
    expect(validarPcdp({ diaria: 150, qtdDiarias: 2, pcdpNumero: "  " }).ok).toBe(false);
    expect(validarPcdp({ diaria: 150, qtdDiarias: 2, pcdpNumero: "PCDP-1" }).ok).toBe(true);
    expect(validarPcdp({ diaria: 150, qtdDiarias: null, pcdpNumero: null }).ok).toBe(true);
    expect(validarPcdp({}).ok).toBe(true);
  });
});

describe("km", () => {
  it("kmFinal é opcional", () => {
    expect(validarKm({ kmInicial: 100 }).ok).toBe(true);
    expect(validarKm({ kmInicial: 100, kmFinal: null }).ok).toBe(true);
  });

  it("rejeita kmFinal menor que kmInicial; igual passa", () => {
    expect(validarKm({ kmInicial: 100, kmFinal: 99 })).toEqual({ ok: false, erro: "km_final_menor" });
    expect(validarKm({ kmInicial: 100, kmFinal: 100 }).ok).toBe(true);
  });
});

describe("criação", () => {
  const input = viagemCreateSchema.parse({
    veiculoId: "v1",
    motoristaId: "m1",
    origem: "Goiânia",
    destino: "Brasília",
    dataSaida: "2026-09-10T08:00",
    kmInicial: "1000",
    diaria: "150",
    qtdDiarias: "2",
    pcdpNumero: "PCDP-1",
    observacoes: null,
  });

  it("recusa veículo em OS ou baixado", () => {
    expect(validarNovaViagem(input, "manutencao")).toEqual({ ok: false, erro: "veiculo_indisponivel" });
    expect(validarNovaViagem(input, "inativo")).toEqual({ ok: false, erro: "veiculo_indisponivel" });
    expect(validarNovaViagem(input, "disponivel").ok).toBe(true);
    expect(validarNovaViagem(input, "em_uso").ok).toBe(true);
  });

  it("aplica PCDP e km na criação", () => {
    expect(validarNovaViagem({ ...input, pcdpNumero: null }, "disponivel")).toEqual({
      ok: false,
      erro: "pcdp_obrigatorio",
    });
    expect(validarNovaViagem({ ...input, kmFinal: 10 }, "disponivel")).toEqual({
      ok: false,
      erro: "km_final_menor",
    });
  });

  it("dadosCriacao nasce agendada, normaliza nulos e deriva o total", () => {
    const d = dadosCriacao(input);
    expect(d.status).toBe("agendada");
    expect(d.totalDiarias).toBe(300);
    expect(d.kmInicial).toBe(1000);
    expect(d.dataSaida).toBeInstanceOf(Date);
    expect(d.observacoes).toBeNull();
    expect("unidadeId" in d).toBe(false);
  });

  it("schema de criação ignora status enviado pelo cliente", () => {
    const d = dadosCriacao(viagemCreateSchema.parse({ ...input, status: "concluida" }));
    expect(d.status).toBe("agendada");
  });
});

describe("schema de update", () => {
  it("null em campo obrigatório dá erro, não 0 nem 1970", () => {
    expect(viagemUpdateSchema.safeParse({ kmInicial: null }).success).toBe(false);
    expect(viagemUpdateSchema.safeParse({ dataSaida: null }).success).toBe(false);
    expect(viagemUpdateSchema.safeParse({ origem: null }).success).toBe(false);
  });

  it("null em campo opcional limpa o campo", () => {
    const r = viagemUpdateSchema.parse({ kmFinal: null, dataRetorno: null, observacoes: null });
    expect(r).toEqual({ kmFinal: null, dataRetorno: null, observacoes: null });
  });

  it("status fora do enum é recusado", () => {
    expect(viagemUpdateSchema.safeParse({ status: "finalizada" }).success).toBe(false);
  });
});

describe("planejarAtualizacao", () => {
  it("patch parcial: só os campos enviados, null normalizado", () => {
    const r = planejarAtualizacao(base, { observacoes: "ok", kmFinal: null }, { agora, veiculo: veiculoEmUso });
    expect(r).toEqual({ ok: true, viagem: { observacoes: "ok", kmFinal: null }, veiculo: null });
  });

  it("reenviar o mesmo status não tem efeito no veículo (form manda tudo)", () => {
    const atual = { ...base, status: "concluida", kmFinal: 1500 };
    const r = planejarAtualizacao(
      atual,
      { status: "concluida", kmFinal: 1500, observacoes: "editada depois" },
      { agora, veiculo: { status: "em_uso", quilometragem: 3000 } }
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.veiculo).toBeNull();
    expect(r.viagem.dataRetorno).toBeUndefined();
  });

  it("transição inválida é recusada", () => {
    const r = planejarAtualizacao(
      { ...base, status: "concluida" },
      { status: "em_andamento" },
      { agora, veiculo: veiculoDisponivel }
    );
    expect(r).toEqual({ ok: false, erro: "transicao_invalida", de: "concluida", para: "em_andamento" });
  });

  it("iniciar põe o veículo em uso", () => {
    const r = planejarAtualizacao(base, { status: "em_andamento" }, { agora, veiculo: veiculoDisponivel });
    expect(r).toEqual({ ok: true, viagem: { status: "em_andamento" }, veiculo: { status: "em_uso" } });
  });

  it("concluir libera o veículo só se está em uso", () => {
    const emAndamento = { ...base, status: "em_andamento" };
    const a = planejarAtualizacao(emAndamento, { status: "concluida" }, { agora, veiculo: veiculoEmUso });
    expect(a.ok && a.veiculo).toEqual({ status: "disponivel" });

    const b = planejarAtualizacao(
      emAndamento,
      { status: "concluida" },
      { agora, veiculo: { status: "manutencao", quilometragem: 1000 } }
    );
    expect(b.ok && b.veiculo).toBeNull();
  });

  it("concluir avança o odômetro, nunca abaixa", () => {
    const emAndamento = { ...base, status: "em_andamento" };
    const sobe = planejarAtualizacao(
      emAndamento,
      { status: "concluida", kmFinal: 1500 },
      { agora, veiculo: { status: "em_uso", quilometragem: 1200 } }
    );
    expect(sobe.ok && sobe.veiculo).toEqual({ status: "disponivel", quilometragem: 1500 });

    const naoAbaixa = planejarAtualizacao(
      emAndamento,
      { status: "concluida", kmFinal: 1500 },
      { agora, veiculo: { status: "em_uso", quilometragem: 2000 } }
    );
    expect(naoAbaixa.ok && naoAbaixa.veiculo).toEqual({ status: "disponivel" });
  });

  it("concluir usa o kmFinal já gravado quando o patch não manda", () => {
    const r = planejarAtualizacao(
      { ...base, status: "em_andamento", kmFinal: 1300 },
      { status: "concluida" },
      { agora, veiculo: { status: "em_uso", quilometragem: 1000 } }
    );
    expect(r.ok && r.veiculo).toEqual({ status: "disponivel", quilometragem: 1300 });
  });

  it("concluir carimba dataRetorno se não houver", () => {
    const sem = planejarAtualizacao(base, { status: "concluida" }, { agora, veiculo: veiculoDisponivel });
    expect(sem.ok && sem.viagem.dataRetorno).toBe(agora);

    const jaTem = planejarAtualizacao(
      { ...base, dataRetorno: new Date("2026-09-01T00:00:00Z") },
      { status: "concluida" },
      { agora, veiculo: veiculoDisponivel }
    );
    expect(jaTem.ok && jaTem.viagem.dataRetorno).toBeUndefined();

    const noPatch = planejarAtualizacao(
      base,
      { status: "concluida", dataRetorno: new Date("2026-09-04T00:00:00Z") },
      { agora, veiculo: veiculoDisponivel }
    );
    expect(noPatch.ok && noPatch.viagem.dataRetorno).toEqual(new Date("2026-09-04T00:00:00Z"));
  });

  it("agendada → concluida direto com veículo disponível não toca no veículo sem km", () => {
    const r = planejarAtualizacao(base, { status: "concluida" }, { agora, veiculo: veiculoDisponivel });
    expect(r.ok && r.veiculo).toBeNull();
  });

  it("cancelar libera só se em uso e nunca mexe no odômetro", () => {
    const a = planejarAtualizacao(
      { ...base, status: "em_andamento", kmFinal: 5000 },
      { status: "cancelada" },
      { agora, veiculo: veiculoEmUso }
    );
    expect(a.ok && a.veiculo).toEqual({ status: "disponivel" });

    const b = planejarAtualizacao(base, { status: "cancelada" }, { agora, veiculo: veiculoDisponivel });
    expect(b.ok && b.veiculo).toBeNull();
  });

  it("valida PCDP e km sobre o estado resultante (atual + patch)", () => {
    const comDiarias = { ...base, diaria: 150, qtdDiarias: 2, pcdpNumero: "PCDP-1" };
    expect(planejarAtualizacao(comDiarias, { pcdpNumero: null }, { agora, veiculo: veiculoEmUso })).toEqual({
      ok: false,
      erro: "pcdp_obrigatorio",
    });
    expect(planejarAtualizacao(base, { diaria: 100, qtdDiarias: 1 }, { agora, veiculo: veiculoEmUso })).toEqual({
      ok: false,
      erro: "pcdp_obrigatorio",
    });
    expect(planejarAtualizacao(base, { kmFinal: 900 }, { agora, veiculo: veiculoEmUso })).toEqual({
      ok: false,
      erro: "km_final_menor",
    });
    expect(
      planejarAtualizacao({ ...base, kmFinal: 1200 }, { kmInicial: 1300 }, { agora, veiculo: veiculoEmUso })
    ).toEqual({ ok: false, erro: "km_final_menor" });
  });

  it("recalcula totalDiarias quando diária, quantidade ou total mudam", () => {
    const r = planejarAtualizacao(
      { ...base, pcdpNumero: "PCDP-1" },
      { diaria: 150, qtdDiarias: 2, totalDiarias: 999 },
      { agora, veiculo: veiculoEmUso }
    );
    expect(r.ok && r.viagem.totalDiarias).toBe(300);

    const soTotal = planejarAtualizacao(base, { totalDiarias: 80 }, { agora, veiculo: veiculoEmUso });
    expect(soTotal.ok && soTotal.viagem.totalDiarias).toBe(80);

    const zera = planejarAtualizacao(
      { ...base, diaria: 150, qtdDiarias: 2, totalDiarias: 300, pcdpNumero: "P" },
      { qtdDiarias: null, totalDiarias: null },
      { agora, veiculo: veiculoEmUso }
    );
    expect(zera.ok && zera.viagem.totalDiarias).toBeNull();
  });
});
