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

## ✅ Fase 2 — Hardening e Observabilidade — CONCLUÍDA

- [x] **Headers de segurança** (commit `a41a2e5`)
  Bloco `headers()` em `next.config.ts`: HSTS (2 anos + preload), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy (camera/mic/geo/payment/usb/FLoC), X-DNS-Prefetch-Control, poweredByHeader=false. CSP só em prod (`default-src 'self'` + `script-src 'self'` + `style-src 'self' 'unsafe-inline'` + `frame-ancestors 'none'` + `upgrade-insecure-requests`), ausente em dev pra não quebrar HMR do Turbopack.
  *OWASP A05:2021*

- [x] **Substituir `bcryptjs` por `@node-rs/argon2`** (commit `40c2034`)
  Migração gradual com backcompat: `compararSenha()` detecta formato pelo prefixo (`$2a$`/`$2b$`/`$2y$` → bcrypt; `$argon2id$` → argon2) e retorna `{ ok, needsRehash }`. No login bem-sucedido com hash legado, rehashea com argon2 e persiste junto com `ultimoLogin` (1 query, ~200-400ms só no primeiro login de cada usuário). bcryptjs fica instalado até todos os usuários migrarem. Seed já gera admin com argon2.

- [x] **Fluxo "Esqueci minha senha" funcional** (commit `8491799`)
  Migration `20260412031935_add_password_reset_token` (`PasswordResetToken` com `tokenHash` UNIQUE, FK ON DELETE CASCADE, índices em usuarioId e expiraEm).
  - `POST /api/auth/esqueci-senha`: rate limit 3/5min, token raw 32 bytes random (armazena só SHA-256), expira em 60 min, anti-enumeração (sempre 200 mesmo pra email inexistente), email fire-and-forget, audit log sempre.
  - `POST /api/auth/resetar-senha`: rate limit 10/min, valida força, transação atômica (update senha + marca token como usado + invalida todos os outros tokens pendentes do mesmo usuário).
  - Página `/resetar-senha` (Suspense + useSearchParams) + template HTML do email em `email.ts` + whitelist do proxy atualizada.
  - SMTP vazio em dev → placeholder; configurar envs reais na Fase 5.

- [x] **Logger pino estruturado** (commit `d5279e7`)
  `src/lib/logger.ts` com redaction automática de segredos (senha, token, cookie, authorization etc — viram `[REDACTED]` mesmo logando objeto inteiro), level via `LOG_LEVEL`, `pino-pretty` em dev, JSON puro em prod. Migrado `console.error`/`console.log` em `audit.ts`, `email.ts`, `prisma.ts` e rotas de auth.
  *OWASP A09:2021 — parcial. Sentry/error tracking adiado pra Fase 5 (card novo)*

---

## ✅ Fase 3 — Funcionalidades: Viagens e PCDP — CONCLUÍDA

- [x] **Busca e filtros avançados em Viagens** (commit `b3a4291`)
  Busca full-text (destino, origem, solicitante, processo SEI) + filtros por veículo, motorista, unidade, UF destino, período de datas. Server-side via Prisma `contains` + `gte/lte`. UI com contagem de resultados e botão "Limpar filtros".

- [x] **Workflow completo de PCDP** (commit `b3a4291`)
  Auto-cálculo de `totalDiárias` (diária × qtdDiárias) no client e no server. PCDP Motorista 1 obrigatório quando há diárias (validação dupla: client com `alert()` + server com 400). Labels de obrigatoriedade na UI. Seção PCDP auto-expandida quando dados existem.

- [x] **Notificações por e-mail** (alertas KM, manutenção) (commit `b3a4291`)
  Endpoint `/api/alertas/verificar` agora verifica alertas de KM **e** manutenções atrasadas/próximas do prazo em um só POST. Nova função `enviarEmailManutencao()` em `src/lib/email.ts`. Requer `EMAIL_GESTOR_FROTA` no `.env`. Cron externo (Vercel Cron ou GitHub Actions) a ser configurado na Fase 5.

- [x] **Validação de disponibilidade de veículo em viagens** (commit `b3a4291`)
  POST `/api/viagens` agora verifica conflitos com viagens ativas/agendadas e manutenções (aguardando/em_andamento) no período solicitado. Retorna HTTP 409 com mensagem descritiva (nome do motorista, destino). Sync automático de status do veículo já existia no PUT (Fase 0).

---

## ⏸️ Fase 4 — Dossiê do Veículo e Relatórios — ATIVO

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

- [ ] **Sentry / error tracking em produção** *(adiado da Fase 2)*
  `@sentry/nextjs` + DSN em env var Vercel. Wizard automático. Source maps no build. Filtrar PII via `beforeSend` (pino já faz redaction). Complementa o logging estruturado do pino.
  *OWASP A09:2021*

---

## ⏸️ Fase 6 — Documentação e Treinamento

- [ ] **Manual do usuário** (gestor de frota)
  Passo a passo: cadastrar veículo → criar viagem → registrar manutenção → consultar relatórios. Com prints.

- [ ] **Documentação da API**
  OpenAPI/Swagger. Endpoints, parâmetros, schemas, códigos de erro.

- [ ] **Treinamento e onboarding**
  Vídeo de 10 min. Ambiente de sandbox. FAQ.

---

## ⏸️ Funcionalidades Ocultas (voltar depois)

As funcionalidades abaixo foram **ocultadas da sidebar** (comentadas no `src/components/Sidebar.tsx`) para manter o foco nas manutenções nesta fase. As rotas, APIs e páginas continuam existindo — só não aparecem na navegação.

- **Motoristas** (`/motoristas`) — CRUD completo funcional. Reativar quando o fluxo de manutenções estiver validado em produção.
- **Agendamentos** (`/agendamentos`) — CRUD completo funcional. Reativar junto com motoristas.

> Para reativar: descomentar as linhas no array `NAV_ITEMS` em `src/components/Sidebar.tsx`.

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
