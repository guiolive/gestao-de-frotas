DROP INDEX "Peca_nome_idx";

-- DropIndex
DROP INDEX "Servico_nome_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Peca_nome_key" ON "Peca"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Servico_nome_key" ON "Servico"("nome");

