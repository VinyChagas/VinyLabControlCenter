# VinyLab Control Center

Painel de controle da infraestrutura VinyLab (frontend React + backend Fastify).

## Arquitetura

```
frontend/                 React + TypeScript + Vite + Tailwind
backend/                  Fastify + TypeScript + AES-256-GCM secrets + auth
backend/migrations/       SQL versionado (schema_migrations)
docker-compose.dev.yml    PostgreSQL 18 local (somente 127.0.0.1)
docker-compose.yml        Frontend + backend na VPS (sem criar PostgreSQL)
scripts/                  install.sh / deploy.sh
docs/caddy-control.snippet  Bloco Caddy sugerido (não aplicado automaticamente)
```

Fluxo público:

```
Browser → Caddy (HTTPS control.vinichagas.cloud)
       → vinylab-control-frontend (nginx)
            /        → SPA
            /api/*   → vinylab-control-backend:3001
       → vinylab-postgres (rede vinylab_internal)
```

O frontend **nunca** conecta diretamente no PostgreSQL.

Autenticação da SPA: cookie `HttpOnly` `vl_session` (sessão opaca). JWT/JWKS/OIDC ficam para etapas futuras (Hermes).

### Ambientes

| | DEV (local) | VPS |
|---|---|---|
| App | `npm run dev` | Docker Compose (`docker-compose.yml`) |
| PostgreSQL | `vinylab-control-postgres-dev` | `vinylab-postgres` (existente) |
| Host DB | `localhost:5432` | `vinylab-postgres:5432` (`vinylab_internal`) |
| Porta 5432 | só `127.0.0.1` | **não** publicada |
| Compose | `docker-compose.dev.yml` | `docker-compose.yml` |
| Env | `backend/.env` + `.env.dev` | `.env` (raiz) |

A VPS hoje exerce o papel de ambiente de homologação operacional, mas os recursos técnicos **não** usam sufixos `hml` / `homologation`.

## Pré-requisitos

- Node.js 22+
- npm
- Docker + Docker Compose
- (VPS) networks `vinylab_internal` + `vinylab_proxy` e container `vinylab-postgres`

## Configuração do .env

### Backend (`backend/.env`) — DEV

```bash
cd backend
cp .env.example .env
```

Variáveis:

- `NODE_ENV` — `development` | `production` | `test`
- `APP_ENV` — `development` | `vps` | `production` | `test`
- `PORT` — default `3001`
- `FRONTEND_URL` — origem CORS/CSRF (`http://localhost:5173` em DEV)
- `DATABASE_URL` — PostgreSQL do backend
- `SECRET_MASTER_KEY` — AES-256-GCM (≥ 32 chars)
- `SESSION_TTL_HOURS` — validade da sessão de usuário (ex.: `72`)
- `PROMETHEUS_URL` — URL interna do Prometheus (VPS: `http://prometheus:9090`)
- `PROMETHEUS_TIMEOUT_MS` — timeout das queries (default `5000`)
- `METRICS_COLLECTION_INTERVAL_SECONDS` — persistência no Postgres (default `60`)
- `SYSTEM_HOSTNAME` / `SYSTEM_PRIMARY_IP` — opcionais para Informações do Sistema

Detalhes da camada de métricas: [`docs/metrics.md`](docs/metrics.md).

O primeiro OWNER é criado pelo fluxo interativo `/setup` (credencial temporária `admin` / `1234` enquanto não houver OWNER). Não há variáveis `BOOTSTRAP_OWNER_*`.

### Frontend (`frontend/.env` opcional)

- `VITE_API_URL` — default `/api` (proxy Vite em DEV; nginx na VPS)

### Docker DEV (raiz)

```bash
cp .env.dev.example .env.dev
# preencha POSTGRES_PASSWORD
```

### VPS (raiz)

```bash
cp .env.example .env
# FRONTEND_URL=https://control.vinichagas.cloud
# preencha DATABASE_URL, SECRET_MASTER_KEY, etc.
```

**Nunca** versione `.env`, `.env.dev`, `.env.hml` legado ou `backend/data/secrets.enc.json`.

## Desenvolvimento local

### PostgreSQL DEV

```bash
cp .env.dev.example .env.dev
docker compose -f docker-compose.dev.yml up -d
```

Connection string local:

```text
postgresql://vinylab_control:<DEV_PASSWORD>@localhost:5432/vinylab_control_center
```

Migrations + app:

```bash
cd backend
cp .env.example .env   # ajuste DATABASE_URL
npm install
npm run migrate
npm run dev

# outro terminal
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Login: http://localhost:5173/login
- Setup inicial: http://localhost:5173/setup
- Backend health: http://localhost:3001/health

## Autenticação

### Públicos

- `GET /health`
- `POST /api/auth/login`
- `GET /api/setup/status`

### Setup (sessão `scope=setup`)

- `POST /api/setup/owner`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Protegidos (sessão `scope=user`)

- `POST /api/auth/logout`
- `GET /api/auth/me`
- demais rotas `/api/*`

Secrets e updates sensíveis de settings: apenas `owner` ou `admin`.

Cookie: `vl_session` — `HttpOnly`, `SameSite=Lax`, `Secure` quando `FRONTEND_URL` é HTTPS / `APP_ENV=vps|production`.

Sessão de setup: TTL 30 minutos; não acessa APIs administrativas.

## Homologação na VPS

### Containers esperados

- `vinylab-control-backend`
- `vinylab-control-frontend`
- `vinylab-postgres` (pré-existente)

### Redes

- Backend: `vinylab_internal`
- Frontend: `vinylab_internal` + `vinylab_proxy`
- Caddy: `vinylab_proxy` (já existente)

### Primeiro install

```bash
cp .env.example .env
# edite .env

chmod +x scripts/install.sh scripts/deploy.sh
./scripts/install.sh
```

O script valida Docker, networks, Postgres, `.env`, faz build/up, roda migrations e checa health.

**Não** altera o Caddy automaticamente. Use o snippet em `docs/caddy-control.snippet`.

### Atualizações

```bash
./scripts/deploy.sh
```

### Containers legados

Se ainda existirem `vinylab-control-*-hml`, pare/remova **manualmente** antes do novo up (conflito de portas 3001/8080):

```bash
docker stop vinylab-control-backend-hml vinylab-control-frontend-hml
docker rm vinylab-control-backend-hml vinylab-control-frontend-hml
```

Volume legado `vinylab_control_hml_secrets`: o compose novo usa `vinylab_control_secrets`. Migre o conteúdo ou recadastre secrets.

## Comandos

### DEV

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml down
cd backend && npm run migrate && npm run test && npm run build
cd frontend && npm run build
```

### VPS

```bash
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml exec -T backend node dist/db/migrate.js
curl -s http://127.0.0.1:3001/health
```

## Healthcheck

```json
{
  "status": "ok",
  "database": "connected",
  "environment": "vps",
  "timestamp": "...",
  "uptime": 12.3,
  "databaseLatencyMs": 2
}
```

Em `vps`/`production`, DB ausente/falho → HTTP 503.

## Segurança

- Sessões: apenas hash SHA-256 do token no banco
- Senhas: Argon2id
- CSRF básico: validação Origin/Referer em métodos mutáveis (token CSRF pode vir depois)
- Secrets providers: AES-256-GCM em `backend/data/secrets.enc.json`
- Logs: redaction de cookie, authorization, password, token, DATABASE_URL, etc.
- Audit: `login_success`, `login_failed`, `logout`, `setup_login_success`, `setup_login_failed`, `owner_created`, `setup_completed` (sem senhas/tokens)

## Testes frontend

A stack frontend atual não inclui runner de testes (Vitest/Jest/Playwright). Pendência documentada: redirect sem auth, login, logout e estado autenticado.

## Scripts npm

| Pasta | Dev | Migrate | Lint | Test | Build |
|---|---|---|---|---|---|
| frontend | `npm run dev` | — | `npm run lint` | — | `npm run build` |
| backend | `npm run dev` | `npm run migrate` | `npm run lint` | `npm run test` | `npm run build` |
