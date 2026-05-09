/**
 * Popula o catálogo de Serviços e Peças com itens típicos de manutenção
 * preventiva e corretiva — calibrado pra frota mista da UFG (carros leves,
 * vans, caminhões e ônibus a diesel).
 *
 * Idempotente: usa upsert por `nome` (campo @unique). Roda quantas vezes
 * quiser — atualiza valorReferencia/descricao se já existir, cria se não.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx tsx scripts/seed-catalogo.ts
 *
 * Os `valorReferencia` são referências de mercado BR 2026 — sugestões pro
 * CMAN; o valor real cobrado fica em `ItemManutencao.valor` na OS.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

type ServicoSeed = {
  nome: string;
  descricao?: string;
  valorReferencia?: number;
};

type PecaSeed = {
  nome: string;
  codigo?: string;
  unidade?: string;
  valorReferencia?: number;
};

// ─────────────────────────────────────────────────────────────────────────
// SERVIÇOS — manutenção preventiva
// ─────────────────────────────────────────────────────────────────────────
const servicosPreventivos: ServicoSeed[] = [
  // Trocas periódicas
  { nome: "Troca de óleo motor (carro flex)", descricao: "Mão de obra para drenagem e abastecimento — óleo e filtro à parte", valorReferencia: 80 },
  { nome: "Troca de óleo motor (diesel leve)", descricao: "Hilux, Sprinter, Master, Daily — óleo e filtro à parte", valorReferencia: 120 },
  { nome: "Troca de óleo motor (caminhão/ônibus)", descricao: "Iveco Daily, OF 1519 — óleo e filtro à parte", valorReferencia: 180 },
  { nome: "Troca de óleo do câmbio manual", descricao: "Drenagem e reabastecimento", valorReferencia: 90 },
  { nome: "Troca de óleo do câmbio automático", descricao: "Inclui reset adaptativo quando aplicável", valorReferencia: 280 },
  { nome: "Troca de óleo do diferencial", descricao: "Veículos tração traseira/4x4", valorReferencia: 110 },
  { nome: "Troca do fluido de freio (DOT 4)", descricao: "Sangria completa do sistema", valorReferencia: 90 },
  { nome: "Troca do fluido da direção hidráulica", valorReferencia: 80 },
  { nome: "Troca do líquido de arrefecimento", descricao: "Drenagem, lavagem do circuito e reabastecimento", valorReferencia: 120 },

  // Revisões por quilometragem
  { nome: "Revisão dos 10.000 km", descricao: "Troca de óleo, filtro de óleo, inspeção visual", valorReferencia: 350 },
  { nome: "Revisão dos 20.000 km", descricao: "Óleo, filtro óleo, filtro ar, filtro cabine, inspeção freios", valorReferencia: 650 },
  { nome: "Revisão dos 30.000 km", descricao: "Inclui filtro de combustível e fluidos", valorReferencia: 850 },
  { nome: "Revisão dos 40.000 km", descricao: "Velas, fluido de freio, todos os filtros", valorReferencia: 1200 },
  { nome: "Revisão dos 50.000 km", valorReferencia: 1400 },
  { nome: "Revisão dos 60.000 km", descricao: "Inclui correia poli-V e tensores", valorReferencia: 1800 },
  { nome: "Revisão dos 80.000 km", valorReferencia: 1900 },
  { nome: "Revisão dos 100.000 km", descricao: "Correia dentada, bomba d'água, velas, todos os filtros", valorReferencia: 2800 },

  // Pneus / Geometria
  { nome: "Alinhamento de direção", valorReferencia: 90 },
  { nome: "Balanceamento de rodas (4 rodas)", valorReferencia: 100 },
  { nome: "Cambagem / geometria 3D", valorReferencia: 180 },
  { nome: "Rodízio de pneus", valorReferencia: 60 },
  { nome: "Montagem e desmontagem de pneu (unidade)", valorReferencia: 35 },
  { nome: "Calibragem de pneus com nitrogênio", valorReferencia: 40 },

  // Ar condicionado
  { nome: "Higienização do ar condicionado", descricao: "Limpeza do evaporador e troca do filtro de cabine", valorReferencia: 180 },
  { nome: "Recarga de gás do ar condicionado", descricao: "Gás R134a — sistema vazio", valorReferencia: 350 },
  { nome: "Diagnóstico de vazamento do A/C", valorReferencia: 150 },

  // Outros preventivos
  { nome: "Limpeza de bicos injetores (ultrassom)", valorReferencia: 280 },
  { nome: "Limpeza do corpo de borboleta", valorReferencia: 120 },
  { nome: "Inspeção de freios", descricao: "Medição de discos, pastilhas e lonas", valorReferencia: 60 },
  { nome: "Checklist visual completo", descricao: "Inspeção pré-viagem — fluidos, pneus, luzes, freios", valorReferencia: 50 },
  { nome: "Diagnóstico via scanner OBD-II", valorReferencia: 120 },
  { nome: "Lavagem do motor", valorReferencia: 80 },
  { nome: "Aplicação de aditivo no radiador", valorReferencia: 50 },
];

// ─────────────────────────────────────────────────────────────────────────
// SERVIÇOS — manutenção corretiva
// ─────────────────────────────────────────────────────────────────────────
const servicosCorretivos: ServicoSeed[] = [
  // Motor
  { nome: "Retífica completa do motor", descricao: "Cabeçote, bloco, virabrequim — varia muito por motor", valorReferencia: 6500 },
  { nome: "Troca da junta do cabeçote", valorReferencia: 1800 },
  { nome: "Troca da correia dentada", descricao: "Inclui tensor e bomba d'água quando combinado", valorReferencia: 600 },
  { nome: "Troca da correia poli-V (alternador)", valorReferencia: 250 },
  { nome: "Troca de velas de ignição", descricao: "Velas e mão de obra — não inclui cabos", valorReferencia: 150 },
  { nome: "Troca de cabos de vela e bobinas", valorReferencia: 220 },
  { nome: "Diagnóstico de superaquecimento", valorReferencia: 200 },

  // Transmissão / Embreagem
  { nome: "Troca do kit de embreagem (carro)", descricao: "Disco, platô, rolamento — peças à parte", valorReferencia: 1200 },
  { nome: "Troca do kit de embreagem (van/caminhão)", valorReferencia: 2500 },
  { nome: "Reparo da caixa de marchas manual", valorReferencia: 3500 },
  { nome: "Reparo do câmbio automático", valorReferencia: 5500 },
  { nome: "Troca do volante de motor (bimassa)", valorReferencia: 1500 },

  // Freios
  { nome: "Troca de pastilhas de freio dianteiras", valorReferencia: 180 },
  { nome: "Troca de pastilhas de freio traseiras", valorReferencia: 180 },
  { nome: "Troca de lonas de freio (tambor)", valorReferencia: 220 },
  { nome: "Troca de discos de freio (par)", valorReferencia: 280 },
  { nome: "Retífica de tambor/disco", valorReferencia: 140 },
  { nome: "Troca de cilindro mestre de freio", valorReferencia: 220 },
  { nome: "Troca de pinça de freio", valorReferencia: 280 },
  { nome: "Sangria do sistema de freios", valorReferencia: 80 },
  { nome: "Reparo do servo-freio (hidrovácuo)", valorReferencia: 450 },
  { nome: "Reparo do freio motor (caminhão/ônibus)", valorReferencia: 650 },

  // Suspensão e direção
  { nome: "Troca de amortecedores dianteiros (par)", valorReferencia: 320 },
  { nome: "Troca de amortecedores traseiros (par)", valorReferencia: 320 },
  { nome: "Troca de molas helicoidais (par)", valorReferencia: 280 },
  { nome: "Troca de bandeja da suspensão", valorReferencia: 250 },
  { nome: "Troca de pivô de suspensão", valorReferencia: 180 },
  { nome: "Troca de terminal de direção", valorReferencia: 150 },
  { nome: "Troca de barra axial de direção", valorReferencia: 180 },
  { nome: "Troca da caixa de direção hidráulica", valorReferencia: 1800 },
  { nome: "Troca da bomba de direção hidráulica", valorReferencia: 850 },
  { nome: "Troca de buchas da suspensão (jogo)", valorReferencia: 380 },
  { nome: "Troca de coxim do motor", valorReferencia: 280 },

  // Sistema elétrico
  { nome: "Troca de bateria", descricao: "Mão de obra apenas — bateria à parte", valorReferencia: 60 },
  { nome: "Troca/recondicionamento de alternador", valorReferencia: 650 },
  { nome: "Troca/recondicionamento do motor de partida", valorReferencia: 580 },
  { nome: "Reparo de chicote elétrico", valorReferencia: 250 },
  { nome: "Troca de fusível/relé", valorReferencia: 30 },
  { nome: "Troca de lâmpadas (faróis/lanternas)", valorReferencia: 40 },
  { nome: "Diagnóstico elétrico com osciloscópio", valorReferencia: 280 },
  { nome: "Reparo do sistema de partida", valorReferencia: 350 },

  // Arrefecimento
  { nome: "Troca da bomba d'água", valorReferencia: 380 },
  { nome: "Troca do radiador", valorReferencia: 480 },
  { nome: "Troca da válvula termostática", valorReferencia: 180 },
  { nome: "Troca de mangueiras do radiador", valorReferencia: 150 },
  { nome: "Reparo do reservatório de expansão", valorReferencia: 120 },
  { nome: "Troca da ventoinha do radiador", valorReferencia: 350 },

  // Combustível e injeção
  { nome: "Troca da bomba de combustível", valorReferencia: 450 },
  { nome: "Troca de bicos injetores", descricao: "Mão de obra — bicos à parte", valorReferencia: 380 },
  { nome: "Troca da sonda lambda", valorReferencia: 220 },
  { nome: "Troca do sensor MAP/MAF", valorReferencia: 180 },
  { nome: "Reparo do tanque de combustível", valorReferencia: 380 },

  // Escapamento
  { nome: "Troca do catalisador", valorReferencia: 850 },
  { nome: "Troca do silenciador", valorReferencia: 320 },
  { nome: "Solda no escapamento", valorReferencia: 150 },

  // Funilaria / Pintura / Acabamento
  { nome: "Funilaria — reparo de amassado pequeno", valorReferencia: 250 },
  { nome: "Funilaria — reparo de amassado médio", valorReferencia: 600 },
  { nome: "Pintura de peça (porta/paralama)", valorReferencia: 450 },
  { nome: "Polimento técnico", valorReferencia: 350 },
  { nome: "Troca de para-brisa", descricao: "Mão de obra — vidro à parte", valorReferencia: 280 },
  { nome: "Reparo de trinca em para-brisa", valorReferencia: 180 },
  { nome: "Troca de retrovisor", valorReferencia: 80 },
  { nome: "Troca de palhetas do limpador", descricao: "Item fora da preventiva — solicitar quando necessário", valorReferencia: 30 },
  { nome: "Troca do farol (unidade)", valorReferencia: 120 },

  // Mão de obra geral (categorias)
  { nome: "Mão de obra — mecânica geral (hora)", valorReferencia: 120 },
  { nome: "Mão de obra — eletricista (hora)", valorReferencia: 140 },
  { nome: "Mão de obra — funilaria (hora)", valorReferencia: 100 },
  { nome: "Mão de obra — pintura (hora)", valorReferencia: 110 },
  { nome: "Mão de obra — diesel/pesado (hora)", valorReferencia: 180 },
  { nome: "Guincho/reboque", descricao: "Por chamada — pode variar por distância", valorReferencia: 350 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — fluidos e filtros
// ─────────────────────────────────────────────────────────────────────────
const pecasFluidosFiltros: PecaSeed[] = [
  // Óleos motor
  { nome: "Óleo motor sintético 5W30 (1L)", unidade: "L", valorReferencia: 65 },
  { nome: "Óleo motor sintético 5W40 (1L)", unidade: "L", valorReferencia: 70 },
  { nome: "Óleo motor semissintético 10W40 (1L)", unidade: "L", valorReferencia: 45 },
  { nome: "Óleo motor mineral 20W50 (1L)", unidade: "L", valorReferencia: 32 },
  { nome: "Óleo motor diesel 15W40 CI-4 (1L)", unidade: "L", valorReferencia: 38 },
  { nome: "Óleo motor diesel 15W40 CK-4 (balde 20L)", unidade: "UN", valorReferencia: 720 },

  // Outros lubrificantes
  { nome: "Óleo de câmbio manual 75W90 (1L)", unidade: "L", valorReferencia: 85 },
  { nome: "Óleo ATF câmbio automático Dexron VI (1L)", unidade: "L", valorReferencia: 90 },
  { nome: "Óleo do diferencial 80W90 (1L)", unidade: "L", valorReferencia: 55 },
  { nome: "Fluido de freio DOT 4 (500ml)", unidade: "UN", valorReferencia: 35 },
  { nome: "Fluido de direção hidráulica (1L)", unidade: "L", valorReferencia: 45 },
  { nome: "Aditivo radiador concentrado (1L)", unidade: "L", valorReferencia: 55 },
  { nome: "Aditivo radiador pronto uso (5L)", unidade: "UN", valorReferencia: 70 },
  { nome: "Graxa lítio (500g)", unidade: "UN", valorReferencia: 30 },

  // Filtros
  { nome: "Filtro de óleo (carro flex)", codigo: "FO-FLEX", unidade: "UN", valorReferencia: 45 },
  { nome: "Filtro de óleo (Hilux/Sprinter diesel)", codigo: "FO-DIESEL", unidade: "UN", valorReferencia: 85 },
  { nome: "Filtro de óleo (Iveco Daily)", codigo: "FO-DAILY", unidade: "UN", valorReferencia: 110 },
  { nome: "Filtro de óleo (ônibus OF)", codigo: "FO-OF", unidade: "UN", valorReferencia: 180 },
  { nome: "Filtro de ar do motor (carro flex)", codigo: "FA-FLEX", unidade: "UN", valorReferencia: 65 },
  { nome: "Filtro de ar do motor (van/diesel leve)", codigo: "FA-DIESEL", unidade: "UN", valorReferencia: 110 },
  { nome: "Filtro de ar do motor (caminhão/ônibus)", codigo: "FA-PESADO", unidade: "UN", valorReferencia: 280 },
  { nome: "Filtro de combustível (gasolina/flex)", codigo: "FC-FLEX", unidade: "UN", valorReferencia: 55 },
  { nome: "Filtro de combustível (diesel)", codigo: "FC-DIESEL", unidade: "UN", valorReferencia: 95 },
  { nome: "Filtro separador de água (diesel)", codigo: "FSEP-DIESEL", unidade: "UN", valorReferencia: 140 },
  { nome: "Filtro do ar-condicionado (cabine)", codigo: "FAC", unidade: "UN", valorReferencia: 65 },
  { nome: "Filtro do ar-condicionado com carvão ativado", codigo: "FAC-CA", unidade: "UN", valorReferencia: 95 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — freios
// ─────────────────────────────────────────────────────────────────────────
const pecasFreios: PecaSeed[] = [
  { nome: "Pastilha de freio dianteira (carro popular)", unidade: "JG", valorReferencia: 140 },
  { nome: "Pastilha de freio dianteira (sedan/suv)", unidade: "JG", valorReferencia: 220 },
  { nome: "Pastilha de freio dianteira (Hilux/Sprinter)", unidade: "JG", valorReferencia: 320 },
  { nome: "Pastilha de freio traseira (carro popular)", unidade: "JG", valorReferencia: 130 },
  { nome: "Pastilha de freio traseira (sedan/suv)", unidade: "JG", valorReferencia: 200 },
  { nome: "Lona de freio traseira (carro)", unidade: "JG", valorReferencia: 150 },
  { nome: "Lona de freio (caminhão/ônibus)", unidade: "JG", valorReferencia: 480 },
  { nome: "Disco de freio dianteiro (carro popular)", unidade: "UN", valorReferencia: 180 },
  { nome: "Disco de freio dianteiro (Hilux)", unidade: "UN", valorReferencia: 380 },
  { nome: "Disco de freio dianteiro (Sprinter/Master)", unidade: "UN", valorReferencia: 420 },
  { nome: "Disco de freio traseiro", unidade: "UN", valorReferencia: 220 },
  { nome: "Tambor de freio (carro)", unidade: "UN", valorReferencia: 180 },
  { nome: "Tambor de freio (caminhão)", unidade: "UN", valorReferencia: 480 },
  { nome: "Cilindro mestre de freio", unidade: "UN", valorReferencia: 320 },
  { nome: "Pinça de freio dianteira", unidade: "UN", valorReferencia: 480 },
  { nome: "Cuíca de freio (caminhão/ônibus)", unidade: "UN", valorReferencia: 680 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — pneus
// ─────────────────────────────────────────────────────────────────────────
const pecasPneus: PecaSeed[] = [
  { nome: "Pneu 175/65 R14 (carro popular)", codigo: "P-175/65R14", unidade: "UN", valorReferencia: 380 },
  { nome: "Pneu 185/60 R15 (HB20/Onix)", codigo: "P-185/60R15", unidade: "UN", valorReferencia: 450 },
  { nome: "Pneu 195/55 R16", codigo: "P-195/55R16", unidade: "UN", valorReferencia: 520 },
  { nome: "Pneu 195/65 R15", codigo: "P-195/65R15", unidade: "UN", valorReferencia: 480 },
  { nome: "Pneu 205/55 R16", codigo: "P-205/55R16", unidade: "UN", valorReferencia: 580 },
  { nome: "Pneu 215/60 R16", codigo: "P-215/60R16", unidade: "UN", valorReferencia: 650 },
  { nome: "Pneu 225/65 R17 (Hilux/SUV)", codigo: "P-225/65R17", unidade: "UN", valorReferencia: 850 },
  { nome: "Pneu 265/65 R17 (Hilux 4x4)", codigo: "P-265/65R17", unidade: "UN", valorReferencia: 1050 },
  { nome: "Pneu 225/75 R16C (Sprinter/Master/Daily)", codigo: "P-225/75R16C", unidade: "UN", valorReferencia: 850 },
  { nome: "Pneu 195/75 R16C (van leve)", codigo: "P-195/75R16C", unidade: "UN", valorReferencia: 720 },
  { nome: "Pneu 275/80 R22.5 (caminhão/ônibus)", codigo: "P-275/80R22.5", unidade: "UN", valorReferencia: 2400 },
  { nome: "Pneu 295/80 R22.5 (ônibus rodoviário)", codigo: "P-295/80R22.5", unidade: "UN", valorReferencia: 2800 },
  { nome: "Câmara de ar (caminhão/ônibus)", unidade: "UN", valorReferencia: 180 },
  { nome: "Válvula de pneu", unidade: "UN", valorReferencia: 12 },
  { nome: "Válvula TPMS", unidade: "UN", valorReferencia: 95 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — bateria e elétrica
// ─────────────────────────────────────────────────────────────────────────
const pecasEletricas: PecaSeed[] = [
  { nome: "Bateria 45 Ah", codigo: "BAT-45", unidade: "UN", valorReferencia: 380 },
  { nome: "Bateria 60 Ah", codigo: "BAT-60", unidade: "UN", valorReferencia: 480 },
  { nome: "Bateria 70 Ah", codigo: "BAT-70", unidade: "UN", valorReferencia: 580 },
  { nome: "Bateria 100 Ah (van/diesel leve)", codigo: "BAT-100", unidade: "UN", valorReferencia: 850 },
  { nome: "Bateria 150 Ah (caminhão)", codigo: "BAT-150", unidade: "UN", valorReferencia: 1450 },
  { nome: "Bateria 180 Ah (ônibus/caminhão)", codigo: "BAT-180", unidade: "UN", valorReferencia: 1750 },
  { nome: "Alternador (carro flex)", unidade: "UN", valorReferencia: 850 },
  { nome: "Alternador (Sprinter/Master)", unidade: "UN", valorReferencia: 1450 },
  { nome: "Motor de partida (carro flex)", unidade: "UN", valorReferencia: 720 },
  { nome: "Motor de partida (caminhão/ônibus)", unidade: "UN", valorReferencia: 1850 },
  { nome: "Vela de ignição (jogo)", unidade: "JG", valorReferencia: 95 },
  { nome: "Vela de ignição irídio (jogo)", unidade: "JG", valorReferencia: 220 },
  { nome: "Cabos de vela (jogo)", unidade: "JG", valorReferencia: 140 },
  { nome: "Bobina de ignição", unidade: "UN", valorReferencia: 220 },
  { nome: "Lâmpada H4 60/55W", unidade: "UN", valorReferencia: 25 },
  { nome: "Lâmpada H7 55W", unidade: "UN", valorReferencia: 28 },
  { nome: "Lâmpada H1 55W", unidade: "UN", valorReferencia: 22 },
  { nome: "Lâmpada de freio (1 polo)", unidade: "UN", valorReferencia: 8 },
  { nome: "Lâmpada de seta", unidade: "UN", valorReferencia: 8 },
  { nome: "Fusível (cartela 10 unidades)", unidade: "UN", valorReferencia: 18 },
  { nome: "Sonda lambda", unidade: "UN", valorReferencia: 280 },
  { nome: "Sensor MAP", unidade: "UN", valorReferencia: 180 },
  { nome: "Sensor de rotação", unidade: "UN", valorReferencia: 220 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — motor e correias
// ─────────────────────────────────────────────────────────────────────────
const pecasMotor: PecaSeed[] = [
  { nome: "Correia dentada", unidade: "UN", valorReferencia: 220 },
  { nome: "Kit correia dentada (correia + tensor + bomba d'água)", unidade: "JG", valorReferencia: 850 },
  { nome: "Correia poli-V (alternador)", unidade: "UN", valorReferencia: 95 },
  { nome: "Tensor de correia", unidade: "UN", valorReferencia: 180 },
  { nome: "Junta do cabeçote", unidade: "UN", valorReferencia: 320 },
  { nome: "Jogo de juntas do motor", unidade: "JG", valorReferencia: 480 },
  { nome: "Retentor do virabrequim", unidade: "UN", valorReferencia: 85 },
  { nome: "Coxim do motor", unidade: "UN", valorReferencia: 180 },
  { nome: "Coxim do câmbio", unidade: "UN", valorReferencia: 160 },
  { nome: "Bicos injetores (unidade)", unidade: "UN", valorReferencia: 280 },
  { nome: "Bomba de combustível elétrica", unidade: "UN", valorReferencia: 480 },
  { nome: "Bomba de combustível mecânica (diesel)", unidade: "UN", valorReferencia: 1850 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — embreagem e transmissão
// ─────────────────────────────────────────────────────────────────────────
const pecasTransmissao: PecaSeed[] = [
  { nome: "Kit embreagem (carro popular)", descricao: "Disco + platô + rolamento", unidade: "JG", valorReferencia: 680 },
  { nome: "Kit embreagem (sedan/suv)", unidade: "JG", valorReferencia: 1100 },
  { nome: "Kit embreagem (Hilux)", unidade: "JG", valorReferencia: 1850 },
  { nome: "Kit embreagem (Sprinter/Master)", unidade: "JG", valorReferencia: 2400 },
  { nome: "Kit embreagem (Iveco Daily)", unidade: "JG", valorReferencia: 2800 },
  { nome: "Kit embreagem (ônibus OF)", unidade: "JG", valorReferencia: 4500 },
  { nome: "Volante bimassa", unidade: "UN", valorReferencia: 2200 },
  { nome: "Cilindro mestre da embreagem", unidade: "UN", valorReferencia: 280 },
  { nome: "Cilindro auxiliar da embreagem", unidade: "UN", valorReferencia: 220 },
  { nome: "Rolamento da embreagem", unidade: "UN", valorReferencia: 180 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — suspensão e direção
// ─────────────────────────────────────────────────────────────────────────
const pecasSuspensao: PecaSeed[] = [
  { nome: "Amortecedor dianteiro (carro)", unidade: "UN", valorReferencia: 280 },
  { nome: "Amortecedor traseiro (carro)", unidade: "UN", valorReferencia: 250 },
  { nome: "Amortecedor dianteiro (van/Sprinter)", unidade: "UN", valorReferencia: 580 },
  { nome: "Amortecedor traseiro (van/Sprinter)", unidade: "UN", valorReferencia: 520 },
  { nome: "Mola helicoidal dianteira", unidade: "UN", valorReferencia: 180 },
  { nome: "Mola helicoidal traseira", unidade: "UN", valorReferencia: 180 },
  { nome: "Feixe de mola (caminhão/van)", unidade: "UN", valorReferencia: 850 },
  { nome: "Bandeja da suspensão dianteira", unidade: "UN", valorReferencia: 380 },
  { nome: "Pivô de suspensão", unidade: "UN", valorReferencia: 95 },
  { nome: "Terminal de direção", unidade: "UN", valorReferencia: 110 },
  { nome: "Barra axial de direção", unidade: "UN", valorReferencia: 180 },
  { nome: "Bucha da bandeja", unidade: "UN", valorReferencia: 65 },
  { nome: "Batente do amortecedor (kit)", unidade: "JG", valorReferencia: 140 },
  { nome: "Coxim do amortecedor", unidade: "UN", valorReferencia: 95 },
  { nome: "Bieleta da barra estabilizadora", unidade: "UN", valorReferencia: 85 },
  { nome: "Caixa de direção hidráulica", unidade: "UN", valorReferencia: 1450 },
  { nome: "Bomba de direção hidráulica", unidade: "UN", valorReferencia: 680 },
  { nome: "Junta homocinética", unidade: "UN", valorReferencia: 280 },
  { nome: "Coifa da homocinética", unidade: "UN", valorReferencia: 65 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — arrefecimento
// ─────────────────────────────────────────────────────────────────────────
const pecasArrefecimento: PecaSeed[] = [
  { nome: "Bomba d'água (carro)", unidade: "UN", valorReferencia: 280 },
  { nome: "Bomba d'água (van/diesel)", unidade: "UN", valorReferencia: 480 },
  { nome: "Bomba d'água (caminhão/ônibus)", unidade: "UN", valorReferencia: 850 },
  { nome: "Radiador (carro)", unidade: "UN", valorReferencia: 580 },
  { nome: "Radiador (van/Sprinter)", unidade: "UN", valorReferencia: 1100 },
  { nome: "Radiador (caminhão/ônibus)", unidade: "UN", valorReferencia: 2400 },
  { nome: "Válvula termostática", unidade: "UN", valorReferencia: 95 },
  { nome: "Mangueira superior do radiador", unidade: "UN", valorReferencia: 95 },
  { nome: "Mangueira inferior do radiador", unidade: "UN", valorReferencia: 95 },
  { nome: "Reservatório de expansão", unidade: "UN", valorReferencia: 180 },
  { nome: "Tampa do radiador", unidade: "UN", valorReferencia: 45 },
  { nome: "Ventoinha do radiador (eletroventilador)", unidade: "UN", valorReferencia: 380 },
  { nome: "Sensor de temperatura do motor", unidade: "UN", valorReferencia: 85 },
];

// ─────────────────────────────────────────────────────────────────────────
// PEÇAS — escapamento e carroceria
// ─────────────────────────────────────────────────────────────────────────
const pecasEscapamentoCarroceria: PecaSeed[] = [
  { nome: "Catalisador (carro flex)", unidade: "UN", valorReferencia: 1200 },
  { nome: "Silenciador traseiro", unidade: "UN", valorReferencia: 320 },
  { nome: "Coxim do escapamento", unidade: "UN", valorReferencia: 35 },
  { nome: "Palheta do limpador (par)", descricao: "Item de troca eventual — fora da preventiva padrão", unidade: "JG", valorReferencia: 60 },
  { nome: "Palheta do limpador traseiro", unidade: "UN", valorReferencia: 35 },
  { nome: "Farol dianteiro (unidade)", unidade: "UN", valorReferencia: 480 },
  { nome: "Lanterna traseira", unidade: "UN", valorReferencia: 280 },
  { nome: "Retrovisor externo", unidade: "UN", valorReferencia: 220 },
  { nome: "Para-brisa (carro)", unidade: "UN", valorReferencia: 850 },
  { nome: "Para-brisa (van/Sprinter)", unidade: "UN", valorReferencia: 1450 },
  { nome: "Borracha de porta", unidade: "UN", valorReferencia: 180 },
  { nome: "Maçaneta externa", unidade: "UN", valorReferencia: 95 },
];

const TODOS_SERVICOS: ServicoSeed[] = [
  ...servicosPreventivos,
  ...servicosCorretivos,
];

const TODAS_PECAS: PecaSeed[] = [
  ...pecasFluidosFiltros,
  ...pecasFreios,
  ...pecasPneus,
  ...pecasEletricas,
  ...pecasMotor,
  ...pecasTransmissao,
  ...pecasSuspensao,
  ...pecasArrefecimento,
  ...pecasEscapamentoCarroceria,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL não setado");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(`\nServiços: ${TODOS_SERVICOS.length} itens`);
  console.log(`Peças:    ${TODAS_PECAS.length} itens\n`);

  let servCriados = 0;
  let servAtualizados = 0;
  for (const s of TODOS_SERVICOS) {
    const existente = await prisma.servico.findUnique({ where: { nome: s.nome } });
    await prisma.servico.upsert({
      where: { nome: s.nome },
      create: {
        nome: s.nome,
        descricao: s.descricao ?? null,
        valorReferencia: s.valorReferencia ?? null,
        ativo: true,
      },
      update: {
        descricao: s.descricao ?? null,
        valorReferencia: s.valorReferencia ?? null,
      },
    });
    if (existente) servAtualizados++;
    else servCriados++;
  }

  let pecCriadas = 0;
  let pecAtualizadas = 0;
  for (const p of TODAS_PECAS) {
    const existente = await prisma.peca.findUnique({ where: { nome: p.nome } });
    await prisma.peca.upsert({
      where: { nome: p.nome },
      create: {
        nome: p.nome,
        codigo: p.codigo ?? null,
        unidade: p.unidade ?? null,
        valorReferencia: p.valorReferencia ?? null,
        ativo: true,
      },
      update: {
        codigo: p.codigo ?? null,
        unidade: p.unidade ?? null,
        valorReferencia: p.valorReferencia ?? null,
      },
    });
    if (existente) pecAtualizadas++;
    else pecCriadas++;
  }

  console.log("✅ Catálogo populado:");
  console.log(`   Serviços: ${servCriados} criados, ${servAtualizados} atualizados`);
  console.log(`   Peças:    ${pecCriadas} criadas, ${pecAtualizadas} atualizadas`);
  console.log("\nValores são REFERÊNCIA (mercado BR 2026) — ajustar conforme cotação real.");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
