#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "${JAVA_HOME:-}" ]] && [[ -x /usr/libexec/java_home ]]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 21)"
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
  PATH="$JAVA_HOME/bin:$PATH"
fi
export JAVA_HOME PATH

cd "$ROOT_DIR"
mkdir -p .data .logs

echo "Starting backend on http://127.0.0.1:8091"
nohup env PORT=8091 ./gradlew :backend:bootRun > .logs/backend.log 2>&1 < /dev/null &
BACKEND_PID=$!
echo "$BACKEND_PID" > .data/backend.pid

echo "Starting frontend on http://127.0.0.1:5183"
cd "$ROOT_DIR/frontend"
nohup npm run dev > "$ROOT_DIR/.logs/frontend.log" 2>&1 < /dev/null &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$ROOT_DIR/.data/frontend.pid"

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Ready: http://127.0.0.1:5183"
