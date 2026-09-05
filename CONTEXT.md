# CONTEXT.md — vocabulário do domínio

Termos usados no código. Um termo, um significado; o módulo dono do termo é
quem define a regra.

## AlertaKm (`src/lib/alertaKm.ts`)

- **AlertaKm** — regra de manutenção preventiva por quilometragem de um veículo:
  a cada `intervaloKm`, contado a partir de `ultimaTrocaKm`.
- **kmProxima** — `ultimaTrocaKm + intervaloKm`; km em que a manutenção vence.
- **kmRestante** — `kmProxima - kmAtual`; negativo quando já passou.
- **Status do AlertaKm** — `ok` | `alerta` | `vencido`. `vencido` quando
  `kmRestante <= 0`; `alerta` quando `kmRestante <= alertaAntesDe`. Mesma família
  de palavras da bateria (`ok` | `alerta` | `vencida`).
- **kmMedioDia** — km rodado por dia desde a primeira viagem com km registrado;
  exige 2+ viagens; usado só para projetar `dataEstimada`.
- **Próximo alerta** — o que precisa de ação primeiro: o vencido mais atrasado;
  sem vencidos, o de menor `kmRestante`.
- **Tipo de alerta** — enum `alertaKmTipoEnum`; o label vem de
  `LABEL_TIPO_ALERTA` (um lugar só; e-mail e telas usam o mesmo).

## Bateria (`src/lib/bateria.ts`)

- **Status da bateria** — `ok` | `alerta` | `vencida`, por `dataInstalacao +
  vidaUtilMeses` contra `hoje`.

## OS de manutenção (`src/lib/manutencao.ts`)

- **OS** — ordem de serviço de manutenção de um veículo (model `Manutencao`).
- **Status da OS** — `aguardando` → `em_andamento` → `concluida`; `aguardando` |
  `em_andamento` → `cancelada`. `concluida` e `cancelada` são terminais
  (reabrir = nova OS). Não se pula etapa. A API recusa transição inválida (409).
- **OS aberta** — status `aguardando` ou `em_andamento`.
- **Efeito no veículo** — OS aberta → veículo `manutencao`; OS terminal →
  veículo `disponivel` **só se não houver outra OS aberta** do mesmo veículo.
  Veículo `inativo` nunca é tocado, e não aceita abertura de OS (409).
- **Custo da OS** — soma dos itens; sem itens com valor, cai no `valorTotal`
  gravado (OS legada). `valorTotal` persistido é a soma dos itens, ou null.
- **Prazo da OS** — OS aberta × `previsaoSaida`: `diasRestantes` (negativo =
  passou; null sem previsão) e `atrasada`.
- **Situação Prime** — rastreio na oficina terceirizada: `enviada`
  (`enviadaPrimeEm`), `retornou` (`retornoEfetivoEm`), `emAtraso` (enviada, sem
  retorno, previsão passada) e `diasAtraso`. É pergunta diferente de "prazo da
  OS": uma é sobre o combinado com a Prime, a outra sobre a OS em si.
