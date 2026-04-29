-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "unidadeId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'aprovado';

-- CreateIndex
CREATE INDEX "Agendamento_unidadeId_idx" ON "Agendamento"("unidadeId");

-- CreateIndex
CREATE INDEX "Agendamento_dataInicio_dataFim_idx" ON "Agendamento"("dataInicio", "dataFim");

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
