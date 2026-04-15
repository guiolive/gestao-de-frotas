# Aula para Iniciante — Entendendo o AP e o FROT

**Para:** Guilherme (Diretor de Logística UFG, aprendendo a programar)
**Objetivo:** Ler no ônibus/avião da viagem de amanhã e sair entendendo **tudo**
que está rodando nos seus dois projetos — AchadosPerdidos (AP) e Gestão de
Frota (FROT). Cada seção tem: (1) explicação em português claro, (2) como
aparece no seu código, (3) vídeos pra se aprofundar.

> **Como usar este documento:**
> Leia da seção 1 até a 12 na ordem. Cada seção tem um "🎥 Vídeos" no final —
> esses são os que valem a pena assistir depois, quando tiver tempo. As três
> primeiras seções (1, 2, 3) são o mínimo pra tudo fazer sentido. Se você só
> tiver tempo pra três vídeos na viagem inteira, assista os que estão marcados
> com ⭐.

---

## Índice

1. [Panorama — o que é cada tecnologia](#1-panorama)
2. [O alicerce — JavaScript](#2-javascript)
3. [TypeScript — JavaScript com "regras"](#3-typescript)
4. [React — o "esqueleto" da tela](#4-react)
5. [Dois jeitos de fazer backend: Express vs Next.js](#5-express-vs-nextjs)
6. [Rotas e APIs REST — como frontend conversa com backend](#6-apis-rest)
7. [Banco de dados: SQL, Postgres e Prisma](#7-banco-de-dados)
8. [Autenticação: JWT, cookies, senhas com Argon2/Bcrypt](#8-autenticacao)
9. [Middleware — o porteiro das requisições](#9-middleware)
10. [Validação com Zod + variáveis de ambiente](#10-validacao-env)
11. [Deploy — tirando do seu computador e botando na internet (Vercel)](#11-deploy)
12. [Comparação lado a lado: AP × FROT](#12-comparacao)
13. [Roadmap de estudo — o que aprender em qual ordem](#13-roadmap)
14. [Glossário rápido](#14-glossario)

---

## 1. Panorama

Antes de qualquer coisa, é importante entender que **programar web tem duas
grandes partes**:

- **Frontend:** o que o usuário vê no navegador. É HTML + CSS + JavaScript,
  rodando no computador do cliente.
- **Backend:** o que fica no servidor, escondido. Recebe pedidos do frontend,
  fala com banco de dados, faz contas, manda email, e devolve uma resposta.

Seus dois projetos fazem as duas coisas — mas **de jeitos diferentes**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ACHADOS PERDIDOS                             │
│                                                                      │
│   Frontend (Vite + React) ←─── HTTP ───→ Backend (Express + Prisma)  │
│   pasta: client/                         pasta: server/              │
│   roda na porta 5173                     roda na porta 3000          │
│                                                                      │
│   → São DOIS projetos separados que conversam por HTTP.              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         GESTÃO DE FROTA                              │
│                                                                      │
│   ┌──────────────── Next.js (um só projeto) ──────────────────┐      │
│   │                                                           │      │
│   │  Páginas React (src/app/**/page.tsx)                      │      │
│   │           ↕ (tudo dentro da mesma pasta, mesmo servidor)  │      │
│   │  API Routes (src/app/api/**/route.ts)                     │      │
│   │           ↕                                               │      │
│   │  Prisma → PostgreSQL                                      │      │
│   └───────────────────────────────────────────────────────────┘      │
│                                                                      │
│   → UM projeto só, frontend + backend juntos.                        │
└──────────────────────────────────────────────────────────────────────┘
```

**A "stack" (conjunto de tecnologias) deles é:**

| Camada | AchadosPerdidos | Gestão de Frota |
|---|---|---|
| **Linguagem** | TypeScript | TypeScript |
| **Frontend** | React 18 + Vite | React 18 (dentro do Next) |
| **Estilização** | Tailwind CSS 3 | Tailwind CSS 3 |
| **Backend** | Express 4 (Node.js) | Next.js 14 API Routes |
| **ORM (banco)** | Prisma 6 | Prisma 7 |
| **Banco** | PostgreSQL | PostgreSQL (Neon) |
| **Auth** | JWT + Bcrypt | JWT + Argon2id |
| **Validação** | Zod | Zod |
| **Deploy** | Não sei ainda | Vercel |

**Por que os dois projetos são "parecidos mas diferentes"?** Porque você pediu
pra eles serem assim — o AP usa a stack mais tradicional (Express + Vite
separados), o FROT usa Next.js que é "tudo-em-um". As peças individuais
(React, Prisma, TypeScript, PostgreSQL, Tailwind, Zod) são **as mesmas**. O
que muda é o "encaixe".

### 🎥 Vídeos desta seção

- ⭐ **"O que é Front-end, Back-end, Full-stack? | Rocketseat"** — canal
  Rocketseat no YouTube, 5 minutos, explica exatamente o que acabei de dizer
  acima mas com animação. Procure: `rocketseat front-end back-end full-stack`
- **"Como funciona a internet? (por trás dos panos)"** — canal Fabio Akita,
  mais longo (~30min), dá a visão geral de como HTTP, servidor e cliente se
  conversam. Opcional, mas excelente.

---

## 2. JavaScript

**JavaScript (JS)** é a linguagem que roda no navegador. Originalmente só
servia pra fazer botõezinhos piscarem; hoje é a linguagem mais usada do mundo
e também roda em servidor (via **Node.js**). Seus dois projetos são
**100% JavaScript/TypeScript** — do frontend ao backend.

**Coisas que você ESTÁ usando em JS mesmo sem perceber:**

- **Variáveis:** `const nome = "Guilherme"` (constante), `let idade = 30`
  (muda de valor).
- **Funções:** blocos de código reutilizáveis.
  ```js
  function somar(a, b) { return a + b; }
  // ou arrow function (mesma coisa, sintaxe moderna):
  const somar = (a, b) => a + b;
  ```
- **Arrays:** listas. `const frota = ["carro1", "carro2", "carro3"]`
- **Objetos:** "dicionários" de chave/valor.
  ```js
  const veiculo = { placa: "ABC1234", km: 50000, status: "disponivel" };
  ```
- **Async/await:** jeito moderno de lidar com operações que demoram (ex:
  esperar o banco responder). Você vai ver isso **em tudo**:
  ```ts
  // Espera o Prisma achar o veículo, depois guarda na variável.
  const veiculo = await prisma.veiculo.findUnique({ where: { id } });
  ```

**Onde aparece nos seus projetos:** **em todo lugar.** TypeScript é só
JavaScript com tipos — tudo que vale pra JS vale pra TS.

### 🎥 Vídeos desta seção

- ⭐ **"Curso de JavaScript em 1 HORA (pra QUEM NUNCA programou) | Rocketseat"**
  — se você só puder ver um vídeo de JS, é esse. Cobre variáveis, funções,
  arrays, objetos, condicionais. Procure: `rocketseat javascript 1 hora`
- **"Aprenda Async/Await em 10 minutos | Hora de Codar"** — vídeo curto do
  Matheus Battisti sobre o conceito de `async/await` que aparece em todas as
  rotas do seu backend. Procure: `hora de codar async await`
- **"Array.map, filter, reduce - Rocketseat"** — esses três métodos você vê
  muito (ex: transformar uma lista de veículos em outra coisa pra mostrar na
  tela). Procure: `rocketseat map filter reduce`

---

## 3. TypeScript

**TypeScript (TS)** é JavaScript **com sistema de tipos**. Você diz que uma
variável é um número, um texto, um objeto com tal formato — e o computador
avisa antes de rodar se você fez besteira. É a linguagem dos dois projetos.

**Antes (JS):**
```js
function calcularKmPercorrido(kmInicial, kmFinal) {
  return kmFinal - kmInicial;
}
calcularKmPercorrido("olá", 100);  // 💥 NaN (em runtime, descobre tarde)
```

**Depois (TS):**
```ts
function calcularKmPercorrido(kmInicial: number, kmFinal: number): number {
  return kmFinal - kmInicial;
}
calcularKmPercorrido("olá", 100);  // 🚨 ERRO na hora que você digita
```

**Por que TS vale a pena:**
- Pega bug antes de rodar.
- O VS Code (editor) te dá autocomplete baseado nos tipos. Você digita
  `veiculo.` e ele lista todos os campos: `placa`, `modelo`, `ano`...
- Serve de "documentação viva" do código.

**Onde aparece nos seus projetos:** tudo é `.ts` ou `.tsx`. No FROT, quando
você vê algo tipo:
```ts
export default async function VisualizarViagemPage({
  params,
}: {
  params: { id: string };
}) {
```
Isso significa: "essa função recebe um objeto com uma propriedade `params`
que tem `id` do tipo string". Puro TypeScript.

**Dois conceitos importantes:**
- `interface` e `type` — jeitos de **dar nome** a um formato de objeto.
  ```ts
  interface User {
    nome: string;
    tipo: "OPERADOR" | "ADMINISTRADOR";  // só pode ser um desses dois!
  }
  ```
- **Generics** (`<T>`) — tipos "parametrizados". Mais avançado. Você vê em
  `useState<User | null>(null)` — "um estado que é ou um User ou null".

### 🎥 Vídeos desta seção

- ⭐ **"TypeScript em 30 minutos | Rocketseat"** — já assume que você sabe JS
  e mostra só as adições de tipo. Procure: `rocketseat typescript 30 minutos`
- **"TypeScript para iniciantes | Matheus Battisti — Hora de Codar"** — mais
  longo, mais pé-no-chão. Procure: `hora de codar typescript`
- **"Devaria usar TypeScript em 2025? | Fabio Akita"** — ótima reflexão
  filosófica, não é tutorial. Assista depois.

---

## 4. React

**React** é uma biblioteca pra **construir interfaces (telas)** em JavaScript.
Inventada pelo Facebook. A ideia central: você escreve **componentes**
(pedaços reutilizáveis de tela) como se fossem funções que retornam HTML.

**Exemplo simples:**
```tsx
function BotaoPrimario({ texto }: { texto: string }) {
  return (
    <button className="bg-blue-600 text-white px-4 py-2 rounded">
      {texto}
    </button>
  );
}

// Usando:
<BotaoPrimario texto="Salvar" />
<BotaoPrimario texto="Cancelar" />
```

**JSX** é esse "HTML dentro do JavaScript". Não é HTML de verdade — o React
transforma em chamadas de função, mas pra você parecer HTML. Em TypeScript,
arquivos com JSX terminam em `.tsx`.

### Os 3 conceitos que você PRECISA dominar em React

#### 1. **Props** — passar dados pro componente
```tsx
function Saudacao({ nome }: { nome: string }) {
  return <h1>Olá, {nome}!</h1>;
}
<Saudacao nome="Guilherme" />
```

#### 2. **State (`useState`)** — memória do componente
```tsx
import { useState } from "react";

function Contador() {
  const [valor, setValor] = useState(0);
  //     ↑        ↑          ↑
  //  valor atual  função  valor inicial
  //               pra mudar

  return (
    <button onClick={() => setValor(valor + 1)}>
      Cliquei {valor} vezes
    </button>
  );
}
```
**Toda vez que `setValor` é chamado, o React re-renderiza o componente** com
o novo valor. Esse é o coração do React.

#### 3. **Efeitos (`useEffect`)** — fazer algo quando o componente aparece ou
quando uma dependência muda. No seu `Sidebar.tsx` do FROT:

```tsx
useEffect(() => {
  fetch("/api/auth/me")
    .then((r) => (r.ok ? r.json() : null))
    .then(setUser)
    .catch(() => {});
}, []);
```
**Tradução:** "quando o componente montar (array vazio `[]` = só uma vez),
buscar o usuário logado e guardar no state."

### Componentes do seu FROT pra você ler hoje
- `src/components/Sidebar.tsx` — barra lateral. Usa `useState` pra abrir no
  mobile, `useEffect` pra carregar o usuário, `usePathname` pra saber qual
  item do menu está ativo.
- `src/components/StatusBadge.tsx` (veja esse depois) — componente simples que
  recebe um status e pinta a cor certa. Puro props.

### 🎥 Vídeos desta seção

- ⭐⭐ **"Curso de React — Rocketseat (primeiras aulas gratuitas)"** — procure
  por `rocketseat react curso grátis`. As 4–5 primeiras aulas cobrem
  componentes, props, state e useEffect. É o básico do básico.
- ⭐ **"React useState e useEffect explicados | Willian Justen"** — Willian é
  excelente, didática limpa. Procure: `willian justen usestate useeffect`
- **"React em 100 segundos | Fireship (legendado)"** — pra ter visão geral
  super rápida do que é React e por que existe. Em inglês mas tem legenda
  automática.
- **"Criando o primeiro componente React | Matheus Battisti — Hora de Codar"**
  — tutorial pé-no-chão que você pode replicar.

### Atalho mental pra entender React
> "React é React. Esqueça jQuery, esqueça manipular o DOM na mão. Você só
> muda o state; o React redesenha a tela sozinho."

---

## 5. Express vs Next.js

Aqui está a **grande diferença** entre seus dois projetos.

### Express (usado no AchadosPerdidos)

**Express** é o framework mais antigo e famoso pra fazer servidor web em
Node.js. É **minimalista**: ele te dá ferramentas pra definir rotas HTTP e
pronto. Tudo mais (banco, auth, upload de arquivo) você junta de bibliotecas
separadas.

```js
// server/src/index.ts (AchadosPerdidos — simplificado)
import express from "express";

const app = express();
app.use(express.json());  // pra ler body JSON

app.get("/api/veiculos", async (req, res) => {
  const veiculos = await prisma.veiculo.findMany();
  res.json(veiculos);
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  // ... verifica senha
  res.json({ token: "..." });
});

app.listen(3000, () => console.log("Servidor no ar!"));
```

**Características do Express:**
- 100% backend. Não sabe o que é tela.
- Você escreve o frontend em outro projeto (Vite + React, no seu caso).
- Os dois conversam por HTTP (o frontend faz `fetch("/api/...")` pro backend).
- **Vantagem:** você entende exatamente o que está acontecendo. É tudo
  explícito. Ótimo pra aprender.
- **Desvantagem:** mais coisas pra configurar. Você decide tudo manualmente
  (CORS, autenticação de cookie, etc.).

### Next.js (usado no Gestão de Frota)

**Next.js** é um framework **fullstack** em cima do React. Ele une frontend
e backend num projeto só, com um monte de convenções.

Em Next, a **pasta** onde você cria o arquivo decide a URL:

| Arquivo | URL que ele responde |
|---|---|
| `src/app/page.tsx` | `/` (dashboard) |
| `src/app/veiculos/page.tsx` | `/veiculos` |
| `src/app/veiculos/[id]/page.tsx` | `/veiculos/abc-123` (qualquer id) |
| `src/app/api/veiculos/route.ts` | `/api/veiculos` (endpoint de API) |

E no mesmo projeto, tem:
- **Páginas** (`page.tsx`) — componentes React que o usuário vê no navegador.
- **API Routes** (`route.ts`) — funções que rodam no servidor, como no Express.
- **Middleware** (`middleware.ts`) — roda **antes** de qualquer rota, pra
  verificar auth, redirecionar, etc.

```ts
// src/app/api/veiculos/route.ts (FROT)
import { prisma } from "@/lib/prisma";

export async function GET() {
  const veiculos = await prisma.veiculo.findMany();
  return Response.json(veiculos);
}
```

**Vantagens do Next:**
- Um projeto só, um deploy só.
- Muita mágica conveniente (roteamento, otimizações, server components).
- Ótimo pra SEO (páginas já vêm prontas do servidor).

**Desvantagens:**
- Muita mágica escondida — difícil saber o que tá acontecendo quando quebra.
- Versões novas mudam rápido (você sentiu isso hoje, por isso voltamos pro
  14).

### Então qual é melhor?
**Nenhum.** São ferramentas diferentes pra gostos diferentes. Pro aprendizado,
Express é mais didático porque é explícito. Pra um projeto real tipo o FROT,
Next economiza muito tempo.

### 🎥 Vídeos desta seção

- ⭐⭐ **"Express vs Next.js: QUAL escolher? | Rocketseat ou Fabio Akita"** —
  procure `express vs next.js qual escolher português`. Vários canais
  abordaram.
- ⭐ **"Criando uma API com Node.js e Express | Rocketseat"** — curso curto
  gratuito que mostra tudo que você já tem no AP mas em um tutorial guiado.
  Procure: `rocketseat api node express`
- ⭐ **"Next.js 14 — Curso completo para iniciantes | Matheus Battisti"** —
  4h de curso gratuito cobrindo o Next 14, **exatamente** a versão que o FROT
  está usando agora. Procure: `hora de codar next 14 curso`
- **"Por que eu abandonei o Next.js | Fabio Akita"** — vídeo polêmico,
  interessante pra ter visão crítica. Não é hate, é análise.

---

## 6. APIs REST

**API** é "Application Programming Interface" — a forma que um software
tem de pedir pra outro fazer coisas. **REST** é um estilo comum de API web.

### O básico

Uma API REST usa **verbos HTTP** pra dizer **o que quer fazer**, e **URLs**
pra dizer **com qual recurso**:

| Verbo | Significa | Exemplo |
|---|---|---|
| **GET** | Buscar (ler) | `GET /api/veiculos` → lista todos |
| **GET** | Buscar um | `GET /api/veiculos/abc-123` → um específico |
| **POST** | Criar | `POST /api/veiculos` (com body JSON) → cria novo |
| **PUT** | Atualizar | `PUT /api/veiculos/abc-123` → sobrescreve |
| **PATCH** | Atualizar parcial | `PATCH /api/veiculos/abc-123` → só alguns campos |
| **DELETE** | Apagar | `DELETE /api/veiculos/abc-123` → apaga |

O frontend **chama** essas URLs usando `fetch()` (API nativa do navegador).
Exemplo no seu FROT:

```ts
// Dentro de um componente React:
async function salvarVeiculo(dados) {
  const res = await fetch("/api/veiculos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error("Erro ao salvar");
  return await res.json();
}
```

E no backend (Next.js), **a mesma URL** é respondida por:
```ts
// src/app/api/veiculos/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const novo = await prisma.veiculo.create({ data: body });
  return Response.json(novo, { status: 201 });
}
```

### Códigos de status HTTP que você vai ver sempre

| Código | Significa |
|---|---|
| **200** OK | Tudo certo |
| **201** Created | Criado com sucesso (POST) |
| **204** No Content | Deletado com sucesso |
| **307/308** Redirect | Vai pra outro lugar (você viu isso no `/` → `/login`) |
| **400** Bad Request | Você mandou dado errado |
| **401** Unauthorized | Não está logado |
| **403** Forbidden | Logado mas não tem permissão |
| **404** Not Found | O recurso não existe |
| **409** Conflict | Conflito (ex: placa duplicada, viagem no mesmo horário) |
| **500** Server Error | Explodiu no servidor |

### 🎥 Vídeos desta seção

- ⭐ **"O que é uma API REST? | Rocketseat"** — 10min, conceito explicado
  visualmente. Procure: `rocketseat api rest`
- **"HTTP Status Codes explicados | Fernanda Kipper"** — ótimo vídeo em PT-BR
  sobre 2xx/3xx/4xx/5xx. Procure: `fernanda kipper status http`
- **"fetch, axios, e chamadas de API no React | Willian Justen"** — mostra os
  dois jeitos de consumir API no frontend. Procure: `willian justen fetch api`

---

## 7. Banco de Dados

Seus dois projetos usam **PostgreSQL** (banco relacional) via **Prisma**
(ORM).

### PostgreSQL

PostgreSQL (ou "Postgres") é um banco **relacional**: dados ficam em
**tabelas** com **colunas** e **linhas**, e as tabelas se relacionam via
**chaves estrangeiras** (foreign keys).

Exemplo das suas tabelas no FROT:
```
TABELA veiculos                  TABELA manutencoes
┌────────┬────────┬────┐         ┌────┬──────────┬──────┬──────┐
│ id     │ placa  │ km │         │ id │veiculoId │ tipo │custo │
├────────┼────────┼────┤         ├────┼──────────┼──────┼──────┤
│ abc123 │ ABC1234│50k │ ◄──────│ m1 │ abc123   │ prev │ 500  │
│ xyz789 │ XYZ5678│30k │         │ m2 │ abc123   │ corr │ 800  │
└────────┴────────┴────┘         └────┴──────────┴──────┴──────┘
                                          ↑
                                 foreign key aponta pro veículo
```

**SQL** é a linguagem clássica pra falar com banco:
```sql
SELECT * FROM veiculos WHERE status = 'disponivel';
UPDATE veiculos SET km = 51000 WHERE id = 'abc123';
```

### Prisma — o ORM

**ORM** = "Object-Relational Mapper". Traduzido: "cola entre objetos do
JavaScript e tabelas do banco". Você escreve JavaScript/TypeScript ao invés
de SQL na mão.

**Sem Prisma (SQL cru):**
```ts
const result = await db.query(
  "SELECT * FROM veiculos WHERE id = $1",
  [id]
);
const veiculo = result.rows[0];
```

**Com Prisma:**
```ts
const veiculo = await prisma.veiculo.findUnique({
  where: { id },
  include: { manutencoes: true },  // também traz as manutenções relacionadas
});
```

**Muito mais limpo**, com autocomplete, e **100% type-safe** — o TypeScript
sabe exatamente quais campos a tabela tem porque o Prisma gera os tipos
automaticamente a partir do `schema.prisma`.

### O arquivo `schema.prisma`

É onde você **descreve as tabelas** num formato próprio do Prisma. Do FROT:

```prisma
model Veiculo {
  id            String       @id @default(cuid())
  placa         String       @unique
  modelo        String
  quilometragem Int          @default(0)
  status        String       @default("disponivel")

  manutencoes   Manutencao[]  // relação 1-para-muitos
  viagens       Viagem[]
}

model Manutencao {
  id         String   @id @default(cuid())
  veiculoId  String
  tipo       String
  custoEstimado Decimal?
  veiculo    Veiculo  @relation(fields: [veiculoId], references: [id])
}
```

Quando você roda `npx prisma migrate dev`, o Prisma compara o schema com o
banco e **gera um SQL de migração** pra ajustar. É o jeito moderno de
gerenciar evolução do banco.

### 🎥 Vídeos desta seção

- ⭐⭐ **"Prisma ORM — Curso completo iniciante | Rocketseat"** — procure:
  `rocketseat prisma curso`. Cobre schema, migrations, queries. É *exatamente*
  o que você tem nos dois projetos.
- ⭐ **"PostgreSQL em 30 minutos | Full Cycle"** — visão geral do Postgres
  pra quem vem de nada. Procure: `full cycle postgres 30 minutos`
- **"SQL básico pra devs — SELECT, INSERT, UPDATE, DELETE | Dev Soutinho"**
  — se quiser entender o SQL por trás do Prisma, este é direto ao ponto.
  Procure: `dev soutinho sql básico`
- **"Prisma Studio — visualizando seu banco pelo navegador"** — `npx prisma
  studio` abre uma interface web pra editar o banco. Muito útil pra debugar!

---

## 8. Autenticação

Os dois projetos usam o mesmo padrão de auth: **JWT (JSON Web Token)** +
**senha com hash**. Só muda o algoritmo do hash (AP usa **bcrypt**, FROT usa
**argon2id**).

### Passo a passo do login (igual nos dois)

```
1. Usuário digita email + senha no frontend
           │
           ▼
2. Frontend manda POST /api/auth/login com {email, senha}
           │
           ▼
3. Backend busca o usuário no banco pelo email
           │
           ▼
4. Backend compara a senha digitada com o hash guardado no banco
   (NUNCA guardamos senha em texto! Só o hash.)
           │
           ▼
5. Se bater, backend gera um JWT assinado com o JWT_SECRET
   Ex: "eyJhbGci...fake.token.aqui"
           │
           ▼
6. Backend manda o JWT de volta num cookie httpOnly (invisível pro JS)
           │
           ▼
7. Browser guarda o cookie automaticamente
           │
           ▼
8. Próximas requisições levam o cookie junto
   Backend verifica a assinatura do JWT → sabe quem é o usuário.
```

### Por que JWT?

Um JWT é um "crachá digital" assinado pelo servidor. Contém info tipo
`{id: "abc", email: "x@y.com", tipo: "ADMIN"}` e uma assinatura que só quem
tem o `JWT_SECRET` consegue validar. Vantagem: **não precisa guardar sessão
no banco**. O servidor só olha a assinatura e confia.

Desvantagem: se você quer **invalidar** um token (ex: usuário fez logout),
tem que ter uma blocklist, porque o JWT em si continua válido até expirar.
Por isso os seus tokens expiram em 7 dias.

### Por que hash de senha (argon2/bcrypt)?

Porque **nunca, nunca, nunca** guardamos senha em texto puro. Se o banco for
roubado, as senhas não vazam.

Hash é uma função "de via única": você consegue ir de senha → hash, mas não
do hash → senha. Na hora do login, a gente hasheia a senha digitada com o
mesmo algoritmo e compara o resultado.

| Algoritmo | Onde | Por quê |
|---|---|---|
| **bcrypt** | AchadosPerdidos | Padrão da indústria por 20+ anos. Seguro e simples. |
| **argon2id** | Gestão de Frota | Vencedor do Password Hashing Competition 2015. Mais resistente a GPUs. |

**No FROT tem uma coisa bacana:** se um usuário antigo ainda tem senha em
bcrypt (migração do sistema antigo), o código detecta isso no login e
**rehasheia pro argon2id automaticamente**. Você nunca precisa migrar em
massa.

### Cookies `httpOnly`

Quando o backend manda o JWT de volta, ele vem em um cookie marcado como
`httpOnly`. Isso significa: **JavaScript no navegador NÃO consegue ler esse
cookie**. Só o browser manda ele automaticamente nas próximas requisições.

**Por que isso importa?** Porque protege contra XSS (Cross-Site Scripting).
Se alguém conseguir rodar JS malicioso na sua página, ainda assim não vai
conseguir roubar o token.

### 🎥 Vídeos desta seção

- ⭐⭐ **"Autenticação com JWT — Node.js | Rocketseat"** — cobre tudo. Procure:
  `rocketseat jwt autenticação node`
- ⭐ **"Bcrypt vs Argon2 — Qual usar? | Fabio Akita"** — comparação das duas
  opções. Procure: `fabio akita bcrypt argon2`
- **"Cookies, localStorage, sessionStorage — onde guardar o token? | Matheus
  Battisti"** — spoiler: cookie httpOnly vence. Procure: `hora de codar cookies
  token jwt`
- **"O que é XSS e CSRF? (ataques web)| DevDoido"** — entenda os ataques
  contra os quais você está se defendendo. Procure: `devdoido xss csrf`

---

## 9. Middleware

**Middleware** é um código que **roda no meio do caminho** de uma requisição,
antes de chegar na rota final. Você pode pensar como "camadas de cebola":

```
Requisição
    │
    ▼
┌─────────────────┐
│  Middleware 1   │  (ex: log da requisição)
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Middleware 2   │  (ex: verifica JWT)
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Rota final     │  (ex: GET /api/veiculos)
└─────────────────┘
    │
    ▼
Resposta
```

Cada middleware pode:
1. **Deixar passar** (chamar `next()`) pro próximo.
2. **Cortar** a requisição e devolver resposta (ex: "401 Unauthorized").
3. **Enriquecer** a requisição (ex: adicionar `req.user = {...}` pra rota
   final usar).

### No Express (AP)

```js
function autenticar(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Sem token" });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;   // enriquece a request
    next();            // passa pro próximo
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

// Usa em rotas protegidas:
app.get("/api/veiculos", autenticar, async (req, res) => {
  // req.user já existe aqui!
});
```

### No Next.js (FROT)

Next tem **um arquivo especial** chamado `src/middleware.ts` que roda antes
de todas as rotas. O seu faz exatamente isso:

```ts
// src/middleware.ts (simplificado)
import { NextRequest, NextResponse } from "next/server";
import { verificarToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas: deixa passar
  if (pathname.startsWith("/login")) return NextResponse.next();

  // Pega o token do cookie
  const token = request.cookies.get("token")?.value;
  if (!token) {
    // Redireciona pro login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verifica
  const user = await verificarToken(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Propaga o usuário pra rota final via headers
  const headers = new Headers(request.headers);
  headers.set("x-user-id", user.id);
  headers.set("x-user-tipo", user.tipo);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!login|api/auth/login|_next/static).*)"],
};
```

Foi justamente esse arquivo que quebrou o deploy na madrugada — ele depende
de `JWT_SECRET` estar setado, e a variável não existia no ambiente de
Preview do Vercel. Está documentado em detalhe no `RELATORIO-NOITE.md`.

### 🎥 Vídeos desta seção

- ⭐ **"Middleware no Express — explicado do zero | Rocketseat"** — procure:
  `rocketseat express middleware`
- **"Middleware no Next.js 14 | Matheus Fraga"** — exemplo prático igual ao
  que você tem. Procure: `next.js middleware 14`

---

## 10. Validação e Env Vars

### Zod — validação

**Zod** é uma biblioteca pra declarar "esquemas" de dados e **validar**
entradas. Evita que o usuário mande lixo pro banco.

```ts
import { z } from "zod";

const criarVeiculoSchema = z.object({
  placa: z.string().min(7).max(8),
  modelo: z.string().min(2),
  ano: z.number().int().min(1990).max(2030),
  tipo: z.enum(["carro", "van", "caminhao", "onibus"]),
});

// Na rota:
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = criarVeiculoSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ erros: result.error.format() }, { status: 400 });
  }
  // A partir daqui, `result.data` é 100% type-safe e validado.
  const veiculo = await prisma.veiculo.create({ data: result.data });
  return Response.json(veiculo);
}
```

**Genial:** o Zod **gera o tipo TypeScript** automaticamente a partir do
schema, então você não duplica código. E ele serve tanto no backend quanto no
frontend (você pode usar o mesmo schema pra validar o formulário antes de
mandar).

### Variáveis de ambiente

Coisas secretas (senha do banco, JWT_SECRET, chaves de API) **nunca** vão no
código-fonte. Vão em variáveis de ambiente, lidas de um arquivo `.env` que
**não** é commitado no git.

**Seu `.env` (localmente):**
```
DATABASE_URL=postgresql://user:senha@localhost:5432/frota
JWT_SECRET=um_segredo_longo_de_pelo_menos_32_caracteres
```

**No código:**
```ts
const secret = process.env.JWT_SECRET;
```

**No Vercel:** são configuradas em **Settings → Environment Variables** da
dashboard. O Vercel expõe elas pro build e pro runtime do mesmo jeito que
o `.env` local. **Foi exatamente isso que faltou no Preview** — só estava no
ambiente `Production`, não no `Preview`.

### 🎥 Vídeos desta seção

- ⭐ **"Zod na prática — validação em TypeScript | Diego Fernandes"** —
  procure: `diego fernandes zod typescript`
- **"Variáveis de ambiente em Node.js e Next.js | Willian Justen"** — procure:
  `willian justen variáveis ambiente`

---

## 11. Deploy

### O que é deploy?

Tirar o código do seu computador e colocar num servidor que responde pela
internet. Pros projetos modernos como os seus, há serviços (PaaS) que fazem
isso pra você: você manda o código (via git ou CLI), eles buildam, rodam, e
te dão uma URL.

### Vercel (FROT)

O Vercel é **o serviço oficial da empresa que criou o Next.js**. É basicamente
"apertar um botão e ter Next.js no ar". Faz otimização automática, cache,
SSL, tudo.

**Fluxos possíveis:**

1. **Via git integration (o recomendado):** você conecta o repo do GitHub
   ao Vercel uma vez. Daí cada `git push` pra main → deploy automático em
   produção. Cada `git push` pra outra branch ou cada abertura de PR →
   "deploy de preview" numa URL temporária só pra aquela branch/PR.

2. **Via CLI manual:** você roda `vercel` no terminal pra fazer preview,
   ou `vercel --prod` pra ir pra produção direto. Foi esse que a gente
   usou hoje (o seu FROT **ainda não tem integração git com o Vercel**).

**Ambientes no Vercel:**
- **Development** (seu `next dev` local)
- **Preview** (branches/PRs, URL temporária)
- **Production** (domínio real)

Cada ambiente tem seu conjunto de **variáveis de ambiente**. Foi por isso que
a produção funcionava mas o preview quebrava: só production tinha `JWT_SECRET`.

### AchadosPerdidos (deploy?)

O AP (Express + Vite) tem duas partes que precisam ir pra internet:
- O frontend (Vite build) → gera arquivos estáticos. Pode ir pro Vercel,
  Netlify, Cloudflare Pages, GitHub Pages.
- O backend (Express) → precisa de um servidor Node. Opções: Railway,
  Render, Fly.io, um VPS, um homelab no Proxmox.

**Então o AP é mais trabalhoso de deployar** — por isso o FROT foi pro Vercel
de cara.

### 🎥 Vídeos desta seção

- ⭐ **"Deploy Next.js no Vercel — passo a passo | Rocketseat"** — procure:
  `rocketseat deploy next vercel`
- **"Deploy de Express + React separados | Fernanda Kipper"** — cenário do AP.
  Procure: `fernanda kipper deploy express react`
- **"Comparando Vercel, Railway, Render, Fly.io | Fabio Akita"** — visão
  geral. Procure: `fabio akita hospedagem nodejs`

---

## 12. Comparação AP × FROT

Lado a lado, pra fixar:

| Aspecto | AchadosPerdidos | Gestão de Frota |
|---|---|---|
| **Arquitetura** | Cliente + Servidor separados | Monolito Next.js |
| **Pastas raiz** | `client/` + `server/` | `src/` |
| **Frontend** | Vite + React | Next.js (React) |
| **Backend** | Express | Next.js API Routes |
| **Como rodar local** | 2 terminais: `npm run dev` em client e server | 1 terminal: `npm run dev` |
| **Roteamento frontend** | React Router (manual) | File-based (convenção de pastas) |
| **Roteamento backend** | `app.get("/api/...")` explícito | `src/app/api/.../route.ts` por pasta |
| **SSR (Server-Side Rendering)** | Não. Vite entrega HTML vazio + JS | Sim. Páginas vêm prontas do servidor |
| **Middleware** | `app.use(autenticar)` em cada rota | `middleware.ts` roda pra tudo |
| **Banco** | PostgreSQL + Prisma | PostgreSQL (Neon) + Prisma |
| **Hash de senha** | bcryptjs | @node-rs/argon2 |
| **JWT lib** | jsonwebtoken | jose (Edge-compatible) |
| **Deploy backend** | Render/Railway/VPS | Vercel (com edge runtime) |
| **Deploy frontend** | Vercel/Netlify (estático) | Vercel (junto com backend) |
| **TypeScript** | Sim | Sim |
| **Tailwind** | v3 | v3 (depois do downgrade!) |
| **Audit log** | Não tem | Sim (todas as mutations) |
| **Rate limiting** | Não tem | Sim (login 5/min, reset 3/5min) |
| **Upload de arquivo** | Sim (fotos) | Sim (até 5 fotos/veículo, magic bytes) |

### Qual é "melhor pra aprender"?

**Os dois.** Mas se você tivesse que escolher UM pra estudar primeiro, eu
diria: **AP primeiro, FROT depois.** Porque:

1. AP tem tudo explícito. Você vê o Express iniciando, as rotas registrando,
   o middleware sendo chamado. Não tem mágica.
2. Quando você entender AP, FROT vira "ah, é a mesma coisa mas automatizada".
3. Você já **tem** o FROT rodando em produção, então não tem pressa.

---

## 13. Roadmap de Estudo

Ordem sugerida, assumindo **~10h por semana** de dedicação (1h30 por dia):

### Semana 1 — Fundamentos (pra quem tá cru)
- [ ] JavaScript básico (variáveis, funções, arrays, objetos, loops)
- [ ] JavaScript moderno (arrow functions, destructuring, spread, async/await)
- [ ] Git básico (commit, push, pull, branch)
- [ ] Terminal básico (cd, ls, mkdir)

**Material:** curso JS 1h do Rocketseat + 30min de git da Fernanda Kipper.

### Semana 2 — TypeScript + React
- [ ] TypeScript (tipos primitivos, interfaces, generics básicos)
- [ ] React: componentes, props, useState, useEffect
- [ ] JSX e eventos (`onClick`, `onChange`)
- [ ] Listas com `.map()` e chave `key`

**Material:** curso TS 30min Rocketseat + primeiras aulas React Rocketseat.

### Semana 3 — Backend e APIs
- [ ] HTTP, REST, status codes
- [ ] Node.js e npm/pnpm
- [ ] Express: criando uma API simples
- [ ] `fetch` no frontend pra consumir API
- [ ] CORS, o que é e quando dá problema

**Material:** curso Express Rocketseat + vídeo de HTTP status codes.

### Semana 4 — Banco de Dados
- [ ] SQL básico (SELECT, INSERT, UPDATE, DELETE, JOIN)
- [ ] PostgreSQL: instalar local e criar um banco
- [ ] Prisma: schema, migrate, generate, queries
- [ ] Prisma Studio (interface visual)

**Material:** curso Prisma Rocketseat + PostgreSQL Full Cycle.

### Semana 5 — Auth e Segurança
- [ ] JWT: como funciona, como assinar, como verificar
- [ ] Hash de senha (bcrypt e argon2)
- [ ] Cookies httpOnly
- [ ] XSS, CSRF — os ataques que você está evitando
- [ ] Variáveis de ambiente (`.env`)

**Material:** vídeo JWT Rocketseat + XSS/CSRF DevDoido.

### Semana 6 — Next.js
- [ ] App Router (pasta `src/app/`)
- [ ] Server Components vs Client Components
- [ ] API Routes
- [ ] Middleware
- [ ] Server Actions (avançado, pode deixar pra depois)

**Material:** curso Next 14 do Matheus Battisti (4h, o mais importante do
roadmap pro FROT).

### Semana 7 — Deploy
- [ ] Vercel: conta, projeto, variáveis de ambiente
- [ ] git → deploy automático
- [ ] Preview deploys
- [ ] Logs e debug em produção
- [ ] Rollback

**Material:** vídeo Deploy Next Vercel Rocketseat.

### Semana 8 — Seu próprio projeto
- [ ] Escolha algo pequeno (lista de tarefas, lista de filmes favoritos)
- [ ] Faça do zero sozinho, stack a sua escolha
- [ ] Deploye
- [ ] Compartilhe a URL com alguém

**Este é o momento que você vira dev.** Ter FROT e AP é ótimo pra estudar.
Ter um seu do zero é o que consolida.

### Dica final de estudo

**Não tente entender tudo antes de escrever código.** Escreva código errado,
quebre, conserte, entenda por que quebrou. É assim que se aprende — não lendo
documentação até decorar. Os dois projetos que você já tem são uma mina de
ouro: abra um arquivo, tente entender cada linha, e quando tiver dúvida, me
pergunte ou pesquise.

---

## 14. Glossário Rápido

| Termo | Significado |
|---|---|
| **API** | Interface pra um software pedir coisas pra outro. |
| **REST** | Estilo de API usando verbos HTTP + URLs. |
| **Frontend** | Parte que roda no navegador. |
| **Backend** | Parte que roda no servidor. |
| **Full-stack** | Quem faz frontend e backend. |
| **Framework** | Conjunto de ferramentas que te dá a estrutura pronta. |
| **Biblioteca (library)** | Código reutilizável, mais solto que framework. |
| **ORM** | Cola entre objetos JS e tabelas SQL. Ex: Prisma. |
| **JWT** | "Crachá digital" assinado pelo servidor pra identificar usuário. |
| **Hash** | Função de via única, usada pra guardar senhas. |
| **Middleware** | Código que roda entre a requisição e a rota final. |
| **Build** | Processo de transformar código-fonte em arquivos prontos pra servir. |
| **Deploy** | Colocar o build no servidor público. |
| **Preview** | Deploy temporário de uma branch/PR pra testar antes de produção. |
| **Env var** | Variável de ambiente. Onde secretos ficam. |
| **CORS** | "Pode site A chamar API do site B?" — política do navegador. |
| **SSR** | Server-Side Rendering. HTML pronto vem do servidor. |
| **CSR** | Client-Side Rendering. Servidor manda vazio, JS monta a página. |
| **SSG** | Static Site Generation. HTML pré-gerado no build. |
| **Component** | Pedaço reutilizável de tela em React. |
| **Props** | Argumentos que um componente React recebe. |
| **State** | "Memória" de um componente React (muda com `useState`). |
| **Hook** | Função do React que começa com `use` (`useState`, `useEffect`, etc.). |
| **package.json** | Arquivo que lista dependências e scripts de um projeto Node. |
| **node_modules** | Pasta onde ficam as libs baixadas (não vai pro git). |
| **tsconfig.json** | Configuração do TypeScript. |
| **schema.prisma** | Definição das tabelas pro Prisma. |

---

## Canais PT-BR que valem seguir no YouTube

Ordem de prioridade (todos têm conteúdo de graça excelente):

1. **Rocketseat** — maior canal PT-BR de dev web. Curso de tudo que você usa.
2. **Fabio Akita** — Senior de verdade, vídeos longos, reflexões técnicas.
   Ótimo pra filosofia e visão de indústria.
3. **Matheus Battisti — Hora de Codar** — pé-no-chão, muitos cursos
   completos gratuitos.
4. **Willian Justen** — frontend e React com muita didática.
5. **Fernanda Kipper** — didática ótima, foco em backend e carreira.
6. **Diego Fernandes** (CTO da Rocketseat) — vídeos individuais, alto nível.
7. **Full Cycle (Wesley Willians)** — arquitetura e DevOps. Mais avançado,
   mas vale.
8. **Dev Soutinho** — JS e SQL de forma direta.
9. **Lucas Montano** — carreira, opiniões, entrevistas. Não é tutorial,
   mas bom de acompanhar.
10. **DevDoido (Gabriel Froes)** — segurança web em PT-BR, raro e bom.

---

## Checklist da viagem

Sugestão do que pôr no celular pra ver offline:

- [ ] Curso JS 1h Rocketseat (~1h)
- [ ] Curso TS 30min Rocketseat (~30min)
- [ ] 4 primeiras aulas do React Rocketseat (~2h)
- [ ] Curso Express Rocketseat (~2h)
- [ ] Curso Prisma Rocketseat (~2h)
- [ ] Curso Next 14 Hora de Codar — **só se sobrar tempo**, é longo (~4h)

Total mínimo: ~7h. Dá pra fazer num voo ou num final de semana de viagem.

---

## Contato comigo (Claude)

Quando você voltar da viagem e tiver dúvidas, pode:
- Abrir qualquer arquivo do FROT ou do AP e me perguntar "o que essa linha
  faz?"
- Me pedir pra explicar um conceito específico com exemplos do **seu** código
  (muito mais útil que vídeo genérico)
- Me pedir pra fazer mini-exercícios de fixação

**Boa viagem e bons estudos! 🚗📚✈️**

— Claude
