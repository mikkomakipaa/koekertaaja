# Koekertaaja CLI Runbook (Chrome + Playwright CLI)

This is an executable runbook for app usage tests:
- play
- flashcards
- achievements

## Prerequisites

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWK="$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/pw_chrome.sh"
export RUNBOOK="$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/runbook.sh"
export APP_URL="http://localhost:3000"
```

App must be running:

```bash
npm run dev
```

Optional prerequisite check:

```bash
"$CODEX_HOME/skills/playwright-koekertaaja-chrome/scripts/check_prereqs.sh"
```

## Runbook Cases

List available cases:

```bash
"$RUNBOOK" list
```

Run one case:

```bash
"$RUNBOOK" tc-play-001
"$RUNBOOK" tc-play-002
"$RUNBOOK" tc-flash-001
"$RUNBOOK" tc-flash-002
"$RUNBOOK" tc-ach-001
"$RUNBOOK" tc-ach-002
```

Run all:

```bash
"$RUNBOOK" all
```

## Case Coverage

- `tc-play-001`: open browse + start quiz
- `tc-play-002`: submit answer + move to next question
- `tc-flash-001`: open study mode + enter flashcard session
- `tc-flash-002`: show flashcard answer + advance card
- `tc-ach-001`: navigate from play to achievements
- `tc-ach-002`: validate achievements renders either progress or empty state

## Artifacts

Each case writes artifacts to:

- `output/playwright/runbook/<case-id>/<timestamp>/runbook.log`
- screenshot files from `playwright-cli screenshot`
- console warnings output
- network log output
