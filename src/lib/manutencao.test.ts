import { describe, it, expect } from "vitest";
import {
  transicaoPermitida,
  osAberta,
  custoDaOS,
  valorTotalDosItens,
  prazoDaOS,
  situacaoPrime,
  validarAberturaOS,
  planejarAtualizacao,
} from "./manutencao";

const hoje = new Date("2026-09-04T12:00:00Z");
const dias = (n: number) => new Date(hoje.getTime() + n * 24 * 60 * 60 * 1000);

describe("máquina de estados", () => {
  it("segue aguardando → em_andamento → concluida", () => {
    expect(transicaoPermitida("aguardando", "em_andamento")).toBe(true);
    expect(transicaoPermitida("em_andamento", "concluida")).toBe(true);
  });

  it("não pula etapa nem reabre terminal", () => {
    expect(transicaoPermitida("aguardando", "concluida")).toBe(false);
    expect(transicaoPermitida("concluida", "em_andamento")).toBe(false);
    expect(transicaoPermitida("cancelada", "aguardando")).toBe(false);
    expect(transicaoPermitida("concluida", "cancelada")).toBe(false);
  });

  it("cancela a partir de qualquer status aberto", () => {
    expect(transicaoPermitida("aguardando", "cancelada")).toBe(true);
    expect(transicaoPermitida("em_andamento", "cancelada")).toBe(true);
  });

  it("mesmo status é permitido; status desconhecido só aceita a si mesmo", () => {
    expect(transicaoPermitida("concluida", "concluida")).toBe(true);
    expect(transicaoPermitida("legado", "em_andamento")).toBe(false);
  });

  it("osAberta", () => {
    expect(osAberta("aguardando")).toBe(true);
    expect(osAberta("em_andamento")).toBe(true);
    expect(osAberta("concluida")).toBe(false);
    expect(osAberta("cancelada")).toBe(false);
  });
});

describe("custo", () => {
  it("soma os itens quando existem", () => {
    expect(custoDaOS({ itens: [{ valor: 100 }, { valor: 50.5 }], valorTotal: 999 })).toBe(150.5);
  });

  it("cai no valorTotal quando não há itens com valor (OS legada)", () => {
    expect(custoDaOS({ itens: [], valorTotal: 320 })).toBe(320);
    expect(custoDaOS({ itens: [{ valor: 0 }], valorTotal: 320 })).toBe(320);
  });

  it("zero sem itens e sem valorTotal", () => {
    expect(custoDaOS({ itens: [] })).toBe(0);
    expect(custoDaOS({ itens: [], valorTotal: null })).toBe(0);
  });

  it("valorTotalDosItens persiste null quando a soma é zero", () => {
    expect(valorTotalDosItens([])).toBeNull();
    expect(valorTotalDosItens([{ valor: 0 }, { valor: null }])).toBeNull();
    expect(valorTotalDosItens([{ valor: 10 }, { valor: 5 }])).toBe(15);
  });
});

describe("prazoDaOS", () => {
  it("sem previsão: sem dias, não atrasada", () => {
    expect(prazoDaOS({ status: "aguardando", previsaoSaida: null }, hoje)).toEqual({
      diasRestantes: null,
      atrasada: false,
    });
  });

  it("previsão futura: dias positivos, não atrasada", () => {
    const r = prazoDaOS({ status: "em_andamento", previsaoSaida: dias(3) }, hoje);
    expect(r).toEqual({ diasRestantes: 3, atrasada: false });
  });

  it("previsão passada em OS aberta: dias negativos, atrasada", () => {
    const r = prazoDaOS({ status: "em_andamento", previsaoSaida: dias(-2) }, hoje);
    expect(r).toEqual({ diasRestantes: -2, atrasada: true });
  });

  it("previsão passada em OS concluída não conta como atraso", () => {
    const r = prazoDaOS({ status: "concluida", previsaoSaida: dias(-2) }, hoje);
    expect(r.atrasada).toBe(false);
    expect(r.diasRestantes).toBe(-2);
  });

  it("aceita string ISO", () => {
    expect(prazoDaOS({ status: "aguardando", previsaoSaida: dias(1).toISOString() }, hoje).diasRestantes).toBe(1);
  });
});

describe("situacaoPrime", () => {
  it("não enviada", () => {
    expect(situacaoPrime({ enviadaPrimeEm: null, retornoEfetivoEm: null, previsaoSaida: dias(-5) }, hoje)).toEqual({
      enviada: false,
      retornou: false,
      emAtraso: false,
      diasAtraso: 0,
    });
  });

  it("enviada, sem retorno, previsão passada → em atraso com dias", () => {
    const r = situacaoPrime({ enviadaPrimeEm: dias(-10), retornoEfetivoEm: null, previsaoSaida: dias(-4) }, hoje);
    expect(r).toEqual({ enviada: true, retornou: false, emAtraso: true, diasAtraso: 4 });
  });

  it("enviada, sem retorno, previsão futura → no prazo", () => {
    const r = situacaoPrime({ enviadaPrimeEm: dias(-1), retornoEfetivoEm: null, previsaoSaida: dias(2) }, hoje);
    expect(r.emAtraso).toBe(false);
    expect(r.diasAtraso).toBe(0);
  });

  it("enviada sem previsão nunca está em atraso", () => {
    expect(situacaoPrime({ enviadaPrimeEm: dias(-30), retornoEfetivoEm: null, previsaoSaida: null }, hoje).emAtraso).toBe(false);
  });

  it("retornou encerra o atraso", () => {
    const r = situacaoPrime({ enviadaPrimeEm: dias(-10), retornoEfetivoEm: dias(-1), previsaoSaida: dias(-4) }, hoje);
    expect(r).toMatchObject({ retornou: true, emAtraso: false, diasAtraso: 0 });
  });
});

describe("validarAberturaOS", () => {
  it("recusa veículo inativo", () => {
    expect(validarAberturaOS("inativo")).toEqual({ ok: false, erro: "veiculo_inativo" });
  });
  it("aceita os demais", () => {
    for (const s of ["disponivel", "em_uso", "manutencao"]) expect(validarAberturaOS(s).ok).toBe(true);
  });
});

describe("planejarAtualizacao", () => {
  const atual = { status: "em_andamento", previsaoSaida: dias(2) };
  const ctx = { agora: hoje, outrasAbertas: 0 };

  it("patch vazio não grava nada nem toca o veículo", () => {
    const p = planejarAtualizacao(atual, {}, ctx);
    expect(p).toEqual({ ok: true, manutencao: {}, veiculo: null });
  });

  it("só os campos enviados entram; null vira null", () => {
    const p = planejarAtualizacao(atual, { descricao: "troca", custoEstimado: null, oficinaId: null }, ctx);
    expect(p.ok && p.manutencao).toEqual({ descricao: "troca", custoEstimado: null, oficinaId: null });
  });

  it("itens derivam valorTotal e são repassados", () => {
    const itens = [{ servico: "óleo", valor: 80 }, { servico: "filtro", valor: 20 }];
    const p = planejarAtualizacao(atual, { itens }, ctx);
    expect(p.ok && p.manutencao.valorTotal).toBe(100);
    expect(p.ok && p.itens).toBe(itens);
  });

  it("itens vazios gravam valorTotal null", () => {
    const p = planejarAtualizacao(atual, { itens: [] }, ctx);
    expect(p.ok && p.manutencao.valorTotal).toBeNull();
  });

  it("checklist é repassado sem virar campo da OS", () => {
    const checklist = [{ categoria: "freios", temProblema: true }];
    const p = planejarAtualizacao(atual, { checklist }, ctx);
    expect(p.ok && p.checklist).toBe(checklist);
    expect(p.ok && "checklist" in p.manutencao).toBe(false);
  });

  it("previsão diferente carimba previsaoSaidaAtualizadaEm = agora", () => {
    const p = planejarAtualizacao(atual, { previsaoSaida: dias(5) }, ctx);
    expect(p.ok && p.manutencao.previsaoSaidaAtualizadaEm).toBe(hoje);
  });

  it("previsão igual não carimba", () => {
    const p = planejarAtualizacao(atual, { previsaoSaida: new Date(atual.previsaoSaida) }, ctx);
    expect(p.ok && "previsaoSaidaAtualizadaEm" in p.manutencao).toBe(false);
  });

  it("limpar previsão (null) carimba quando havia uma", () => {
    const p = planejarAtualizacao(atual, { previsaoSaida: null }, ctx);
    expect(p.ok && p.manutencao.previsaoSaida).toBeNull();
    expect(p.ok && p.manutencao.previsaoSaidaAtualizadaEm).toBe(hoje);
  });

  it("concluir sem outra OS aberta libera o veículo", () => {
    const p = planejarAtualizacao(atual, { status: "concluida" }, ctx);
    expect(p.ok && p.veiculo).toBe("disponivel");
    expect(p.ok && p.manutencao.status).toBe("concluida");
  });

  it("concluir com outra OS aberta não toca o veículo", () => {
    const p = planejarAtualizacao(atual, { status: "concluida" }, { ...ctx, outrasAbertas: 1 });
    expect(p.ok && p.veiculo).toBeNull();
  });

  it("cancelar segue a mesma regra de liberação", () => {
    expect(planejarAtualizacao({ status: "aguardando", previsaoSaida: null }, { status: "cancelada" }, ctx).ok && true).toBe(true);
    const p = planejarAtualizacao({ status: "aguardando", previsaoSaida: null }, { status: "cancelada" }, { ...ctx, outrasAbertas: 2 });
    expect(p.ok && p.veiculo).toBeNull();
  });

  it("iniciar põe o veículo em manutenção", () => {
    const p = planejarAtualizacao({ status: "aguardando", previsaoSaida: null }, { status: "em_andamento" }, ctx);
    expect(p.ok && p.veiculo).toBe("manutencao");
  });

  it("transição inválida devolve erro com de/para e não planeja nada", () => {
    const p = planejarAtualizacao({ status: "aguardando", previsaoSaida: null }, { status: "concluida", descricao: "x" }, ctx);
    expect(p).toEqual({ ok: false, erro: "transicao_invalida", de: "aguardando", para: "concluida" });
  });

  it("reabrir terminal é inválido", () => {
    const p = planejarAtualizacao({ status: "concluida", previsaoSaida: null }, { status: "em_andamento" }, ctx);
    expect(p.ok).toBe(false);
  });

  it("mesmo status reaplica o efeito no veículo (corrige drift)", () => {
    const p = planejarAtualizacao(atual, { status: "em_andamento" }, ctx);
    expect(p.ok && p.veiculo).toBe("manutencao");
  });
});
