# Gestão de Frota — Funcionalidades Implementadas

Sistema de gestão de frota construído com **Next.js 16**, **React 19**, **Prisma 7**, **SQLite (libsql)** e **TailwindCSS 4**.

---

## 🧱 Stack

- **Framework:** Next.js 16.2.2 (App Router)
- **Frontend:** React 19.2, TailwindCSS 4, Lucide Icons, Recharts
- **Backend:** Next.js Route Handlers (API routes)
- **ORM / DB:** Prisma 7 + SQLite (via `@libsql/client`)
- **Autenticação:** JWT (`jose`) + Argon2 (`@node-rs/argon2`) / bcryptjs
- **E-mail:** Nodemailer

---

## 🔐 Autenticação & Usuários

- Login com e-mail e senha (`/login`)
- JWT em cookie para sessão
- Endpoint `GET /api/auth/me` (usuário atual)
- Endpoint `POST /api/auth/login`
- Endpoint `POST /api/auth/trocar-senha` (fluxo de primeiro acesso)
- Tipos de usuário: `OPERADOR` e `ADMINISTRADOR`
- Controle de `primeiroAcesso`, `ultimoLogin`, `ativo`, `matricula`, `fotoPerfil`

---

## 🚗 Veículos

**API:** `GET/POST /api/veiculos`, `GET/PUT/DELETE /api/veiculos/[id]`
**Páginas:** lista, novo, detalhes, editar

- Cadastro com placa, marca, modelo, ano, cor, tipo, quilometragem e valor
- Status: `disponivel` | `em_uso` | `manutencao` | `inativo`
- Upload de imagens do veículo (`/api/veiculos/[id]/imagens`)
- **Alertas por KM** (troca de óleo, filtros etc.): `/api/veiculos/[id]/alertas`
  - Intervalo, última troca, antecedência de alerta e e-mail do gestor
- Endpoint de verificação de alertas: `/api/alertas/verificar`

---

## 👤 Motoristas

**API:** `GET/POST /api/motoristas`, `GET/PUT/DELETE /api/motoristas/[id]`
**Páginas:** lista, novo, detalhes, editar

- CPF e CNH únicos, categoria da CNH, telefone, e-mail
- Status: `ativo` | `inativo` | `suspenso`
- Suporte a 2 motoristas por viagem (motorista principal e secundário)

---

## 🏢 Unidades

**API:** `GET/POST /api/unidades`, `GET/PUT/DELETE /api/unidades/[id]`
**Páginas:** lista, nova, detalhes, editar

- Sigla (única) e nome
- Vínculo com viagens

---

## 🗺️ Viagens

**API:** `GET/POST /api/viagens`, `GET/PUT/DELETE /api/viagens/[id]`
**Páginas:** lista, nova, detalhes, editar

- Origem, destino, datas de saída/retorno
- KM inicial/final e KM por trecho
- Status: `agendada` | `em_andamento` | `concluida` | `cancelada`
- Campos de **PCDP** (processo oficial): número, data, valor, solicitante (incluindo PCDP2)
- Controle de **diárias**: quantidade, valor e total
- UF destino, processo SEI, observações
- Vínculo com veículo, motorista(s) e unidade

---

## 📅 Agendamentos

**API:** `GET/POST /api/agendamentos`, `GET/PUT/DELETE /api/agendamentos/[id]`
**Páginas:** lista, novo

- Solicitante, motivo, data início/fim
- Status: `pendente` | `aprovado` | `rejeitado` | `cancelado`
- Vinculado a veículo

---

## 🔧 Manutenções

**API:** `GET/POST /api/manutencoes`, `GET/PUT/DELETE /api/manutencoes/[id]`
**Páginas:** lista, nova, detalhes

- Tipo: `preventiva` | `corretiva`
- Data de entrada, previsão de saída e previsão em dias
- Custo estimado e valor total
- Status: `aguardando` | `em_andamento` | `concluida` | `cancelada`
- **Checklist** por categoria com descrição do problema (`ChecklistItem`)
- **Itens de manutenção** com serviço, valor e observação (`ItemManutencao`)
- Catálogo de serviços: `/api/servicos` e `/api/servicos/categorias` (em `src/lib/servicos-manutencao.ts`)

---

## 📊 Relatórios

**API:**
- `GET /api/relatorios/veiculos/[id]` — relatório consolidado por veículo
- `GET /api/relatorios/custos` — relatório de custos

**Página:** `/relatorios` (com gráficos via Recharts)

---

## 🖥️ Interface (Dashboard)

Layout protegido em `(dashboard)/` com **Sidebar** contendo:

- Dashboard
- Veículos
- Motoristas
- Unidades
- Viagens
- Agendamentos
- Manutenções
- Relatórios

Componentes reutilizáveis:
- `Sidebar.tsx` (menu lateral com responsividade mobile)
- `StatusBadge.tsx` (badges de status)

---

## 📁 Estrutura de Libs

- `src/lib/prisma.ts` — singleton do Prisma Client
- `src/lib/jwt.ts` — assinatura/verificação de JWT
- `src/lib/auth.ts` — helpers de autenticação
- `src/lib/email.ts` — envio de e-mails (Nodemailer)
- `src/lib/utils.ts` — utilitários gerais
- `src/lib/servicos-manutencao.ts` — catálogo de serviços de manutenção
- `src/proxy.ts` — proxy / middleware

---

## 🗄️ Modelo de Dados (Prisma)

| Modelo | Descrição |
|---|---|
| `Usuario` | Usuários do sistema (login, perfil, tipo) |
| `Veiculo` | Veículos da frota |
| `ImagemVeiculo` | Fotos anexadas ao veículo |
| `AlertaKm` | Alertas de manutenção por quilometragem |
| `Motorista` | Motoristas habilitados |
| `Unidade` | Unidades organizacionais |
| `Viagem` | Viagens com PCDP e diárias |
| `Agendamento` | Reservas/solicitações de uso |
| `Manutencao` | Ordens de manutenção |
| `ChecklistItem` | Checklist de inspeção vinculado à manutenção |
| `ItemManutencao` | Itens/serviços executados na manutenção |

---

## 📦 Uploads

Pasta `public/uploads/` usada para armazenar imagens de veículos enviadas pela API.

---

## 🌱 Seed

Script `prisma/seed.ts` disponível para popular dados iniciais.
