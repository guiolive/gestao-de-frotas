# Planejamento de Implementação — Gestão de Frota

Documento vivo de acompanhamento da implementação do sistema. Espelha o board no Trello e o painel público.

| Recurso | Link |
|---|---|
| 📊 **Painel público** | https://dlog-ufg.github.io/gestao-de-frota/ |
| 📋 **Board Trello** | https://trello.com/b/w9yQWvkc |
| 💻 **Código-fonte** | https://github.com/guiolive/gestao-de-frotas |
| 🌐 **Repo do painel** | https://github.com/dlog-ufg/gestao-de-frota |

> **Como usar:** marque o status de cada tarefa aqui e também no Trello. O painel público reflete o estado do board automaticamente. Use este arquivo como fonte de verdade durante sessões de implementação.

---

## 🟡 Fase 0 — Correções de Segurança (OWASP) — ATIVO

Correções críticas identificadas na análise OWASP Top 10. **Bloqueia** o deploy em produção.

- [ ] **Verificar se `src/proxy.ts` está sendo executado**
  O arquivo usa nome fora do padrão Next.js (deveria ser `middleware.ts`). Se não estiver rodando, todas as rotas estão abertas.
  *OWASP A01:2021 — Broken Access Control · 🔴 CRÍTICO*

- [ ] **Remover fallback hard-coded do `JWT_SECRET`** (`src/lib/jwt.ts:5`)
  Fazer o app crashar se a env var faltar.
  *OWASP A02:2021*

- [ ] **Validar upload de imagens** (`src/app/api/veiculos/[id]/imagens/route.ts`)
  Whitelist de extensões (jpg/png/webp), limite de 5 MB, verificar MIME real.
  *OWASP A03:2021*

- [ ] **Adicionar validação de input com Zod** em todas as rotas POST/PUT
  Schemas por recurso, validar antes de tocar no Prisma.
  *OWASP A03:2021*

- [ ] **Rate limit em `/api/auth/login`**
  5 tentativas/min por IP. Usar `@upstash/ratelimit` ou memória.
  *OWASP A04:2021 / A07:2021*

---

## ⏸️ Fase 1 — Autorização e RBAC

Controle de acesso por tipo de usuário e prevenção de IDOR.

- [ ] **Implementar RBAC por tipo de usuário** (`OPERADOR` x `ADMINISTRADOR`)
  Helper `requireTipo(['ADMINISTRADOR'])` aplicado em rotas sensíveis.

- [ ] **Prevenir IDOR em recursos aninhados**
  Sempre fazer WHERE com parent + child. Ex: `DELETE /api/veiculos/[id]/imagens?imagemId=X`.

- [ ] **Audit log (trilha de auditoria)**
  Tabela `AuditLog(id, usuarioId, acao, recurso, recursoId, dados, criadoEm)` + middleware.
  *OWASP A09:2021*

---

## ⏸️ Fase 2 — Hardening e Observabilidade

- [ ] **Headers de segurança** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  Bloco `headers()` no `next.config.ts`.
  *OWASP A05:2021*

- [ ] **Substituir `bcryptjs` por `@node-rs/argon2`**
  Argon2 já está nas deps. Migrar com compatibilidade retroativa (rehash no próximo login).

- [ ] **Fluxo "Esqueci minha senha" funcional**
  Handler para `/api/auth/esqueci-senha` (atualmente só na whitelist). Token de reset + e-mail via Nodemailer.

- [ ] **Monitoring e error tracking (Sentry)**
  Logs estruturados com pino.
  *OWASP A09:2021*

---

## ⏸️ Fase 3 — Funcionalidades: Viagens e PCDP

- [ ] **Busca e filtros avançados em Viagens**
  Componente `SearchFilters.tsx` client-side com debounce. Filtros: veículo, motorista, unidade, status, período, UF.

- [ ] **Workflow completo de PCDP**
  Refinar PCDP/PCDP2 (número, data, valor, solicitante). PCDP obrigatório se houver diária. Export por PCDP.

- [ ] **Notificações por e-mail** (alertas KM, manutenção)
  Conectar `/api/alertas/verificar` com cron. Disparar quando veículo se aproximar do intervalo de troca.

- [ ] **Validação de disponibilidade de veículo em viagens**
  Verificar conflito com outras viagens/manutenções no período. Sync automático de status.

---

## ⏸️ Fase 4 — Dossiê do Veículo e Relatórios

- [ ] **Dashboard principal com KPIs**
  Cards: total de veículos por status, viagens do mês, custo mensal, manutenções em andamento, próximas revisões. Gráficos Recharts.

- [ ] **Dossiê do Veículo (5 abas)**
  Resumo · Fotos · Alertas KM · Manutenções · Viagens. 6 cards (Custo Total, Dias Parado, Próxima Revisão, Viagens, KM Rodado, % do Valor). Indicador de alienação verde/amarelo/vermelho. LineChart de custos mensais.

- [ ] **Relatórios avançados** (custos, utilização, PCDP)
  Página `/relatorios`: custos por veículo/mês, filtro de período, export CSV/PDF, relatório de utilização, relatório de PCDP.

---

## ⏸️ Fase 5 — Deploy e Produção

- [ ] **Migrar SQLite → Postgres** (Supabase/Neon)
  SQLite não serve pra produção multi-usuário. Supabase é grátis e integra com Vercel.

- [ ] **CI/CD no GitHub Actions**
  Workflow: lint + typecheck + build + `prisma validate` a cada PR. Deploy automático pro preview Vercel em PRs; produção no merge em main.

- [ ] **Deploy Vercel com variáveis de ambiente**
  Projeto já vinculado (`prj_RyIHvSzXDNG4C8GP9l2UJsJjp5X3`). Configurar `DATABASE_URL`, `JWT_SECRET`, `SMTP_*`, `NEXT_PUBLIC_*`.

- [ ] **Estratégia de backup do banco**
  Backup diário (Supabase faz). Procedimento de restore documentado e testado em staging.

---

## ⏸️ Fase 6 — Documentação e Treinamento

- [ ] **Manual do usuário** (gestor de frota)
  Passo a passo: cadastrar veículo → criar viagem → registrar manutenção → consultar relatórios. Com prints.

- [ ] **Documentação da API**
  OpenAPI/Swagger. Endpoints, parâmetros, schemas, códigos de erro.

- [ ] **Treinamento e onboarding**
  Vídeo de 10 min. Ambiente de sandbox. FAQ.

---

## 📝 Convenções

- **Status das fases no Trello:**
  - `[ATIVO] Fase X` → fase em andamento (bolinha amarela no painel)
  - `[CONCLUIDO] Fase X` → fase concluída (bolinha verde)
  - sem sufixo → pendente
- **Não alterar** a lista `[EQUIPE]` — é renderizada separadamente como membros do projeto
- **Cards** no Trello ↔ **checkboxes** neste arquivo ↔ **tarefas** no painel público
- Toda mudança significativa de escopo deve entrar também neste arquivo via commit no repo do sistema

## 🔗 Referências

- **Análise OWASP Top 10:** consulte o histórico de conversas com Claude (sessão de 11/abr/2026)
- **Plano original de migração:** `~/.claude/plans/abstract-gliding-toast.md`
- **Template do painel:** https://github.com/dlog-ufg/patrimonio-dlog
