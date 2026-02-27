#!/usr/bin/env bash
set -euo pipefail

CASE_ID="${1:-}" 

if [[ -z "$CASE_ID" ]]; then
  echo "Usage: $0 <case-id|all|list>"
  echo "Examples:"
  echo "  $0 list"
  echo "  $0 tc-play-001"
  echo "  $0 all"
  exit 1
fi

CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
PWK="${PWK:-$CODEX_HOME_DIR/skills/playwright-koekertaaja-chrome/scripts/pw_chrome.sh}"
APP_URL="${APP_URL:-http://localhost:3000}"
ROOT_DIR="$(pwd)"
TS="$(date +%Y%m%d-%H%M%S)"

CASES=(
  "tc-play-001"
  "tc-play-002"
  "tc-flash-001"
  "tc-flash-002"
  "tc-ach-001"
  "tc-ach-002"
)

if [[ "$CASE_ID" == "list" ]]; then
  printf '%s\n' "${CASES[@]}"
  exit 0
fi

need_cmd() {
  local c="$1"
  if ! command -v "$c" >/dev/null 2>&1; then
    echo "Missing command: $c" >&2
    exit 1
  fi
}

need_cmd npx

if [[ ! -x "$PWK" ]]; then
  echo "PWK not executable: $PWK" >&2
  echo "Set PWK explicitly or run installer:" >&2
  echo "  bash scripts/install-playwright-koekertaaja-skill.sh" >&2
  exit 1
fi

run_case() {
  local case_name="$1"
  local session="${PLAYWRIGHT_CLI_SESSION:-${case_name}-${TS}}"
  local out_dir="$ROOT_DIR/output/playwright/runbook/${case_name}/${TS}"
  mkdir -p "$out_dir"

  local log_file="$out_dir/runbook.log"

  pw() {
    local output
    output="$("$PWK" --session "$session" "$@" 2>&1)"
    echo "$output" | tee -a "$log_file"

    if echo "$output" | grep -q '^### Error'; then
      echo "[runbook] command failed: $*" | tee -a "$log_file" >&2
      return 1
    fi
  }

  run_fn() {
    local fn_js="$1"
    pw run-code "$fn_js"
  }

  evidence() {
    pw screenshot
    pw console warning
    pw network
  }

  cleanup() {
    pw close || true
  }

  trap cleanup EXIT

  echo "[runbook] case=$case_name session=$session" | tee -a "$log_file"
  echo "[runbook] output=$out_dir" | tee -a "$log_file"

  case "$case_name" in
    tc-play-001)
      pw open "$APP_URL/play"
      pw snapshot
      run_fn "async (page) => { await page.getByRole('radio', { name: 'Pelaa' }).click().catch(() => {}); }"
      run_fn "async (page) => { const btn = page.getByRole('button', { name: /Aloita|Jatka/i }).first(); if (await btn.count() === 0) throw new Error('No Aloita/Jatka button found'); await btn.click(); }"
      run_fn "async (page) => { await page.waitForURL(/\\/play\\/[^\\/?]+/); }"
      pw snapshot
      run_fn "async (page) => { const hasCheck = await page.getByRole('button', { name: /Tarkista vastaus/i }).count(); if (!hasCheck) throw new Error('Quiz screen did not load'); }"
      evidence
      ;;

    tc-play-002)
      pw open "$APP_URL/play"
      run_fn "async (page) => { const btn = page.getByRole('button', { name: /Aloita|Jatka/i }).first(); if (await btn.count() === 0) throw new Error('No Aloita/Jatka button found'); await btn.click(); }"
      run_fn "async (page) => { await page.waitForURL(/\\/play\\/[^\\/?]+/); }"
      pw snapshot
      run_fn "async (page) => { let submitted = false; for (let i = 0; i < 3 && !submitted; i += 1) { const nextBtn = page.getByRole('button', { name: /Seuraava kysymys/i }); if (await nextBtn.count() > 0) { await nextBtn.first().click(); await page.waitForTimeout(200); } const checkBtn = page.getByRole('button', { name: /Tarkista vastaus/i }).first(); if (await checkBtn.count() === 0) { continue; } if (await page.locator('input[type=radio]').count() > 0) { await page.locator('input[type=radio]').first().check({ force: true }); } else if (await page.locator('input[type=checkbox]').count() > 0) { await page.locator('input[type=checkbox]').first().check({ force: true }); } else if (await page.locator('textarea').count() > 0) { await page.locator('textarea').first().fill('testivastaus'); } else if (await page.locator('input[type=text]').count() > 0) { await page.locator('input[type=text]').first().fill('testivastaus'); } else if (await page.getByRole('button', { name: /totta|tarua/i }).count() > 0) { await page.getByRole('button', { name: /totta|tarua/i }).first().click(); } if (await checkBtn.isEnabled()) { await checkBtn.click(); submitted = true; break; } const skipBtn = page.getByRole('button', { name: /Ohita kysymys/i }).first(); if (await skipBtn.count() > 0) { await skipBtn.click(); await page.getByRole('button', { name: /Seuraava kysymys/i }).first().click(); } } if (!submitted) throw new Error('Could not reach a submit-ready quiz state in 3 attempts'); }"
      run_fn "async (page) => { await page.getByRole('button', { name: /Seuraava kysymys/i }).waitFor({ timeout: 5000 }); }"
      pw snapshot
      run_fn "async (page) => { await page.getByRole('button', { name: /Seuraava kysymys/i }).click(); }"
      pw snapshot
      evidence
      ;;

    tc-flash-001)
      pw open "$APP_URL/play?mode=opettele"
      pw snapshot
      run_fn "async (page) => { await page.getByRole('radio', { name: 'Opettele' }).click().catch(() => {}); }"
      run_fn "async (page) => { const startStudy = page.getByRole('button', { name: /Opettele/i }).first(); if (await startStudy.count() === 0) throw new Error('No Opettele button found on browse cards'); await startStudy.click(); }"
      run_fn "async (page) => { await page.waitForURL(/mode=opettele/); }"
      run_fn "async (page) => { const allTopics = page.getByRole('button', { name: /Harjoittele kaikkia aiheita/i }); if (await allTopics.count() > 0) await allTopics.first().click(); }"
      pw snapshot
      run_fn "async (page) => { const ok = (await page.getByRole('button', { name: /Näytä vastaus|Seuraava/i }).count()) > 0; if (!ok) throw new Error('Flashcard session UI not detected'); }"
      evidence
      ;;

    tc-flash-002)
      pw open "$APP_URL/play?mode=opettele"
      run_fn "async (page) => { const startStudy = page.getByRole('button', { name: /Opettele/i }).first(); if (await startStudy.count() === 0) throw new Error('No Opettele button found'); await startStudy.click(); }"
      run_fn "async (page) => { await page.waitForURL(/mode=opettele/); }"
      run_fn "async (page) => { const allTopics = page.getByRole('button', { name: /Harjoittele kaikkia aiheita/i }); if (await allTopics.count() > 0) await allTopics.first().click(); }"
      pw snapshot
      run_fn "async (page) => { const showAnswer = page.getByRole('button', { name: /Näytä vastaus/i }).first(); if (await showAnswer.count() === 0) throw new Error('Näytä vastaus button not found'); await showAnswer.click(); }"
      run_fn "async (page) => { await page.getByText(/Oikea vastaus/i).waitFor({ timeout: 5000 }); }"
      pw snapshot
      run_fn "async (page) => { await page.getByRole('button', { name: /^Seuraava$/i }).click(); }"
      pw snapshot
      evidence
      ;;

    tc-ach-001)
      pw open "$APP_URL/play"
      pw snapshot
      run_fn "async (page) => { const achievements = page.getByRole('link', { name: /Saavutukset/i }).first(); if (await achievements.count() === 0) throw new Error('Saavutukset link not found'); await achievements.click(); }"
      run_fn "async (page) => { await page.waitForURL(/\\/play\\/achievements$/); }"
      pw snapshot
      run_fn "async (page) => { await page.getByRole('heading', { name: /Saavutukset/i }).waitFor({ timeout: 5000 }); }"
      evidence
      ;;

    tc-ach-002)
      pw open "$APP_URL/play/achievements"
      pw snapshot
      run_fn "async (page) => { const hasStats = (await page.getByText(/Sessiota|Täydellistä|Ennätys|Merkkejä/i).count()) > 0; const hasEmpty = (await page.getByText(/Aloita harjoittelu/i).count()) > 0; if (!hasStats && !hasEmpty) throw new Error('Achievements state not recognized'); }"
      evidence
      ;;

    *)
      echo "Unknown case: $case_name" >&2
      exit 1
      ;;
  esac

  echo "[runbook] PASS $case_name" | tee -a "$log_file"
  trap - EXIT
  cleanup
}

if [[ "$CASE_ID" == "all" ]]; then
  for c in "${CASES[@]}"; do
    run_case "$c"
  done
else
  run_case "$CASE_ID"
fi
