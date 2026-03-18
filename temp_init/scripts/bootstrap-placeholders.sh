#!/usr/bin/env sh

set -eu

echo "[temp] Placeholder bootstrap started"

mkdir -p temp_init/runtime
cat > temp_init/runtime/placeholder-state.json <<'JSON'
{
  "status": "placeholder",
  "generatedAt": "manual-run"
}
JSON

echo "[temp] Placeholder bootstrap completed"
