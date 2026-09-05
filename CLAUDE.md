@AGENTS.md

# Projeto

- Sistema de gestão de frota da DLOG/UFG em uso real. **Não é projeto
  educacional**: modo faça-funcionar — entregue pronto, sem exercício no meio.
- Vocabulário do domínio em `CONTEXT.md`; use os termos de lá.
- Testes: `npm test` (vitest). Módulos puros em `src/lib` (ex.: `bateria.ts`,
  `alertaKm.ts`) são o padrão para regra de negócio: sem Prisma/Next, relógio
  injetado.
