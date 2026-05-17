#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/.logs"

pid_cwd() {
  local pid="$1"
  local cwd

  cwd="$(lsof -a -p "${pid}" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1)"
  printf '%s\n' "${cwd}"
}

pid_command() {
  local pid="$1"

  ps -p "${pid}" -o args= 2>/dev/null || true
}

is_managed_pid() {
  local pid="$1"
  local label="$2"
  local cwd
  local command

  cwd="$(pid_cwd "${pid}")"
  command="$(pid_command "${pid}")"

  case "${label}" in
    backend)
      [[ "${cwd}" == "${ROOT_DIR}"* ]] && [[ "${command}" == *"gradlew"* || "${command}" == *"TripPlannerApplication"* || "${command}" == *":backend:bootRun"* ]]
      ;;
    frontend)
      [[ "${cwd}" == "${ROOT_DIR}/frontend"* ]] && [[ "${command}" == *"vite"* || "${command}" == *"npm"* || "${command}" == *"node"* ]]
      ;;
    codex-app-server)
      [[ "${cwd}" == "${ROOT_DIR}"* ]] && [[ "${command}" == *"codex app-server"* ]]
      ;;
    *)
      return 1
      ;;
  esac
}

stop_pids() {
  local label="$1"
  shift
  local pids=("$@")

  if [[ "${#pids[@]}" -eq 0 ]]; then
    return
  fi

  printf '%s: stopping pid(s) %s\n' "${label}" "${pids[*]}"
  kill "${pids[@]}" 2>/dev/null || true

  for _ in {1..20}; do
    local alive_pids=()
    local pid
    for pid in "${pids[@]}"; do
      if kill -0 "${pid}" 2>/dev/null; then
        alive_pids+=("${pid}")
      fi
    done

    if [[ "${#alive_pids[@]}" -eq 0 ]]; then
      printf '%s: stopped\n' "${label}"
      return
    fi
    sleep 0.25
  done

  local alive_pids=()
  local pid
  for pid in "${pids[@]}"; do
    if kill -0 "${pid}" 2>/dev/null; then
      alive_pids+=("${pid}")
    fi
  done

  if [[ "${#alive_pids[@]}" -gt 0 ]]; then
    printf '%s: force stopping pid(s) %s\n' "${label}" "${alive_pids[*]}"
    kill -9 "${alive_pids[@]}" 2>/dev/null || true
  fi
}

stop_pid_file() {
  local label="$1"
  local pid_file="${LOG_DIR}/${label}.pid"

  if [[ ! -f "${pid_file}" ]]; then
    return
  fi

  local pid
  pid="$(sed -n '1p' "${pid_file}")"
  rm -f "${pid_file}"

  if [[ -z "${pid}" ]] || ! kill -0 "${pid}" 2>/dev/null; then
    return
  fi

  if is_managed_pid "${pid}" "${label}"; then
    stop_pids "${label}" "${pid}"
  else
    printf '%s: pid file pointed to unmanaged pid %s, skipping\n' "${label}" "${pid}"
  fi
}

stop_port() {
  local port="$1"
  local label="$2"
  local pids
  local managed_pids=()

  pids="$(lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "${pids}" ]]; then
    printf '%s: not running on port %s\n' "${label}" "${port}"
    return
  fi

  local pid
  for pid in ${pids}; do
    if is_managed_pid "${pid}" "${label}"; then
      managed_pids+=("${pid}")
    else
      printf '%s: port %s has unmanaged pid %s, skipping\n' "${label}" "${port}" "${pid}"
    fi
  done

  if [[ "${#managed_pids[@]}" -eq 0 ]]; then
    return
  fi

  stop_pids "${label}" "${managed_pids[@]}"
}

cd "${ROOT_DIR}"
stop_pid_file "backend"
stop_pid_file "frontend"
stop_port 8081 "backend"
stop_port 5173 "frontend"
stop_port 8765 "codex-app-server"
