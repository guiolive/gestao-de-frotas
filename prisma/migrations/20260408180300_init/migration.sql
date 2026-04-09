-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,
    "quilometragem" INTEGER NOT NULL DEFAULT 0,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disponivel',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Motorista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "categoriaCnh" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Viagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "dataSaida" DATETIME NOT NULL,
    "dataRetorno" DATETIME,
    "kmInicial" INTEGER NOT NULL,
    "kmFinal" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Viagem_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Viagem_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "veiculoId" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agendamento_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "veiculoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataEntrada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previsaoSaida" DATETIME,
    "previsaoDias" INTEGER NOT NULL DEFAULT 0,
    "custoEstimado" REAL,
    "status" TEXT NOT NULL DEFAULT 'aguardando',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Manutencao_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "manutencaoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "temProblema" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    CONSTRAINT "ChecklistItem_manutencaoId_fkey" FOREIGN KEY ("manutencaoId") REFERENCES "Manutencao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cpf_key" ON "Motorista"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cnh_key" ON "Motorista"("cnh");
