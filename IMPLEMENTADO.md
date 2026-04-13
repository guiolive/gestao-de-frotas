# Gestão de Frota — Funcionalidades Implementadas

Sistema de gestão de frota da DLOG/UFG.

**Deploy:** https://gestao-de-frota-mu.vercel.app
**Repo:** https://github.com/guiolive/gestao-de-frotas
**Board:** https://trello.com/b/w9yQWvkc
**Painel:** https://dlog-ufg.github.io/gestao-de-frota/

---

## Stack

- **Framework:** Next.js 16.2.2 (App Router, Turbopack)
- **Frontend:** React 19, TailwindCSS 4, Lucide Icons, Recharts
- **Backend:** API Routes (Route Handlers), Prisma 7
- **Banco:** PostgreSQL 16 (Neon em produção, Proxmox planejado)
- **Auth:** JWT (jose) + Argon2 (@node-rs/argon2), cookies httpOnly
- **Validação:** Zod
- **Email:** Nodemailer
- **Logging:** Pino (estruturado, redaction automática)
- **Deploy:** Vercel
- **CI/CD:** GitHub Actions (typecheck + lint + build)

---

## Segurança (OWASP Top 10)

| # | Categoria | Status |
|---|---|---|
| A01 | Broken Access Control | ✅ RBAC (OPERADOR/ADMINISTRADOR) + IDOR protection |
| A02 | Cryptographic Failures | ✅ Argon2id, JWT sem fallback, rehash retroativo |
| A03 | Injection | ✅ Prisma (parametrizado), Zod (validação), upload com magic bytes |
| A04 | Insecure Design | ✅ Rate limit (login 5/min, reset 3/5min), anti-enumeração |
| A05 | Security Misconfiguration | ✅ Headers (HSTS, CSP, XFO, Referrer-Policy, Permissions-Policy) |
| A07 | Auth Failures | ✅ Senha forte obrigatória, troca no primeiro acesso, esqueci-senha com token hash |
| A09 | Logging & Monitoring | ✅ Audit log (snapshot JSON), Pino estruturado, redaction de senhas |

---

## Autenticação e Autorização

- Login com email/senha → JWT (7 dias) em cookie httpOnly
- Rate limit por IP (sliding window in-memory)
- Troca de senha obrigatória no primeiro acesso
- "Esqueci minha senha" com token SHA-256 (1h, uso único, anti-enumeração)
- Página /resetar-senha com validação de força
- RBAC: OPERADOR (lê tudo, cria viagens/manutenções) vs ADMINISTRADOR (CRUD completo + exclusões)
- Audit log em todas as mutations (login, create, update, delete) com snapshot JSON

---

## Dashboard Operacional

Painel focado no gestor de manutenção:

- **Alertas urgentes** (vermelho): manutenções atrasadas + KM ultrapassado
- **Alertas próximos** (amarelo): preventivas se aproximando com projeção de data
- **5 cards de status**: total, disponíveis (%), em uso, manutenção, inativos
- **Manutenções em andamento**: tabela com semáforo (verde/amarelo/vermelho), dias na oficina, previsão de saída, custo
- **KPIs**: disponibilidade (meta ≥85%), MTTR, % preventiva vs corretiva (meta ≥70%), cumprimento de prazo
- **Projeção de preventivas**: data estimada baseada em KM médio/dia por veículo
- **Agendamentos**: próximos 30 dias com semáforo de urgência
- **Resumo do departamento**: metas atingidas/abaixo + contadores

---

## CRUDs

### Veículos
- Listagem com filtro por status
- Cadastro: placa (única), modelo, marca, ano, cor, tipo (carro/van/caminhao/onibus), KM, valor
- Edição de todos os campos
- Exclusão (admin only)
- Upload de até 5 imagens (JPEG/PNG/WEBP, 5 MB, magic bytes validados)
- Dossiê: 6 cards de resumo + fotos + manutenções + viagens + alertas KM com projeção

### Viagens
- Listagem com filtros avançados: busca full-text, status, veículo, motorista, unidade, UF, período
- Criação com validação de disponibilidade (conflito viagem×viagem e viagem×manutenção → 409)
- Auto-cálculo de totalDiárias (diária × quantidade)
- PCDP obrigatório quando há diárias (validação client + server)
- PCDP Motorista 1 e Motorista 2
- Status workflow: agendada → em_andamento (veículo=em_uso) → concluída (atualiza KM, veículo=disponível) / cancelada

### Manutenções
- Listagem com veículo, tipo, status, custo
- Criação com checklist de inspeção + itens de serviço (nome + valor)
- Atualização substitui checklist e itens inteiros
- Veículo muda para status "manutencao" ao criar, volta para "disponivel" ao concluir/cancelar

### Unidades
- 19 unidades da UFG pré-cadastradas (seed)
- CRUD com sigla única
- Exclusão bloqueada se houver viagens vinculadas

### Motoristas (oculto na sidebar — funcional via URL)
- CRUD com CPF e CNH únicos
- Suporte a 2 motoristas por viagem

### Agendamentos (oculto na sidebar — funcional via URL)
- CRUD com validação de conflito de horário
- Status: pendente, aprovado, rejeitado, cancelado

---

## Alertas e Notificações

- Alertas de KM por veículo (tipo, intervalo, última troca, margem de alerta, email do gestor)
- Endpoint `/api/alertas/verificar`: verifica KM + manutenções atrasadas em um POST
- Email de alerta de manutenção preventiva (template HTML)
- Email de manutenção atrasada/próxima do prazo
- Email de reset de senha

---

## Relatórios

- Relatório de custos: total, por veículo, por mês, veículo mais caro, média
- Gráficos: BarChart (custo por veículo) + LineChart (evolução mensal) via Recharts
- Filtro por período
- Export CSV (UTF-8 com BOM, separador `;` pra Excel BR)
- Relatório individual por veículo (custos, viagens, alertas, histórico)

---

## Infraestrutura

- **Banco:** PostgreSQL 16 via Neon (serverless, US East)
- **Adapter:** @prisma/adapter-pg com pg.Pool
- **Deploy:** Vercel (produção automática no push pra main)
- **CI/CD:** GitHub Actions (npm ci → prisma generate → tsc → lint → build)
- **Variáveis:** .env.example com todas documentadas
- **Backup:** pg_dump diário via cron + snapshot Proxmox (documentado em docs/SETUP-PROXMOX.md)

---

## Modelo de Dados (Prisma)

13 modelos:

1. **Usuario** — id, nome, email, senha (argon2), tipo, ativo, matricula, primeiroAcesso, ultimoLogin
2. **PasswordResetToken** — tokenHash (SHA-256), expiraEm, usadoEm
3. **AuditLog** — acao, recurso, recursoId, dados (JSON snapshot), ip, userAgent
4. **Veiculo** — placa (única), modelo, marca, ano, cor, quilometragem, valorVeiculo, tipo, status
5. **ImagemVeiculo** — url, descricao
6. **AlertaKm** — tipo, intervaloKm, ultimaTrocaKm, alertaAntesDe, emailGestor
7. **Motorista** — nome, cpf (único), cnh (único), categoriaCnh, telefone, email, status
8. **Unidade** — sigla (única), nome, ativo
9. **Viagem** — 28 campos (origem, destino, datas, KM, PCDP1/2, diárias, status)
10. **Agendamento** — veiculoId, solicitante, motivo, dataInicio, dataFim, status
11. **Manutencao** — tipo (preventiva/corretiva), descricao, datas, custos, status
12. **ChecklistItem** — categoria, temProblema, descricao
13. **ItemManutencao** — servico, valor, observacao

---

## Documentação

- `docs/MANUAL-USUARIO.md` — Manual completo do gestor de frota
- `docs/API.md` — Documentação de todos os endpoints REST
- `docs/SETUP-PROXMOX.md` — Guia de instalação do PostgreSQL no Proxmox
- `PLANEJAMENTO.md` — Checklist de implementação por fases (espelha o Trello)
- `IMPLEMENTADO.md` — Este arquivo
- `.env.example` — Template de variáveis de ambiente
