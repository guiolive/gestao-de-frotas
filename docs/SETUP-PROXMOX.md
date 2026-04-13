# Setup do PostgreSQL no Proxmox

Guia para configurar o banco de dados do sistema Gestão de Frotas em um servidor Proxmox.

## Arquitetura

```
Vercel (Next.js app) ──── Tailscale ────> Proxmox LXC (PostgreSQL 16)
     HTTPS                  tunnel            porta 5432
```

## 1. Criar Container LXC no Proxmox

No Proxmox Web UI:

1. **Create CT** (botão no canto superior direito)
2. Template: `debian-12-standard` ou `ubuntu-24.04-standard`
3. Resources:
   - CPU: 1 core
   - RAM: 512 MB (suficiente pra frota pequena)
   - Disco: 4 GB
4. Network: DHCP ou IP fixo na rede local
5. Marcar: **Start at boot**

## 2. Instalar PostgreSQL 16

```bash
# Dentro do container LXC
apt update && apt upgrade -y
apt install -y postgresql-16 postgresql-client-16

# Verificar que está rodando
systemctl status postgresql
```

## 3. Criar banco e usuário

```bash
sudo -u postgres psql
```

```sql
CREATE USER gestao_frotas WITH PASSWORD 'TROCAR_POR_SENHA_FORTE';
CREATE DATABASE gestao_frotas OWNER gestao_frotas;
GRANT ALL PRIVILEGES ON DATABASE gestao_frotas TO gestao_frotas;
\q
```

## 4. Configurar acesso remoto

Editar `/etc/postgresql/16/main/postgresql.conf`:

```
listen_addresses = '*'
```

Editar `/etc/postgresql/16/main/pg_hba.conf` — adicionar no final:

```
# Acesso via Tailscale (rede 100.x.x.x)
host    gestao_frotas   gestao_frotas   100.0.0.0/8     scram-sha-256
```

Reiniciar:

```bash
systemctl restart postgresql
```

## 5. Instalar Tailscale no container

```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```

Anotar o IP Tailscale do container (ex: `100.x.y.z`).

## 6. Testar conexão

Do seu Mac (que já tem Tailscale):

```bash
psql "postgresql://gestao_frotas:SUA_SENHA@100.x.y.z:5432/gestao_frotas"
```

Se conectar, está pronto.

## 7. Configurar o sistema

No `.env` do projeto (local ou Vercel):

```
DATABASE_URL="postgresql://gestao_frotas:SUA_SENHA@100.x.y.z:5432/gestao_frotas"
```

Aplicar schema e seed:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 8. Backup automático

### Opção A: pg_dump diário (recomendado)

Criar script `/root/backup-postgres.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y-%m-%d_%H%M)
pg_dump -U postgres gestao_frotas | gzip > "$BACKUP_DIR/gestao_frotas_$DATE.sql.gz"
# Manter apenas últimos 30 dias
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
echo "Backup OK: gestao_frotas_$DATE.sql.gz"
```

```bash
chmod +x /root/backup-postgres.sh
```

Agendar no cron (diário às 3h):

```bash
crontab -e
# Adicionar:
0 3 * * * /root/backup-postgres.sh >> /var/log/backup-postgres.log 2>&1
```

### Opção B: Snapshot do Proxmox

No Proxmox, configurar backup automático do container:
- Datacenter → Backup → Add
- Selecionar o CT do Postgres
- Schedule: diário
- Mode: Snapshot (não para o container)
- Retention: 7 dias

### Restore

```bash
# Do pg_dump
gunzip < /var/backups/postgresql/gestao_frotas_2026-04-12_0300.sql.gz | psql -U postgres gestao_frotas

# Do snapshot Proxmox
# Restore via Proxmox UI → CT → Backup → Restore
```

## 9. Monitoramento

Verificar espaço em disco:

```bash
df -h
du -sh /var/lib/postgresql/
```

Verificar conexões ativas:

```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='gestao_frotas';"
```

## Troubleshooting

| Problema | Solução |
|---|---|
| Connection refused | Verificar `listen_addresses` e `pg_hba.conf`. Reiniciar PostgreSQL. |
| Tailscale não conecta | `tailscale status` no container. Verificar se está autenticado. |
| Timeout na Vercel | Verificar se o container LXC está ligado e Tailscale ativo. |
| Disco cheio | Limpar backups antigos: `find /var/backups -mtime +30 -delete` |
