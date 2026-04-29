-- AlterTable
ALTER TABLE "Viagem" ADD COLUMN     "agendamentoId" TEXT;

-- CreateIndex
CREATE INDEX "Viagem_agendamentoId_idx" ON "Viagem"("agendamentoId");

-- AddForeignKey
ALTER TABLE "Viagem" ADD CONSTRAINT "Viagem_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
