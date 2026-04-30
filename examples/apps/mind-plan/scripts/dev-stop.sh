#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for name in frontend backend; do
  PID_FILE="$ROOT_DIR/.data/$name.pid"
  if [[ -f "$PID_FILE" ]]; then
    PID="$(cat "$PID_FILE")"
    if kill -0 "$PID" 2>/dev/null; then
      echo "Stopping $name PID $PID"
      kill "$PID"
    fi
    rm -f "$PID_FILE"
  fi
done
