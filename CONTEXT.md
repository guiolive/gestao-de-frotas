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
