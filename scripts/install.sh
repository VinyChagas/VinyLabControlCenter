#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.yml"
ENV_FILE="${ROOT_DIR}/.env"

log() { printf '==> %s\n' "$*"; }
err() { printf 'ERROR: %s\n' "$*" >&2; }
warn() { printf 'WARNING: %s\n' "$*" >&2; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Comando obrigatório não encontrado: $1"
    exit 1
  fi
}

on_error() {
  err "Falha no install (linha ${1})."
  exit 1
}
trap 'on_error $LINENO' ERR

cd "${ROOT_DIR}"

log "Validando pré-requisitos..."
require_cmd docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  err "Docker Compose não encontrado (plugin 'docker compose' ou binário docker-compose)."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  err "Docker daemon inacessível. Verifique se o serviço está rodando e se você tem permissão."
  exit 1
fi

if ! docker network inspect vinylab_internal >/dev/null 2>&1; then
  err "Network Docker 'vinylab_internal' não existe."
  exit 1
fi

if ! docker network inspect vinylab_proxy >/dev/null 2>&1; then
  err "Network Docker 'vinylab_proxy' não existe."
  exit 1
fi

if ! docker inspect vinylab-postgres >/dev/null 2>&1; then
  err "Container 'vinylab-postgres' não encontrado. O PostgreSQL da VPS precisa existir previamente."
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  err "Arquivo ${ENV_FILE} não encontrado."
  err "Copie .env.example para .env e preencha os secrets manualmente."
  err "Este script NÃO cria nem sobrescreve secrets."
  exit 1
fi

# Containers legados com sufixo antigo (não removidos automaticamente).
legacy_containers=(
  vinylab-control-backend-hml
  vinylab-control-frontend-hml
)
for name in "${legacy_containers[@]}"; do
  if docker inspect "${name}" >/dev/null 2>&1; then
    warn "Container legado '${name}' ainda existe."
    warn "Pare/remova manualmente antes do up para liberar portas 3001/8080:"
    warn "  docker stop ${name} && docker rm ${name}"
  fi
done

if docker volume inspect vinylab_control_hml_secrets >/dev/null 2>&1; then
  warn "Volume legado 'vinylab_control_hml_secrets' existe."
  warn "O compose novo usa 'vinylab_control_secrets' (vazio). Migre secrets ou recadastre-os."
fi

required_vars=(
  NODE_ENV PORT DATABASE_URL FRONTEND_URL SECRET_MASTER_KEY APP_ENV
  SESSION_TTL_HOURS BOOTSTRAP_OWNER_EMAIL BOOTSTRAP_OWNER_PASSWORD BOOTSTRAP_OWNER_NAME
)
missing=()
# shellcheck disable=SC1090
set -a
source "${ENV_FILE}"
set +a
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("${var}")
  fi
done
if ((${#missing[@]} > 0)); then
  err "Variáveis ausentes em .env: ${missing[*]}"
  exit 1
fi

if [[ "${SECRET_MASTER_KEY}" == *"CHANGE_ME"* ]] || ((${#SECRET_MASTER_KEY} < 32)); then
  err "SECRET_MASTER_KEY inválida. Use uma chave aleatória com pelo menos 32 caracteres."
  exit 1
fi

if [[ "${DATABASE_URL}" == *"USER:PASSWORD"* ]] || [[ "${DATABASE_URL}" == *"CHANGE_ME"* ]]; then
  err "DATABASE_URL ainda contém placeholder. Preencha com a connection string real da VPS."
  exit 1
fi

if [[ "${BOOTSTRAP_OWNER_PASSWORD}" == *"CHANGE_ME"* ]] || ((${#BOOTSTRAP_OWNER_PASSWORD} < 12)); then
  err "BOOTSTRAP_OWNER_PASSWORD inválida (mínimo 12 caracteres, sem placeholder)."
  exit 1
fi

if [[ "${FRONTEND_URL}" == *"127.0.0.1"* ]] || [[ "${FRONTEND_URL}" == *"localhost"* ]]; then
  err "FRONTEND_URL deve ser a origem pública HTTPS (ex.: https://control.vinichagas.cloud)."
  exit 1
fi

log "Build das imagens..."
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" build

log "Subindo containers (sem tocar em volumes externos do PostgreSQL)..."
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" up -d

log "Executando migrations..."
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" exec -T backend node dist/db/migrate.js

log "Aguardando healthcheck do backend..."
ready=0
for _ in $(seq 1 30); do
  if "${COMPOSE[@]}" -f "${COMPOSE_FILE}" exec -T backend \
    node -e "fetch('http://127.0.0.1:3001/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

log "Status dos containers:"
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" ps

if [[ "${ready}" -ne 1 ]]; then
  err "Healthcheck do backend falhou."
  "${COMPOSE[@]}" -f "${COMPOSE_FILE}" logs --tail=80 backend || true
  exit 1
fi

log "Resposta do healthcheck:"
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" exec -T backend \
  node -e "fetch('http://127.0.0.1:3001/health').then(async (r)=>{console.log(await r.text()); process.exit(r.ok?0:1)}).catch((e)=>{console.error(e); process.exit(1)})"

log "Install concluído."
log "Frontend (localhost): http://127.0.0.1:8080"
log "Backend  (localhost): http://127.0.0.1:3001/health"
log "Próximo passo: revisar e aplicar o bloco Caddy sugerido para control.vinichagas.cloud"
