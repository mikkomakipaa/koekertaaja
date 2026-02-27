# Playwright Chrome Skill Setup (Koekertaaja)

This repository includes a Chrome-integrated Playwright CLI skill and executable CLI runbooks.

## 1) Install the skill into your Codex home

```bash
bash scripts/install-playwright-koekertaaja-skill.sh
```

Default install target:
- `${CODEX_HOME:-$HOME/.codex}/skills/playwright-koekertaaja-chrome`

## 2) Verify prerequisites

```bash
"${CODEX_HOME:-$HOME/.codex}/skills/playwright-koekertaaja-chrome/scripts/check_prereqs.sh"
```

Expected checks:
- `node`, `npm`, `npx`
- `@playwright/cli` runnable via `npx`
- Google Chrome app at `/Applications/Google Chrome.app`

If Playwright CLI is missing:

```bash
npm install --save-dev @playwright/cli
```

## 3) Set helper commands

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWK="$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/pw_chrome.sh"
export RUNBOOK="$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/runbook.sh"
alias pwk="$PWK"
```

## 4) Start app

```bash
npm run dev
```

## 5) Run CLI runbooks

List all cases:

```bash
"$RUNBOOK" list
```

Run one:

```bash
"$RUNBOOK" tc-play-001
```

Run all:

```bash
"$RUNBOOK" all
```

## 6) Runbook reference

See:
- `.codex-home/.codex/skills/playwright-koekertaaja-chrome/references/koekertaaja-app-flow-test-cases.md`
