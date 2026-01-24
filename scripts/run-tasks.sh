#!/bin/bash

# Generic task runner - delegates to Claude or Codex based on availability

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check which CLI is available
if command -v claude &> /dev/null; then
  echo "Using Claude CLI for task execution..."
  exec "$SCRIPT_DIR/run-tasks-claude.sh" "$@"
elif command -v codex &> /dev/null; then
  echo "Using Codex CLI for task execution..."
  exec "$SCRIPT_DIR/run-tasks-codex.sh" "$@"
else
  echo "ERROR: Neither 'claude' nor 'codex' CLI found."
  echo ""
  echo "Please install one of:"
  echo "  - Claude CLI: https://claude.ai/download"
  echo "  - Codex CLI: (installation instructions)"
  exit 1
fi
