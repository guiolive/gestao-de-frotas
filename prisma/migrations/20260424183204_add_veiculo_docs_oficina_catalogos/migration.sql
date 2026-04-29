-- AlterTable
ALTER TABLE "ItemManutencao" ADD COLUMN     "pecaId" TEXT,
ADD COLUMN     "servicoRefId" TEXT;

-- AlterTable
ALTER TABLE "Manutencao" ADD COLUMN     "enviadaPrimeEm" TIMESTAMP(3),
ADD COLUMN     "oficinaId" TEXT,
ADD COLUMN     "retornoEfetivoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Veiculo" ADD COLUMN     "chassi" TEXT,
ADD COLUMN     "combustivel" TEXT,
ADD COLUMN     "fipeAtualizadoEm" TIMESTAMP(3),
ADD COLUMN     "fipeCodigo" TEXT,
ADD COLUMN     "renavam" TEXT,
ADD COLUMN     "valorFipe" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Oficina" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "whatsapp" TEXT,
    "enderecoTexto" TEXT,
    "googleMapsUrl" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valorReferencia" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "unidade" TEXT,
    "valorReferencia" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Peca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Oficina_cnpj_key" ON "Oficina"("cnpj");

-- CreateIndex
CREATE INDEX "Servico_nome_idx" ON "Servico"("nome");

-- CreateIndex
CREATE INDEX "Peca_nome_idx" ON "Peca"("nome");

-- CreateIndex
CREATE INDEX "ItemManutencao_servicoRefId_idx" ON "ItemManutencao"("servicoRefId");

-- CreateIndex
CREATE INDEX "ItemManutencao_pecaId_idx" ON "ItemManutencao"("pecaId");

-- CreateIndex
CREATE INDEX "Manutencao_oficinaId_idx" ON "Manutencao"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_renavam_key" ON "Veiculo"("renavam");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_chassi_key" ON "Veiculo"("chassi");

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemManutencao" ADD CONSTRAINT "ItemManutencao_servicoRefId_fkey" FOREIGN KEY ("servicoRefId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemManutencao" ADD CONSTRAINT "ItemManutencao_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "Peca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

