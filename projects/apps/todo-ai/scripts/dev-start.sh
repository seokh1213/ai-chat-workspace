#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "${JAVA_HOME:-}" ]] && [[ -x /usr/libexec/java_home ]]; then
  export JAVA_HOME
  JAVA_HOME="$(/usr/libexec/java_home -v 21)"
fi

cleanup() {
  local pids
  pids="$(jobs -p)"
  if [ -n "$pids" ]; then
    kill $pids
  fi
}

trap cleanup EXIT

cd "$ROOT"
./gradlew :backend:bootRun &

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev
