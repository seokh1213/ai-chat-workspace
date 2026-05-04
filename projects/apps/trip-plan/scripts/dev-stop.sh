#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

stop_port() {
  local port="$1"
  local label="$2"
  local pids

  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "${pids}" ]]; then
    printf '%s: not running on port %s\n' "${label}" "${port}"
    return
  fi

  printf '%s: stopping pid(s) %s on port %s\n' "${label}" "${pids//$'\n'/ }" "${port}"
  local original_pids="${pids}"
  kill ${pids} 2>/dev/null || true

  for _ in {1..20}; do
    local alive_pids=""
    for pid in ${original_pids}; do
      if kill -0 "${pid}" 2>/dev/null; then
        alive_pids="${alive_pids} ${pid}"
      fi
    done

    if [[ -z "${alive_pids}" ]] && ! lsof -tiTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      printf '%s: stopped\n' "${label}"
      return
    fi
    sleep 0.25
  done

  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  local force_pids="${pids} ${original_pids}"
  if [[ -n "${force_pids// }" ]]; then
    printf '%s: force stopping pid(s) %s\n' "${label}" "${force_pids//$'\n'/ }"
    kill -9 ${force_pids} 2>/dev/null || true
  fi
}

cd "${ROOT_DIR}"
stop_port 8081 "backend"
stop_port 5173 "frontend"
stop_port 8765 "codex app-server"
