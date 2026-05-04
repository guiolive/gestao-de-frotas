-- AlterTable
ALTER TABLE "Manutencao" ADD COLUMN     "previsaoSaidaAtualizadaEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Manutencao_retornoEfetivoEm_idx" ON "Manutencao"("retornoEfetivoEm");

-- CreateIndex
CREATE INDEX "Manutencao_previsaoSaidaAtualizadaEm_idx" ON "Manutencao"("previsaoSaidaAtualizadaEm");
