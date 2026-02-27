---
name: "playwright-koekertaaja-chrome"
description: "Run Koekertaaja browser testing from terminal with Playwright CLI on Chrome, including prerequisite checks and executable CLI runbooks."
---

# Playwright Koekertaaja Chrome Skill

Use this skill when you need repeatable browser testing for Koekertaaja in Chrome from the terminal.

## 1) Prerequisites

Run prerequisite check first:

```bash
"$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/check_prereqs.sh"
```

What this verifies:
- `node`, `npm`, `npx`
- local `@playwright/cli` availability
- Google Chrome at `/Applications/Google Chrome.app`

If `@playwright/cli` is missing, install it in this repo:

```bash
npm install --save-dev @playwright/cli
```

## 2) Skill setup

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWK="$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/pw_chrome.sh"
export RUNBOOK="$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/runbook.sh"
```

Optional alias:

```bash
alias pwk="$PWK"
```

## 3) Start app

```bash
npm run dev
```

App URL: `http://localhost:3000`

## 4) CLI runbooks

List runbook cases:

```bash
"$RUNBOOK" list
```

Run one case:

```bash
"$RUNBOOK" tc-play-001
```

Run all cases:

```bash
"$RUNBOOK" all
```

## 5) References

- `references/koekertaaja-app-flow-test-cases.md`

## 6) Guardrails

- Snapshot before interacting with `e*` refs.
- Re-snapshot after navigation or major UI changes.
- Prefer `click/fill/press` over `run-code`; runbook uses `run-code` only where text-targeting makes flows robust.
- Use separate sessions per test run.
- Keep artifacts in `output/playwright/`.
