import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hashSync as argonHashSync } from "@node-rs/argon2";

const adapter = new PrismaLibSql({ url: `file:${process.cwd()}/dev.db` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Limpando banco...");
  await prisma.checklistItem.deleteMany();
  await prisma.itemManutencao.deleteMany();
  await prisma.manutencao.deleteMany();
  await prisma.agendamento.deleteMany();
  await prisma.viagem.deleteMany();
  await prisma.alertaKm.deleteMany();
  await prisma.imagemVeiculo.deleteMany();
  await prisma.motorista.deleteMany();
  await prisma.unidade.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("Criando usuario admin...");
  await prisma.usuario.create({
    data: {
      nome: "Administrador",
      email: "admin@dept.com",
      senha: argonHashSync("Admin@123"),
      tipo: "ADMINISTRADOR",
      primeiroAcesso: false,
      matricula: "ADM001",
    },
  });

  console.log("Criando unidades...");
  const unidadesData = [
    { sigla: "IV", nome: "Instituto de Veterinária" },
    { sigla: "FIRM", nome: "Faculdade de Informação e Comunicação" },
    { sigla: "ICB", nome: "Instituto de Ciências Biológicas" },
    { sigla: "EA", nome: "Escola de Agronomia" },
    { sigla: "SEINFRA", nome: "Secretaria de Infraestrutura" },
    { sigla: "EVZ", nome: "Escola de Veterinária e Zootecnia" },
    { sigla: "PRPI", nome: "Pró-Reitoria de Pesquisa e Inovação" },
    { sigla: "FD", nome: "Faculdade de Direito" },
    { sigla: "SRI", nome: "Secretaria de Relações Internacionais" },
    { sigla: "REITORIA", nome: "Reitoria" },
    { sigla: "PRPG", nome: "Pró-Reitoria de Pós-Graduação" },
    { sigla: "DLOG", nome: "Diretoria de Logística" },
    { sigla: "DTEL", nome: "Diretoria de Tecnologia Educacional" },
    { sigla: "IESA", nome: "Instituto de Estudos Socioambientais" },
    { sigla: "FE", nome: "Faculdade de Educação" },
    { sigla: "FL", nome: "Faculdade de Letras" },
    { sigla: "IME", nome: "Instituto de Matemática e Estatística" },
    { sigla: "IF", nome: "Instituto de Física" },
    { sigla: "IQ", nome: "Instituto de Química" },
  ];
  const unidades = await Promise.all(
    unidadesData.map((u) => prisma.unidade.create({ data: u }))
  );

  console.log("Criando veiculos...");
  const veiculos = await Promise.all([
    prisma.veiculo.create({
      data: { placa: "ABC1D23", modelo: "Gol", marca: "Volkswagen", ano: 2022, cor: "Branco", quilometragem: 45000, valorVeiculo: 55000, tipo: "carro", status: "disponivel" },
    }),
    prisma.veiculo.create({
      data: { placa: "DEF2G34", modelo: "HB20", marca: "Hyundai", ano: 2023, cor: "Prata", quilometragem: 22000, valorVeiculo: 72000, tipo: "carro", status: "disponivel" },
    }),
    prisma.veiculo.create({
      data: { placa: "GHI3J45", modelo: "Sprinter", marca: "Mercedes-Benz", ano: 2021, cor: "Branco", quilometragem: 78000, valorVeiculo: 180000, tipo: "van", status: "em_uso" },
    }),
    prisma.veiculo.create({
      data: { placa: "JKL4M56", modelo: "Daily 35S14", marca: "Iveco", ano: 2020, cor: "Azul", quilometragem: 120000, valorVeiculo: 150000, tipo: "caminhao", status: "manutencao" },
    }),
    prisma.veiculo.create({
      data: { placa: "MNO5P67", modelo: "Onix", marca: "Chevrolet", ano: 2024, cor: "Preto", quilometragem: 5000, valorVeiculo: 85000, tipo: "carro", status: "disponivel" },
    }),
    prisma.veiculo.create({
      data: { placa: "PQR6S78", modelo: "Hilux", marca: "Toyota", ano: 2023, cor: "Prata", quilometragem: 35000, valorVeiculo: 220000, tipo: "carro", status: "disponivel" },
    }),
    prisma.veiculo.create({
      data: { placa: "STU7V89", modelo: "Master", marca: "Renault", ano: 2022, cor: "Branco", quilometragem: 62000, valorVeiculo: 160000, tipo: "van", status: "disponivel" },
    }),
    prisma.veiculo.create({
      data: { placa: "VWX8Y90", modelo: "OF 1519", marca: "Mercedes-Benz", ano: 2019, cor: "Amarelo", quilometragem: 195000, valorVeiculo: 350000, tipo: "onibus", status: "inativo" },
    }),
  ]);

  console.log("Criando motoristas...");
  const motoristas = await Promise.all([
    prisma.motorista.create({
      data: { nome: "Carlos Silva", cpf: "12345678901", cnh: "12345678901", categoriaCnh: "D", telefone: "(62) 99999-0001", email: "carlos.silva@dept.com", status: "ativo" },
    }),
    prisma.motorista.create({
      data: { nome: "Ana Souza", cpf: "23456789012", cnh: "23456789012", categoriaCnh: "B", telefone: "(62) 99999-0002", email: "ana.souza@dept.com", status: "ativo" },
    }),
    prisma.motorista.create({
      data: { nome: "Pedro Oliveira", cpf: "34567890123", cnh: "34567890123", categoriaCnh: "C", telefone: "(62) 99999-0003", email: "pedro.oliveira@dept.com", status: "ativo" },
    }),
    prisma.motorista.create({
      data: { nome: "Maria Santos", cpf: "45678901234", cnh: "45678901234", categoriaCnh: "B", telefone: "(62) 99999-0004", email: "maria.santos@dept.com", status: "inativo" },
    }),
    prisma.motorista.create({
      data: { nome: "Jose Roberto Costa", cpf: "56789012345", cnh: "56789012345", categoriaCnh: "E", telefone: "(62) 99999-0005", email: "jose.costa@dept.com", status: "ativo" },
    }),
  ]);

  console.log("Criando viagens...");
  await Promise.all([
    prisma.viagem.create({
      data: {
        veiculoId: veiculos[2].id, motoristaId: motoristas[0].id, origem: "Goiania, GO", destino: "Brasilia, DF",
        dataSaida: new Date("2026-04-07T08:00:00"), kmInicial: 77500, status: "em_andamento",
        processoSei: "23070.004715/2026-51", unidadeId: unidades[0].id, ufDestino: "DF",
        diaria: 335.50, solicitante: "Prof. Roberto Lima", qtdDiarias: 1,
        pcdpNumero: "PCDP-2026-0142", pcdpData: "03/04/2026", pcdpValor: 335.50,
        observacoes: "Reuniao no MEC",
      },
    }),
    prisma.viagem.create({
      data: {
        veiculoId: veiculos[0].id, motoristaId: motoristas[1].id, motorista2Id: motoristas[2].id,
        origem: "Goiania, GO", destino: "Jatai, GO",
        dataSaida: new Date("2026-04-05T06:00:00"), dataRetorno: new Date("2026-04-05T20:00:00"),
        kmInicial: 44500, kmFinal: 45000, status: "concluida",
        processoSei: "23070.004680/2026-30", unidadeId: unidades[3].id, ufDestino: "GO",
        diaria: 177.00, solicitante: "Depto. Agronomia", qtdDiarias: 0.5, kmPorTrecho: 250,
        pcdpNumero: "PCDP-2026-0138", pcdpData: "01/04/2026", pcdpValor: 177.00,
        pcdp2Solicitante: "Depto. Agronomia", pcdp2Numero: "PCDP-2026-0139", pcdp2Data: "01/04/2026", pcdp2Valor: 177.00,
        totalDiarias: 354.00,
      },
    }),
    prisma.viagem.create({
      data: {
        veiculoId: veiculos[1].id, motoristaId: motoristas[0].id, origem: "Goiania, GO", destino: "Anapolis, GO",
        dataSaida: new Date("2026-04-03T09:00:00"), dataRetorno: new Date("2026-04-03T17:00:00"),
        kmInicial: 21800, kmFinal: 21920, status: "concluida",
        unidadeId: unidades[1].id, ufDestino: "GO", solicitante: "Coord. FIRM",
      },
    }),
    prisma.viagem.create({
      data: {
        veiculoId: veiculos[4].id, motoristaId: motoristas[1].id, origem: "Goiania, GO", destino: "Caldas Novas, GO",
        dataSaida: new Date("2026-04-12T07:00:00"), kmInicial: 5000, status: "agendada",
        processoSei: "23070.004800/2026-12", unidadeId: unidades[6].id, ufDestino: "GO",
        diaria: 335.50, solicitante: "PRPI", qtdDiarias: 2, observacoes: "Evento cientifico",
      },
    }),
    prisma.viagem.create({
      data: {
        veiculoId: veiculos[5].id, motoristaId: motoristas[4].id, origem: "Goiania, GO", destino: "Catalao, GO",
        dataSaida: new Date("2026-04-15T06:00:00"), kmInicial: 35000, status: "agendada",
        unidadeId: unidades[9].id, ufDestino: "GO", solicitante: "Reitoria",
        diaria: 335.50, qtdDiarias: 1.5, kmPorTrecho: 260,
      },
    }),
    prisma.viagem.create({
      data: {
        veiculoId: veiculos[6].id, motoristaId: motoristas[2].id, origem: "Goiania, GO", destino: "Goianesia, GO",
        dataSaida: new Date("2026-03-28T08:00:00"), dataRetorno: new Date("2026-03-28T18:00:00"),
        kmInicial: 61500, kmFinal: 61820, status: "concluida",
        unidadeId: unidades[4].id, ufDestino: "GO", solicitante: "SEINFRA",
      },
    }),
  ]);

  console.log("Criando agendamentos...");
  await Promise.all([
    prisma.agendamento.create({
      data: { veiculoId: veiculos[0].id, solicitante: "Depto. Comercial", motivo: "Visita a clientes em Campinas", dataInicio: new Date("2026-04-14T08:00:00"), dataFim: new Date("2026-04-14T18:00:00"), status: "aprovado" },
    }),
    prisma.agendamento.create({
      data: { veiculoId: veiculos[6].id, solicitante: "Depto. RH", motivo: "Transporte para treinamento", dataInicio: new Date("2026-04-12T06:00:00"), dataFim: new Date("2026-04-13T22:00:00"), status: "aprovado" },
    }),
    prisma.agendamento.create({
      data: { veiculoId: veiculos[4].id, solicitante: "Diretoria", motivo: "Reuniao em Curitiba", dataInicio: new Date("2026-04-20T07:00:00"), dataFim: new Date("2026-04-21T20:00:00"), status: "pendente" },
    }),
    prisma.agendamento.create({
      data: { veiculoId: veiculos[5].id, solicitante: "Logistica", motivo: "Entrega de equipamentos", dataInicio: new Date("2026-04-11T05:00:00"), dataFim: new Date("2026-04-11T14:00:00"), status: "pendente" },
    }),
  ]);

  console.log("Criando manutencoes com itens e custos...");
  // Manutencao 1: Iveco em manutencao (corretiva)
  const m1 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[3].id, tipo: "corretiva", descricao: "Problema na embreagem - troca completa do kit",
      dataEntrada: new Date("2026-04-06T10:00:00"), previsaoSaida: new Date("2026-04-11T18:00:00"),
      previsaoDias: 5, custoEstimado: 4500, status: "em_andamento",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m1.id, servico: "Kit embreagem completo", valor: 2800 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m1.id, servico: "Mao de obra - troca embreagem", valor: 1500 } }),
    prisma.checklistItem.create({ data: { manutencaoId: m1.id, categoria: "Transmissao", temProblema: true, descricao: "Disco e plato desgastados, rolamento com folga" } }),
    prisma.checklistItem.create({ data: { manutencaoId: m1.id, categoria: "Freios", temProblema: false } }),
    prisma.checklistItem.create({ data: { manutencaoId: m1.id, categoria: "Pneus", temProblema: true, descricao: "Pneu traseiro direito com desgaste irregular" } }),
  ]);

  // Manutencao 2: Onibus inativo (corretiva)
  const m2 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[7].id, tipo: "corretiva", descricao: "Motor com superaquecimento - diagnostico e reparo",
      dataEntrada: new Date("2026-04-01T09:00:00"), previsaoSaida: new Date("2026-04-15T18:00:00"),
      previsaoDias: 14, custoEstimado: 12000, status: "em_andamento",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m2.id, servico: "Retifica do motor", valor: 6500 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m2.id, servico: "Junta do cabecote", valor: 1800 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m2.id, servico: "Bomba d'agua", valor: 950 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m2.id, servico: "Mao de obra", valor: 3500 } }),
  ]);

  // Manutencao 3: Gol revisao concluida
  const m3 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[0].id, tipo: "preventiva", descricao: "Revisao dos 45.000 km",
      dataEntrada: new Date("2026-03-28T08:00:00"), previsaoSaida: new Date("2026-03-29T17:00:00"),
      previsaoDias: 1, custoEstimado: 800, valorTotal: 920, status: "concluida",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m3.id, servico: "Troca de oleo motor sintetico 5W30", valor: 280 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m3.id, servico: "Filtro de oleo", valor: 45 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m3.id, servico: "Filtro de ar", valor: 65 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m3.id, servico: "Pastilhas de freio dianteiras", valor: 320 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m3.id, servico: "Mao de obra", valor: 210 } }),
    prisma.checklistItem.create({ data: { manutencaoId: m3.id, categoria: "Motor", temProblema: false } }),
    prisma.checklistItem.create({ data: { manutencaoId: m3.id, categoria: "Freios", temProblema: true, descricao: "Pastilhas dianteiras no limite" } }),
    prisma.checklistItem.create({ data: { manutencaoId: m3.id, categoria: "Pneus", temProblema: false } }),
    prisma.checklistItem.create({ data: { manutencaoId: m3.id, categoria: "Eletrica", temProblema: false } }),
  ]);

  // Manutencao 4: HB20 troca de oleo concluida
  const m4 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[1].id, tipo: "preventiva", descricao: "Troca de oleo e filtros",
      dataEntrada: new Date("2026-03-20T08:00:00"), previsaoSaida: new Date("2026-03-20T12:00:00"),
      previsaoDias: 0, custoEstimado: 450, valorTotal: 480, status: "concluida",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m4.id, servico: "Oleo motor sintetico 5W40", valor: 320 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m4.id, servico: "Filtro de oleo", valor: 55 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m4.id, servico: "Filtro de combustivel", valor: 40 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m4.id, servico: "Mao de obra", valor: 65 } }),
  ]);

  // Manutencao 5: Hilux preventiva concluida
  const m5 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[5].id, tipo: "preventiva", descricao: "Revisao completa 30.000 km",
      dataEntrada: new Date("2026-02-15T08:00:00"), previsaoSaida: new Date("2026-02-17T17:00:00"),
      previsaoDias: 2, custoEstimado: 2500, valorTotal: 2780, status: "concluida",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Troca de oleo motor diesel", valor: 450 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Filtro de oleo", valor: 85 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Filtro de ar", valor: 120 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Filtro de combustivel", valor: 95 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Pastilhas de freio dianteiras", valor: 380 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Discos de freio dianteiros", valor: 620 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Alinhamento e balanceamento", valor: 180 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m5.id, servico: "Mao de obra geral", valor: 850 } }),
  ]);

  // Manutencao 6: Sprinter preventiva concluida
  const m6 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[2].id, tipo: "preventiva", descricao: "Troca de pneus e alinhamento",
      dataEntrada: new Date("2026-03-10T08:00:00"), previsaoSaida: new Date("2026-03-10T17:00:00"),
      previsaoDias: 1, custoEstimado: 4000, valorTotal: 4200, status: "concluida",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m6.id, servico: "Pneu 225/75 R16 (x4)", valor: 3200 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m6.id, servico: "Alinhamento e balanceamento", valor: 250 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m6.id, servico: "Mao de obra", valor: 350 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m6.id, servico: "Valvulas novas", valor: 400 } }),
  ]);

  // Manutencao 7: Gol corretiva concluida (janeiro)
  const m7 = await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[0].id, tipo: "corretiva", descricao: "Bateria descarregada - troca",
      dataEntrada: new Date("2026-01-15T09:00:00"), previsaoSaida: new Date("2026-01-15T12:00:00"),
      previsaoDias: 0, custoEstimado: 500, valorTotal: 520, status: "concluida",
    },
  });
  await Promise.all([
    prisma.itemManutencao.create({ data: { manutencaoId: m7.id, servico: "Bateria 60Ah", valor: 450 } }),
    prisma.itemManutencao.create({ data: { manutencaoId: m7.id, servico: "Mao de obra", valor: 70 } }),
  ]);

  // Manutencao 8: aguardando
  await prisma.manutencao.create({
    data: {
      veiculoId: veiculos[6].id, tipo: "preventiva", descricao: "Revisao 60.000 km agendada",
      dataEntrada: new Date("2026-04-18T08:00:00"), previsaoSaida: new Date("2026-04-19T17:00:00"),
      previsaoDias: 1, custoEstimado: 1200, status: "aguardando",
    },
  });

  console.log("Criando alertas de KM...");
  await Promise.all([
    prisma.alertaKm.create({ data: { veiculoId: veiculos[0].id, tipo: "Troca de oleo", intervaloKm: 10000, ultimaTrocaKm: 45000, alertaAntesDe: 1000, emailGestor: "gestor@dept.com" } }),
    prisma.alertaKm.create({ data: { veiculoId: veiculos[1].id, tipo: "Troca de oleo", intervaloKm: 10000, ultimaTrocaKm: 22000, alertaAntesDe: 1000, emailGestor: "gestor@dept.com" } }),
    prisma.alertaKm.create({ data: { veiculoId: veiculos[2].id, tipo: "Troca de pneus", intervaloKm: 50000, ultimaTrocaKm: 78000, alertaAntesDe: 5000, emailGestor: "gestor@dept.com" } }),
    prisma.alertaKm.create({ data: { veiculoId: veiculos[3].id, tipo: "Revisao geral", intervaloKm: 20000, ultimaTrocaKm: 100000, alertaAntesDe: 2000, emailGestor: "gestor@dept.com" } }),
    prisma.alertaKm.create({ data: { veiculoId: veiculos[5].id, tipo: "Troca de oleo", intervaloKm: 10000, ultimaTrocaKm: 35000, alertaAntesDe: 1000, emailGestor: "gestor@dept.com" } }),
    prisma.alertaKm.create({ data: { veiculoId: veiculos[5].id, tipo: "Revisao geral", intervaloKm: 30000, ultimaTrocaKm: 30000, alertaAntesDe: 3000, emailGestor: "gestor@dept.com" } }),
  ]);

  console.log("\nSeed concluido!");
  console.log("- 1 usuario admin (admin@dept.com / Admin@123)");
  console.log(`- ${unidades.length} unidades`);
  console.log(`- ${veiculos.length} veiculos (com valor estimado)`);
  console.log(`- ${motoristas.length} motoristas`);
  console.log("- 6 viagens (com PCDP, unidade, diarias)");
  console.log("- 4 agendamentos");
  console.log("- 8 manutencoes (com itens e custos reais)");
  console.log("- 6 alertas de KM");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
