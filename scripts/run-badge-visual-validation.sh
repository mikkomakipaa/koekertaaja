#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
PWK_DEFAULT="$ROOT_DIR/.codex-home/.codex/skills/playwright-koekertaaja-chrome/scripts/pw_chrome.sh"
PWK="${PWK:-$PWK_DEFAULT}"
APP_URL="${APP_URL:-http://localhost:3000}"
PAGE_PATH="/dev/visual-regression/badges"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/output/playwright/badge-visual-regression/$TIMESTAMP}"
SESSION_PREFIX="badge-visual-$TIMESTAMP"

if ! command -v npx >/dev/null 2>&1; then
  echo "Missing command: npx" >&2
  exit 1
fi

if [[ ! -x "$PWK" ]]; then
  echo "PWK not executable: $PWK" >&2
  echo "Install or expose the Playwright Chrome skill first." >&2
  echo "Expected repo-local path: $PWK_DEFAULT" >&2
  echo "Alternative: export PWK=\"$CODEX_HOME_DIR/skills/playwright-koekertaaja-chrome/scripts/pw_chrome.sh\"" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

run_case() {
  local viewport_name="$1"
  local width="$2"
  local height="$3"
  local theme="$4"
  local session="${SESSION_PREFIX}-${viewport_name}-${theme}"
  local url="${APP_URL}${PAGE_PATH}?theme=${theme}"

  echo "[badge-visual] ${viewport_name} ${theme} -> ${url}"

  "$PWK" --session "$session" open "$url" >/dev/null
  "$PWK" --session "$session" run-code "async (page) => {
    await page.setViewportSize({ width: ${width}, height: ${height} });
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid=\"results-badge-visual\"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('[data-testid=\"achievements-badge-visual\"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.screenshot({ path: '${OUTPUT_DIR}/${viewport_name}-${theme}-full.png', fullPage: true });
    await page.locator('[data-testid=\"results-badge-visual\"]').screenshot({ path: '${OUTPUT_DIR}/${viewport_name}-${theme}-results.png' });
    await page.locator('[data-testid=\"achievements-badge-visual\"]').screenshot({ path: '${OUTPUT_DIR}/${viewport_name}-${theme}-achievements.png' });
  }" >/dev/null
  "$PWK" --session "$session" close >/dev/null || true
}

run_case mobile 390 1180 light
run_case mobile 390 1180 dark
run_case desktop 1440 1800 light
run_case desktop 1440 1800 dark

cat <<EOF
[badge-visual] screenshots written to:
  $OUTPUT_DIR

Generated files:
  mobile-light-full.png
  mobile-light-results.png
  mobile-light-achievements.png
  mobile-dark-full.png
  mobile-dark-results.png
  mobile-dark-achievements.png
  desktop-light-full.png
  desktop-light-results.png
  desktop-light-achievements.png
  desktop-dark-full.png
  desktop-dark-results.png
  desktop-dark-achievements.png
EOF
