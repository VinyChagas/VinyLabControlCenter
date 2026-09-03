# VinyLabControlCenter

Painel de controle da infraestrutura VinyLab (frontend React + backend Fastify).

## Arquitetura

```
frontend/          React + TypeScript + Vite + Tailwind
backend/           Fastify + TypeScript + AES-256-GCM secrets
docker-compose.dev.yml   PostgreSQL 18 local (somente 127.0.0.1)
docker-compose.hml.yml   Frontend + backend na VPS (sem criar PostgreSQL)
scripts/           install-hml.sh / deploy-hml.sh
```

Fluxo de secrets e teste de banco:

```
Frontend → Backend (/api/secrets/test) → PostgreSQL
```

O frontend **nunca** conecta diretamente no PostgreSQL.

### Ambientes

| | DEV (Mac) | HML (VPS Ubuntu) |
|---|---|---|
| App | `npm run dev` local | Docker Compose HML |
| PostgreSQL | container `vinylab-control-postgres-dev` | container existente `vinylab-postgres` |
| Host DB | `localhost:5432` | `vinylab-postgres:5432` (rede `vinylab_internal`) |
| Porta 5432 | só `127.0.0.1` | **não** publicada na internet |

A diferença entre ambientes é **apenas** por variáveis de ambiente / compose.

## Pré-requisitos

- Node.js 22+
- npm
- Docker + Docker Compose
- (HML) network `vinylab_internal` e container `vinylab-postgres` já existentes

## Configuração do .env

### Backend (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

Variáveis:

- `NODE_ENV` — `development` | `production` | `test`
- `APP_ENV` — `development` | `homologation` | `production` | `test`
- `PORT` — porta HTTP (default `3001`)
- `FRONTEND_URL` — origem CORS em produção
- `DATABASE_URL` — connection string do PostgreSQL do **próprio backend** (healthcheck)
- `SECRET_MASTER_KEY` — chave mestra AES-256-GCM (≥ 32 chars)

### Frontend (`frontend/.env` opcional)

```bash
cd frontend
cp .env.example .env
```

- `VITE_API_URL` — base da API (default `/api`, com proxy Vite em DEV)

### Docker DEV (raiz)

```bash
cp .env.dev.example .env.dev
# preencha POSTGRES_PASSWORD
```

### Homologação (raiz da VPS)

```bash
cp .env.hml.example .env.hml
# preencha DATABASE_URL, SECRET_MASTER_KEY, FRONTEND_URL, etc.
```

**Nunca** versione `.env`, `.env.dev`, `.env.hml` ou `backend/data/secrets.enc.json`.

## Desenvolvimento local

### PostgreSQL DEV

```bash
cp .env.dev.example .env.dev
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f postgres
```

Connection string local (conceitual):

```text
postgresql://vinylab_control:<DEV_PASSWORD>@localhost:5432/vinylab_control_center
```

Use o mesmo valor em `backend/.env` → `DATABASE_URL`.

Entrar no PostgreSQL DEV:

```bash
docker exec -it vinylab-control-postgres-dev \
  psql -U vinylab_control -d vinylab_control_center
```

Parar DEV:

```bash
docker compose -f docker-compose.dev.yml down
```

(`down` sem `-v` preserva o volume `vinylab_control_dev_data`.)

### Subindo DEV (app)

```bash
# terminal 1 — backend
cd backend
cp .env.example .env   # se ainda não existir
npm install
npm run dev

# terminal 2 — frontend
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/health e http://localhost:3001/api/health

## Homologação

### Arquitetura Docker da VPS

- Rede externa existente: `vinylab_internal`
- PostgreSQL existente: `vinylab-postgres` (não recriado por este projeto)
- Este compose sobe apenas:
  - `vinylab-control-backend-hml` → `127.0.0.1:3001`
  - `vinylab-control-frontend-hml` → `127.0.0.1:8080`
- Caddy (futuro) fará HTTPS na frente desses serviços

`DATABASE_URL` em HML (conceitual):

```text
postgresql://vinylab_control:<HML_PASSWORD>@vinylab-postgres:5432/vinylab_control_center
```

### Primeiro deploy

Na VPS, no diretório do clone:

```bash
cp .env.hml.example .env.hml
# edite .env.hml com valores reais (não commitar)

chmod +x scripts/install-hml.sh scripts/deploy-hml.sh
./scripts/install-hml.sh
```

O script valida Docker, Compose, network, container Postgres, presença do `.env.hml`, faz build/up e checa health. **Não** cria nem sobrescreve secrets.

### Atualizações

```bash
./scripts/deploy-hml.sh
```

Fluxo: `git pull` → build → `up -d` → placeholder de migrations → healthcheck.

## Comandos operacionais

### DEV

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml ps
docker exec -it vinylab-control-postgres-dev psql -U vinylab_control -d vinylab_control_center
```

### HML

```bash
docker compose -f docker-compose.hml.yml build
docker compose -f docker-compose.hml.yml up -d
docker compose -f docker-compose.hml.yml down          # NÃO use -v
docker compose -f docker-compose.hml.yml restart
docker compose -f docker-compose.hml.yml logs -f
docker compose -f docker-compose.hml.yml ps
curl -s http://127.0.0.1:3001/health
```

## Logs

```bash
# DEV postgres
docker compose -f docker-compose.dev.yml logs -f postgres

# HML
docker compose -f docker-compose.hml.yml logs -f backend
docker compose -f docker-compose.hml.yml logs -f frontend
```

O backend redige campos sensíveis nos logs (`secret`, `password`, `token`, `DATABASE_URL`, etc.).

## Healthcheck

Resposta típica:

```json
{
  "status": "ok",
  "database": "connected",
  "environment": "homologation",
  "timestamp": "...",
  "uptime": 12.3
}
```

- `database`: `connected` | `disconnected` | `not_configured`
- Em HML/produção, ausência/falha de DB → HTTP 503
- Endpoints: `GET /health` e `GET /api/health`

## Troubleshooting

| Problema | Verificação |
|---|---|
| Backend não sobe | `SECRET_MASTER_KEY` ≥ 32 chars no `.env` |
| Health `disconnected` | `DATABASE_URL` e rede Docker; no HML o host deve ser `vinylab-postgres` |
| CORS em produção | `FRONTEND_URL` deve ser a origem real do frontend |
| Install HML falha na network | `docker network inspect vinylab_internal` |
| Install HML falha no Postgres | `docker inspect vinylab-postgres` |
| Teste de conexão no Settings | fluxo Frontend → Backend → Postgres; connection string não é logada |

## Segurança

- Secrets de providers ficam criptografados (AES-256-GCM) em `backend/data/secrets.enc.json` (gitignored)
- APIs de secrets retornam apenas valores mascarados
- Helmet, CORS, rate limit e body limit (100 KB) ativos
- Stack traces não são expostos em produção
- PostgreSQL DEV/HML não deve ser publicado em `0.0.0.0`
- Não commitar: `.env*`, dumps, `*.pem`, `*.key`, `secrets.enc.json`

## Scripts npm

| Pasta | Dev | Lint | Test | Build |
|---|---|---|---|---|
| frontend | `npm run dev` | `npm run lint` | — | `npm run build` |
| backend | `npm run dev` | `npm run lint` | `npm run test` | `npm run build` |
