#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/.codex-home/.codex/skills/playwright-koekertaaja-chrome"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
DEST_DIR="$CODEX_HOME_DIR/skills/playwright-koekertaaja-chrome"

if [ ! -d "$SRC_DIR" ]; then
  echo "Source skill directory missing: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$CODEX_HOME_DIR/skills"
rm -rf "$DEST_DIR"
cp -R "$SRC_DIR" "$DEST_DIR"

echo "Installed skill to: $DEST_DIR"
echo "Run prereqs: $DEST_DIR/scripts/check_prereqs.sh"
