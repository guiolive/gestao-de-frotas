-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "matricula" TEXT,
    "fotoPerfil" TEXT,
    "primeiroAcesso" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "ultimoLogin" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "acao" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recursoId" TEXT,
    "dados" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cor" TEXT NOT NULL,
    "quilometragem" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorVeiculo" DOUBLE PRECISION,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disponivel',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagemVeiculo" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagemVeiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaKm" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "intervaloKm" DOUBLE PRECISION NOT NULL,
    "ultimaTrocaKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertaAntesDe" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "emailGestor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertaKm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motorista" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "categoriaCnh" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Motorista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viagem" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "dataSaida" TIMESTAMP(3) NOT NULL,
    "dataRetorno" TIMESTAMP(3),
    "kmInicial" DOUBLE PRECISION NOT NULL,
    "kmFinal" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'agendada',
    "observacoes" TEXT,
    "processoSei" TEXT,
    "unidadeId" TEXT,
    "ufDestino" TEXT,
    "diaria" DOUBLE PRECISION,
    "solicitante" TEXT,
    "motorista2Id" TEXT,
    "kmPorTrecho" DOUBLE PRECISION,
    "qtdDiarias" DOUBLE PRECISION,
    "pcdpNumero" TEXT,
    "pcdpData" TEXT,
    "pcdpValor" DOUBLE PRECISION,
    "pcdp2Solicitante" TEXT,
    "pcdp2Numero" TEXT,
    "pcdp2Data" TEXT,
    "pcdp2Valor" DOUBLE PRECISION,
    "totalDiarias" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Viagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL,
    "previsaoSaida" TIMESTAMP(3),
    "previsaoDias" INTEGER NOT NULL DEFAULT 0,
    "custoEstimado" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'aguardando',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "manutencaoId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "temProblema" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemManutencao" (
    "id" TEXT NOT NULL,
    "manutencaoId" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacao" TEXT,

    CONSTRAINT "ItemManutencao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_usuarioId_idx" ON "PasswordResetToken"("usuarioId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiraEm_idx" ON "PasswordResetToken"("expiraEm");

-- CreateIndex
CREATE INDEX "AuditLog_usuarioId_idx" ON "AuditLog"("usuarioId");

-- CreateIndex
CREATE INDEX "AuditLog_recurso_recursoId_idx" ON "AuditLog"("recurso", "recursoId");

-- CreateIndex
CREATE INDEX "AuditLog_criadoEm_idx" ON "AuditLog"("criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE INDEX "ImagemVeiculo_veiculoId_idx" ON "ImagemVeiculo"("veiculoId");

-- CreateIndex
CREATE INDEX "AlertaKm_veiculoId_idx" ON "AlertaKm"("veiculoId");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cpf_key" ON "Motorista"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Motorista_cnh_key" ON "Motorista"("cnh");

-- CreateIndex
CREATE UNIQUE INDEX "Unidade_sigla_key" ON "Unidade"("sigla");

-- CreateIndex
CREATE INDEX "Viagem_veiculoId_idx" ON "Viagem"("veiculoId");

-- CreateIndex
CREATE INDEX "Viagem_motoristaId_idx" ON "Viagem"("motoristaId");

-- CreateIndex
CREATE INDEX "Viagem_motorista2Id_idx" ON "Viagem"("motorista2Id");

-- CreateIndex
CREATE INDEX "Viagem_unidadeId_idx" ON "Viagem"("unidadeId");

-- CreateIndex
CREATE INDEX "Agendamento_veiculoId_idx" ON "Agendamento"("veiculoId");

-- CreateIndex
CREATE INDEX "Manutencao_veiculoId_idx" ON "Manutencao"("veiculoId");

-- CreateIndex
CREATE INDEX "ChecklistItem_manutencaoId_idx" ON "ChecklistItem"("manutencaoId");

-- CreateIndex
CREATE INDEX "ItemManutencao_manutencaoId_idx" ON "ItemManutencao"("manutencaoId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagemVeiculo" ADD CONSTRAINT "ImagemVeiculo_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaKm" ADD CONSTRAINT "AlertaKm_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_motoristaId_fkey" FOREIGN KEY ("motoristaId") REFERENCES "Motorista"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_motorista2Id_fkey" FOREIGN KEY ("motorista2Id") REFERENCES "Motorista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_manutencaoId_fkey" FOREIGN KEY ("manutencaoId") REFERENCES "Manutencao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemManutencao" ADD CONSTRAINT "ItemManutencao_manutencaoId_fkey" FOREIGN KEY ("manutencaoId") REFERENCES "Manutencao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
