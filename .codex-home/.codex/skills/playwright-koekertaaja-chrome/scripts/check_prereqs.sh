#!/usr/bin/env bash
set -euo pipefail

errors=0

check_cmd() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[ok] $cmd: $(command -v "$cmd")"
  else
    echo "[missing] $cmd"
    errors=$((errors + 1))
  fi
}

echo "Checking Playwright Chrome prerequisites..."
check_cmd node
check_cmd npm
check_cmd npx

if [ -d "/Applications/Google Chrome.app" ]; then
  echo "[ok] Google Chrome: /Applications/Google Chrome.app"
else
  echo "[missing] Google Chrome app at /Applications/Google Chrome.app"
  errors=$((errors + 1))
fi

if npx --yes --package @playwright/cli playwright-cli --version >/dev/null 2>&1; then
  echo "[ok] @playwright/cli is runnable via npx"
else
  echo "[missing] @playwright/cli not runnable via npx"
  echo "Install with: npm install --save-dev @playwright/cli"
  errors=$((errors + 1))
fi

if [ "$errors" -gt 0 ]; then
  echo "Prerequisite check failed with $errors issue(s)."
  exit 1
fi

echo "All prerequisites are ready."
