CREATE TABLE "Bateria" (
    "id" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "fabricante" TEXT,
    "amperagem" INTEGER,
    "dataInstalacao" TIMESTAMP(3) NOT NULL,
    "vidaUtilMeses" INTEGER NOT NULL DEFAULT 24,
    "alertaAntesDeDias" INTEGER NOT NULL DEFAULT 30,
    "dataSubstituicao" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bateria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bateria_veiculoId_idx" ON "Bateria"("veiculoId");

-- AddForeignKey
ALTER TABLE "Bateria" ADD CONSTRAINT "Bateria_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

