#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/.logs"
if [[ -z "${JAVA_HOME:-}" ]] && [[ -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 21)"
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
  PATH="${JAVA_HOME}/bin:${PATH}"
fi

wait_for_port() {
  local port="$1"
  local label="$2"

  for _ in {1..80}; do
    if lsof -tiTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
      printf '%s: listening on port %s\n' "${label}" "${port}"
      return
    fi
    sleep 0.25
  done

  printf '%s: did not open port %s in time\n' "${label}" "${port}" >&2
  return 1
}

cd "${ROOT_DIR}"
mkdir -p "${LOG_DIR}"
PIDS=()

cleanup() {
  if [[ "${#PIDS[@]}" -gt 0 ]]; then
    printf '\nstopping dev server pid(s) %s\n' "${PIDS[*]}"
    kill "${PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

if lsof -tiTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
  printf 'backend: already running on port 8081\n'
else
  printf 'backend: starting\n'
  ./gradlew :backend:bootRun --args='--spring.profiles.active=dev' >"${LOG_DIR}/backend.log" 2>&1 &
  PIDS+=("$!")
  wait_for_port 8081 "backend"
fi

if lsof -tiTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  printf 'frontend: already running on port 5173\n'
else
  printf 'frontend: starting\n'
  (
    cd "${ROOT_DIR}/frontend"
    npm run dev -- --host 127.0.0.1 >"${LOG_DIR}/frontend.log" 2>&1
  ) &
  PIDS+=("$!")
  wait_for_port 5173 "frontend"
fi

printf 'ready: http://127.0.0.1:5173\n'
printf 'logs: %s\n' "${LOG_DIR}"

if [[ "${#PIDS[@]}" -gt 0 ]]; then
  printf 'dev servers are running. Press Ctrl-C to stop.\n'
  wait "${PIDS[@]}"
fi
