# Deploy — Gestão de Frotas

Guia operacional pra subir e manter a aplicação em produção. Stack default: VPS Linux com Docker Compose, Postgres no mesmo host, HTTPS via Caddy.

## Pré-requisitos

- VPS com **mínimo 1 vCPU / 2GB RAM / 20GB disco**. Recomendado 2vCPU/4GB.
- **Docker** e **docker-compose v2**.
- **Domínio** apontado pro IP do VPS (registro A em `gestao.dirad.ufg.br` ou similar). Necessário pra Caddy emitir cert Let's Encrypt.
- Portas **80** e **443** abertas no firewall.
- Acesso SSH com chave (não senha).

## Variáveis de ambiente (`.env` de produção)

Crie um `.env` na raiz do projeto, **fora do git**, com:

```env
DOMAIN=gestao.dirad.ufg.br
NEXT_PUBLIC_APP_URL=https://gestao.dirad.ufg.br

POSTGRES_USER=gestao
POSTGRES_PASSWORD=<senha forte, ex: openssl rand -base64 24>
POSTGRES_DB=gestaofrota

# Gere com: openssl rand -base64 48
JWT_SECRET=<segredo de 48+ chars>

# SMTP — opcional, mas necessário pro reset de senha + alertas
SMTP_HOST=smtp-corp.ufg.br
SMTP_PORT=587
SMTP_USER=gestao-frota@dirad.ufg.br
SMTP_PASS=<app password>
EMAIL_GESTOR_FROTA=cman@dirad.ufg.br

LOG_LEVEL=info
```

> ⚠️ **Nunca** commitar este `.env`. O `.gitignore` deve cobrir, mas confira.

## Primeiro deploy

```bash
# 1. Clonar
git clone <repo> /opt/gestao-frota
cd /opt/gestao-frota

# 2. Criar .env (ver seção acima)
nano .env

# 3. Subir tudo
docker compose up -d --build

# 4. Acompanhar logs até ficar saudável
docker compose logs -f app
```

Ao subir, o entrypoint do container `app` roda `prisma migrate deploy` automaticamente. Banco vazio fica com schema completo, banco existente recebe só as migrations pendentes.

### Bootstrap do primeiro admin

O sistema exige um usuário ADMIN pra cadastrar veículos/oficinas/usuários. Duas opções:

**A. Via seed Prisma** (mais limpo):
```bash
docker compose exec app npx prisma db seed
```
Confira `prisma/seed.ts` — ajuste o email/senha do admin antes do primeiro deploy.

**B. Via SQL direto** (se o seed falhar ou já tiver dados):
```bash
docker compose exec db psql -U gestao -d gestaofrota
INSERT INTO "Usuario" (id, nome, email, senha, tipo, setor, "primeiroAcesso")
VALUES (gen_random_uuid()::text, 'Diretor', 'oliveiraguilherme@ufg.br',
        '<argon2 hash>', 'ADMINISTRADOR', 'AMBOS', true);
```
Pra gerar o hash argon2 da senha, rodar localmente: `node -e "require('@node-rs/argon2').hash('senhaInicial').then(console.log)"`.

## Deploy de updates

```bash
cd /opt/gestao-frota
git pull
docker compose up -d --build app   # rebuilda só o app, db permanece
docker compose logs -f app
```

Tempo típico: 1-2 min de build, 10-20s de downtime durante o swap. Sem rolling update num único host — pra zero-downtime real, precisa de 2 réplicas + LB.

## Backups

Postgres no Docker, dado em volume `db-data`. **Você é responsável pelo backup.**

### Backup manual

```bash
docker compose exec -T db pg_dump -U gestao -d gestaofrota --no-owner \
  | gzip > backups/$(date +%Y%m%d-%H%M%S).sql.gz
```

### Backup automático diário (cron no host)

```cron
0 3 * * * cd /opt/gestao-frota && docker compose exec -T db pg_dump -U gestao -d gestaofrota --no-owner | gzip > backups/$(date +\%Y\%m\%d).sql.gz && find backups -name "*.sql.gz" -mtime +30 -delete
```
Mantém 30 dias de backups. **Mande os dumps pra fora do VPS** (S3, rsync pra outro host, etc.) — backup que mora na mesma máquina não é backup.

### Restore

```bash
gunzip < backups/20260429.sql.gz | docker compose exec -T db psql -U gestao -d gestaofrota
```

## Healthcheck e monitoramento

- `GET /api/health` retorna 200 + JSON quando app + DB estão OK; 503 se DB cair.
- Docker tem healthcheck nativo (definido no Dockerfile) — `docker compose ps` mostra status.
- Pra alerta externo, apontar UptimeRobot/Healthchecks.io pra `https://<domínio>/api/health` a cada 5min.

## Logs

App emite JSON estruturado (pino) em stdout. Caddy também. Com Compose:

```bash
docker compose logs -f --tail=200 app
docker compose logs -f --tail=200 caddy
```

Em produção séria, plugar num agregador (Loki, ELK, Datadog).

## Checklist de prod (rever antes do "go live")

- [ ] `JWT_SECRET` é forte (≥48 chars random) e **diferente** do dev
- [ ] `POSTGRES_PASSWORD` é forte e único
- [ ] `.env` **não** está no git (`git status` deve ignorar)
- [ ] Domínio apontado e Let's Encrypt emitiu cert (acesse `https://`, sem warning de cert)
- [ ] `NEXT_PUBLIC_APP_URL` em https (afeta link de reset de senha)
- [ ] Backup automático configurado e testado (faça um restore num ambiente paralelo!)
- [ ] Firewall: SSH com chave only, 80/443 abertos, 5432 (Postgres) **bloqueado externamente**
- [ ] Admin inicial criado e senha trocada (usuário tem `primeiroAcesso=true` que força troca)
- [ ] `/api/health` respondendo 200 ao acessar publicamente
- [ ] LGPD: anotar onde os dados ficam, finalidade, retenção (servidor público)

## Troubleshooting

**`prisma migrate deploy` falha no startup**
Banco fora do ar ou schema com drift. Conferir logs: `docker compose logs db`. Pra resetar em emergência (perde dados!): `docker compose down -v && docker compose up -d`.

**Caddy não emite cert**
Domínio não resolvendo pro IP do VPS, ou portas 80/443 bloqueadas. Conferir: `dig <dominio>` e `curl -I http://<IP>`.

**App responde 503 em `/api/health`**
DB caiu ou variável `DATABASE_URL` errada. `docker compose logs app | grep prisma`.

**Sessões caem ao reiniciar**
Esperado se você trocou `JWT_SECRET`. Tokens antigos ficam inválidos.

## Caminhos alternativos (se Docker no VPS não for opção)

- **Servidor UFG (CERCOMP/CGTI)**: pedir VM Linux, instalar Docker, mesmo procedimento. Vantagem: dado público fica em ambiente da UFG (LGPD mais limpo).
- **Vercel + Postgres externo**: app na Vercel, DB no Neon/Railway. Rápido, mas dado fora do país — verificar se LGPD/política UFG permite.
- **Kubernetes**: docker-compose já é referência fácil de portar (deployments + secret + service). Por enquanto, overkill.
