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
  err "Falha no deploy (linha ${1})."
  exit 1
}
trap 'on_error $LINENO' ERR

run_migrations() {
  log "Executando migrations..."
  "${COMPOSE[@]}" -f "${COMPOSE_FILE}" exec -T backend node dist/db/migrate.js
}

cd "${ROOT_DIR}"

log "Validando pré-requisitos..."
require_cmd docker
require_cmd git

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  err "Docker Compose não encontrado."
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  err "Arquivo ${ENV_FILE} não encontrado. Abortando para não sobrescrever/criar secrets."
  exit 1
fi

if [[ ! -d "${ROOT_DIR}/.git" ]]; then
  err "Diretório .git não encontrado. Este script espera um clone Git do repositório."
  exit 1
fi

for name in vinylab-control-backend-hml vinylab-control-frontend-hml; do
  if docker inspect "${name}" >/dev/null 2>&1; then
    warn "Container legado '${name}' ainda existe — pode conflitar com portas/nomes."
  fi
done

log "Atualizando código (git pull)..."
git pull --ff-only

log "Build das imagens..."
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" build

log "Recriando containers..."
"${COMPOSE[@]}" -f "${COMPOSE_FILE}" up -d

run_migrations

log "Verificando healthcheck..."
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

"${COMPOSE[@]}" -f "${COMPOSE_FILE}" ps

if [[ "${ready}" -ne 1 ]]; then
  err "Healthcheck falhou após o deploy."
  "${COMPOSE[@]}" -f "${COMPOSE_FILE}" logs --tail=80 backend || true
  exit 1
fi

"${COMPOSE[@]}" -f "${COMPOSE_FILE}" exec -T backend \
  node -e "fetch('http://127.0.0.1:3001/health').then(async (r)=>{console.log(await r.text()); process.exit(r.ok?0:1)}).catch((e)=>{console.error(e); process.exit(1)})"

log "Deploy concluído."
