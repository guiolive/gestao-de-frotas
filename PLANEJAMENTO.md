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

## ✅ Fase 0 — Correções de Segurança (OWASP) — CONCLUÍDA

Correções críticas identificadas na análise OWASP Top 10. **Bloqueia** o deploy em produção.

- [x] **Verificar se `src/proxy.ts` está sendo executado**
  Falso alarme — `proxy.ts` é a nova convenção do Next 16 (substitui `middleware.ts`). Confirmado em `node_modules/next/dist/docs/.../proxy.md`.
  *OWASP A01:2021 — Broken Access Control · 🔴 CRÍTICO*

- [x] **Remover fallback hard-coded do `JWT_SECRET`** (`src/lib/jwt.ts:5`)
  App agora crasha no boot se a env var faltar ou tiver < 32 chars.
  *OWASP A02:2021*

- [x] **Validar upload de imagens** (`src/app/api/veiculos/[id]/imagens/route.ts`)
  Whitelist MIME (jpg/png/webp), limite 5 MB, magic bytes validados, extensão derivada do MIME validado (não do nome original).
  *OWASP A03:2021*

- [x] **Adicionar validação de input com Zod** em todas as rotas POST/PUT
  Helper `validateBody()` + schemas em `src/lib/validation.ts`. Aplicado em `/api/veiculos`, `/api/motoristas`, `/api/unidades`, `/api/auth/login`. Pendente em viagens/agendamentos/manutencoes/trocar-senha (Fase 2 ou backlog).
  *OWASP A03:2021*

- [x] **Rate limit em `/api/auth/login`**
  5 tentativas/min por IP, sliding window in-memory, retorna 429 + `Retry-After`. Migração pra `@upstash/ratelimit` adiada pra Fase 5 (multi-instance).
  *OWASP A04:2021 / A07:2021*

---

## ✅ Fase 1 — Autorização e RBAC — CONCLUÍDA

Controle de acesso por tipo de usuário e prevenção de IDOR.

- [x] **Fix do `proxy.ts`: forwarding de request headers** (descoberto durante a Fase 1)
  Bug crítico latente: o proxy fazia `response.headers.set("x-user-id", ...)`, que seta header de **resposta**, não de request. Resultado: `request.headers.get("x-user-id")` no route handler retornava `null` em todas as rotas. Corrigido com `NextResponse.next({ request: { headers: requestHeaders } })`. Sem esse fix, o RBAC não teria como funcionar.
  *OWASP A01:2021*

- [x] **Implementar RBAC por tipo de usuário** (`OPERADOR` x `ADMINISTRADOR`)
  Helpers `requireAuth(req)` e `requireTipo(req, ['ADMINISTRADOR'])` em `src/lib/authz.ts` (tupla `[user, errorResponse]`, padrão do `validateBody`). Aplicado em:
  - **ADMIN-only:** POST/PUT/DELETE de veiculos, motoristas, unidades; POST/DELETE de imagens e alertas; DELETE de viagens/agendamentos.
  - **Operador OK:** POST/PUT de viagens, agendamentos, manutencoes; trocar-senha.
  - **GETs:** continuam abertos a qualquer usuário autenticado (proxy garante).

- [x] **Prevenir IDOR em recursos aninhados**
  - `DELETE /api/veiculos/[id]/imagens?imagemId=X` → já estava OK (Fase 0)
  - `DELETE /api/veiculos/[id]/alertas?alertaId=X` → migrado de `delete()` pra `deleteMany()` com WHERE composto (parent + child)
  - `POST` em ambos: `veiculoId` vem da URL, não do body — sem IDOR possível
  - Demais rotas (`viagens/[id]`, `manutencoes/[id]`, `agendamentos/[id]`) são flat (sem parent na URL); ownership não é por usuário, então RBAC cobre o caso.

- [x] **Audit log (trilha de auditoria)**
  - Migration `20260411164006_add_audit_log` criando `AuditLog(id, usuarioId, acao, recurso, recursoId, dados, ip, userAgent, criadoEm)` com índices em `usuarioId`, `(recurso, recursoId)` e `criadoEm`
  - Helper `src/lib/audit.ts` → `logAudit({ user, acao, recurso, recursoId, dados, request })` com fire-and-forget (nunca quebra request pai), captura IP via X-Forwarded-For e User-Agent
  - **Snapshot mode:** payloads serializados via `JSON.stringify` (decisão do usuário — útil pra forense, revisar retenção em produção)
  - **Senhas NUNCA persistidas:** trocar-senha audita só metadados
  - Aplicado em: login_success/login_failure, CRUD de veiculos/motoristas/unidades/viagens/agendamentos/manutencoes/imagens/alertas, trocar-senha
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
