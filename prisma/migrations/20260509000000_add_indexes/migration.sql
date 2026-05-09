-- Adiciona índices em colunas frequentemente filtradas/ordenadas.
-- Diagnóstico: queries de listagem (/api/viagens, /api/manutencoes,
-- /api/agendamentos, /api/veiculos) e dashboard fazem full scan em
-- colunas como status/tipo/dataSaida/dataEntrada/ufDestino.
-- Em escala (~mil viagens, centenas de manutenções), isso vira
-- bottleneck. Índices b-tree simples cobrem os padrões atuais.

CREATE INDEX "Veiculo_status_idx" ON "Veiculo"("status");
CREATE INDEX "Veiculo_tipo_idx" ON "Veiculo"("tipo");

CREATE INDEX "Viagem_status_idx" ON "Viagem"("status");
CREATE INDEX "Viagem_dataSaida_idx" ON "Viagem"("dataSaida");
CREATE INDEX "Viagem_ufDestino_idx" ON "Viagem"("ufDestino");

CREATE INDEX "Agendamento_status_idx" ON "Agendamento"("status");

CREATE INDEX "Manutencao_status_idx" ON "Manutencao"("status");
CREATE INDEX "Manutencao_dataEntrada_idx" ON "Manutencao"("dataEntrada");
