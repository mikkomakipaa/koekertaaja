#!/usr/bin/env bash
set -euo pipefail

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx is required but was not found on PATH." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <playwright-cli command> [args]" >&2
  exit 1
fi

cmd=(npx --yes --package @playwright/cli playwright-cli)

# Preserve existing session behavior if configured.
has_session_flag="false"
for arg in "$@"; do
  case "$arg" in
    --session|--session=*)
      has_session_flag="true"
      break
      ;;
  esac
done

if [[ "${has_session_flag}" != "true" && -n "${PLAYWRIGHT_CLI_SESSION:-}" ]]; then
  cmd+=(--session "${PLAYWRIGHT_CLI_SESSION}")
fi

first_arg="$1"
shift

# Force Chrome channel for browser start unless caller explicitly overrides.
if [[ "$first_arg" == "open" ]]; then
  has_browser_flag="false"
  for arg in "$@"; do
    if [[ "$arg" == "--browser" ]]; then
      has_browser_flag="true"
      break
    fi
  done

  if [[ "$has_browser_flag" != "true" ]]; then
    cmd+=(open --browser chrome "$@")
  else
    cmd+=(open "$@")
  fi
else
  cmd+=("$first_arg" "$@")
fi

exec "${cmd[@]}"
