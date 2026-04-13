# Documentação da API — Gestão de Frotas

Base URL: `https://gestao-de-frota-mu.vercel.app/api`

## Autenticação

Todas as rotas protegidas usam JWT via cookie `token` (httpOnly) ou header `Authorization: Bearer <token>`.

O middleware `proxy.ts` intercepta todas as requisições e rejeita com `401` se não houver token válido (exceto rotas públicas: `/login`, `/esqueci-senha`, `/resetar-senha`).

### Perfis
- **OPERADOR**: lê tudo + cria/edita viagens, manutenções, agendamentos
- **ADMINISTRADOR**: tudo do operador + CRUD de veículos, motoristas, unidades + exclusões

---

## Auth

### POST /api/auth/login
Login com email e senha. Rate limit: 5 tentativas/min por IP.

**Body:**
```json
{ "email": "admin@dept.com", "senha": "Admin@123" }
```

**Resposta 200:**
```json
{
  "token": "eyJhbG...",
  "user": { "id": "...", "nome": "...", "email": "...", "tipo": "ADMINISTRADOR", "primeiroAcesso": false },
  "requirePasswordChange": false
}
```

**Erros:** `400` (dados inválidos), `401` (credenciais incorretas), `429` (rate limit)

---

### GET /api/auth/me
Retorna dados do usuário autenticado.

**Auth:** requireAuth

**Resposta 200:**
```json
{ "id": "...", "nome": "...", "email": "...", "tipo": "ADMINISTRADOR", "ativo": true, "matricula": "ADM001", "primeiroAcesso": false }
```

---

### POST /api/auth/trocar-senha
Troca de senha (requer senha atual).

**Auth:** requireAuth

**Body:**
```json
{ "senhaAtual": "senha_atual", "novaSenha": "NovaSenha@123" }
```

---

### POST /api/auth/esqueci-senha
Solicita reset de senha. Rate limit: 3/5min. Nunca revela se o email existe.

**Body:** `{ "email": "usuario@dept.com" }`

**Resposta:** sempre `200 { "ok": true }` (anti-enumeração)

---

### POST /api/auth/resetar-senha
Redefine senha com token recebido por email. Rate limit: 10/min.

**Body:** `{ "token": "token_do_email", "novaSenha": "NovaSenha@123" }`

---

## Veículos

### GET /api/veiculos
Lista todos os veículos.

**Query:** `?status=disponivel` (opcional)

---

### POST /api/veiculos
Cria veículo.

**Auth:** ADMINISTRADOR

**Body:**
```json
{
  "placa": "ABC1D23",
  "modelo": "Hilux",
  "marca": "Toyota",
  "ano": 2024,
  "cor": "branco",
  "tipo": "carro",
  "quilometragem": 0,
  "valorVeiculo": 150000,
  "status": "disponivel"
}
```

**Tipos:** carro, van, caminhao, onibus
**Status:** disponivel, em_uso, manutencao, inativo

---

### GET /api/veiculos/[id]
Detalhes do veículo com viagens, manutenções, agendamentos.

---

### PUT /api/veiculos/[id]
Atualiza veículo (campos parciais aceitos).

**Auth:** ADMINISTRADOR

---

### DELETE /api/veiculos/[id]
Exclui veículo.

**Auth:** ADMINISTRADOR

---

## Imagens de Veículo

### GET /api/veiculos/[id]/imagens
Lista imagens do veículo.

---

### POST /api/veiculos/[id]/imagens
Upload de imagem. Max 5 MB. Formatos: JPEG, PNG, WEBP. Max 5 por veículo.

**Auth:** ADMINISTRADOR

**Body:** FormData com campo `file` (File) e `descricao` (string, opcional)

---

### DELETE /api/veiculos/[id]/imagens?imagemId=xxx
Exclui imagem. Valida que pertence ao veículo (IDOR protection).

**Auth:** ADMINISTRADOR

---

## Alertas de KM

### GET /api/veiculos/[id]/alertas
Lista alertas de KM do veículo.

---

### POST /api/veiculos/[id]/alertas
Cria alerta de manutenção por KM.

**Auth:** ADMINISTRADOR

**Body:**
```json
{
  "tipo": "troca_oleo",
  "intervaloKm": 10000,
  "ultimaTrocaKm": 45000,
  "alertaAntesDe": 1000,
  "emailGestor": "gestor@dept.com"
}
```

**Tipos de alerta:** troca_oleo, troca_pneus, revisao, alinhamento, filtro_ar, filtro_combustivel, correia_dentada, fluido_freio, fluido_arrefecimento

---

### DELETE /api/veiculos/[id]/alertas?alertaId=xxx
Exclui alerta.

**Auth:** ADMINISTRADOR

---

## Viagens

### GET /api/viagens
Lista viagens com filtros avançados.

**Query params:**
| Param | Tipo | Descrição |
|---|---|---|
| status | string | agendada, em_andamento, concluida, cancelada |
| veiculoId | string | Filtrar por veículo |
| motoristaId | string | Filtrar por motorista |
| unidadeId | string | Filtrar por unidade |
| ufDestino | string | UF do destino (2 chars) |
| q | string | Busca em destino, origem, solicitante, processoSei |
| dataInicio | string | Data mínima (YYYY-MM-DD) |
| dataFim | string | Data máxima (YYYY-MM-DD) |

---

### POST /api/viagens
Cria viagem. Valida disponibilidade do veículo (conflitos com viagens e manutenções).

**Auth:** requireAuth

**Body:**
```json
{
  "veiculoId": "...",
  "motoristaId": "...",
  "origem": "Goiânia, GO",
  "destino": "Brasília, DF",
  "dataSaida": "2026-04-15T08:00:00",
  "kmInicial": 50000,
  "unidadeId": "...",
  "ufDestino": "DF",
  "diaria": 177.00,
  "qtdDiarias": 2,
  "pcdpNumero": "2026/001234"
}
```

**Validações:**
- Veículo não pode estar em manutenção ou inativo
- Conflito com outra viagem ativa/agendada → `409`
- Conflito com manutenção aguardando/em_andamento → `409`
- PCDP obrigatório se houver diárias → `400`
- totalDiarias calculado automaticamente (diaria × qtdDiarias)

---

### PUT /api/viagens/[id]
Atualiza viagem. Campos parciais aceitos.

**Auth:** requireAuth

**Regras de negócio por status:**
- `em_andamento` → veículo muda para `em_uso`
- `concluida` → veículo atualiza KM e volta para `disponivel`
- `cancelada` → veículo volta para `disponivel` (se estava `em_uso`)

---

### DELETE /api/viagens/[id]
Exclui viagem (não permite se status = em_andamento).

**Auth:** ADMINISTRADOR

---

## Manutenções

### GET /api/manutencoes
Lista todas as manutenções com veículo, checklist e itens.

---

### POST /api/manutencoes
Cria manutenção com checklist e itens de serviço. Veículo muda para status `manutencao`.

**Auth:** requireAuth

**Body:**
```json
{
  "veiculoId": "...",
  "tipo": "preventiva",
  "descricao": "Revisão 50.000 km",
  "dataEntrada": "2026-04-10T08:00:00",
  "previsaoSaida": "2026-04-12T18:00:00",
  "previsaoDias": 2,
  "custoEstimado": 1500,
  "checklist": [
    { "categoria": "Motor", "temProblema": false },
    { "categoria": "Freios", "temProblema": true, "descricao": "Pastilhas gastas" }
  ],
  "itens": [
    { "servico": "Troca de óleo", "valor": 250, "observacao": "Óleo 5W30 sintético" },
    { "servico": "Troca de pastilhas", "valor": 400 }
  ]
}
```

---

### PUT /api/manutencoes/[id]
Atualiza manutenção. **Substitui** checklist e itens inteiros (enviar array completo).

**Auth:** requireAuth

---

## Unidades

### GET /api/unidades
Lista unidades. Query: `?ativo=true`

### POST /api/unidades
**Auth:** ADMINISTRADOR. Body: `{ "sigla": "ICB", "nome": "Instituto de Ciências Biológicas" }`

### PUT /api/unidades/[id]
**Auth:** ADMINISTRADOR

### DELETE /api/unidades/[id]
**Auth:** ADMINISTRADOR. Falha se houver viagens vinculadas.

---

## Motoristas

### GET /api/motoristas
Lista todos os motoristas.

### POST /api/motoristas
**Auth:** ADMINISTRADOR. Body: `{ "cpf", "nome", "cnh", "categoriaCnh", "telefone", "email", "status" }`

### GET/PUT/DELETE /api/motoristas/[id]
**Auth (PUT/DELETE):** ADMINISTRADOR

---

## Agendamentos

### GET /api/agendamentos
Lista agendamentos com veículo.

### POST /api/agendamentos
**Auth:** requireAuth. Body: `{ "veiculoId", "solicitante", "motivo", "dataInicio", "dataFim" }`

### PUT /api/agendamentos/[id]
**Auth:** requireAuth

### DELETE /api/agendamentos/[id]
**Auth:** ADMINISTRADOR

---

## Relatórios

### GET /api/relatorios/custos
Relatório de custos de manutenção.

**Query:** `?dataInicio=2026-01-01&dataFim=2026-12-31`

**Resposta:**
```json
{
  "custoTotal": 45000,
  "custosPorVeiculo": [{ "veiculoId": "...", "placa": "...", "custoTotal": 12000, "qtdManutencoes": 3 }],
  "custosPorMes": [{ "mes": "2026-01", "custo": 5000 }],
  "veiculoMaisCaro": { "placa": "...", "custo": 12000 },
  "mediaCustoPorVeiculo": 5625,
  "totalManutencoes": 8
}
```

---

### GET /api/relatorios/veiculos/[id]
Relatório detalhado de um veículo.

**Query:** `?dataInicio=2026-01-01&dataFim=2026-12-31`

---

## Alertas (Cron)

### POST /api/alertas/verificar
Endpoint para cron job. Verifica alertas de KM e manutenções atrasadas, envia emails.

**Auth:** nenhuma (proteger via secret header em produção)

**Resposta:**
```json
{
  "km": { "verificados": 6, "alertasEnviados": 1, "detalhes": [...] },
  "manutencao": { "verificadas": 2, "alertasEnviados": 1, "detalhes": [...] }
}
```

---

## Serviços

### GET /api/servicos
Lista serviços de manutenção. Query: `?q=oleo&categoria=Motor`

### GET /api/servicos/categorias
Lista categorias de serviço.

---

## Códigos de Erro

| Código | Significado |
|---|---|
| 400 | Dados inválidos (body mal formatado, campos obrigatórios faltando) |
| 401 | Não autenticado (token ausente ou expirado) |
| 403 | Sem permissão (ex: operador tentando criar veículo) |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: veículo já tem viagem no período) |
| 429 | Rate limit excedido (Retry-After header incluído) |
| 500 | Erro interno do servidor |

Formato de erro:
```json
{ "error": "Mensagem descritiva do erro" }
```

Para erros de validação Zod:
```json
{ "error": "Dados inválidos", "issues": [{ "path": ["campo"], "message": "descricao" }] }
```
