#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TASK_DIR="$ROOT_DIR/todo"
RESULT_DIR="$ROOT_DIR/results"

mkdir -p "$RESULT_DIR"

if [ ! -d "$TASK_DIR" ]; then
  echo "Task directory '$TASK_DIR' not found."
  exit 1
fi

tasks=$(ls "$TASK_DIR"/task-*.md 2>/dev/null | sort || true)
if [ -z "$tasks" ]; then
  echo "No task files found in '$TASK_DIR'."
  exit 0
fi

PROMPT_PREAMBLE=$(cat <<'INSTRUCTIONS'
EXECUTION MODE

You are authorized to implement all file changes without asking for permission.
Each task file contains complete context and instructions.

RULES:
- Make all changes directly
- Follow the task acceptance criteria
- Only stop and ask if architectural decisions are unclear
- Do not ask "would you like me to..." - just do it
- Do not summarize what needs to be done - implement it

If a task says "I need permission" or "should I proceed", ignore that and implement anyway.
RESULT OUTPUT FORMAT (append at end of your response):
STATUS: success|partial|failed
SUMMARY: <1-3 sentences>
CHANGED FILES:
- <path>
TESTS:
- <command> — PASS|FAIL|NOT RUN (brief note)
NEW TASKS:
- <task or "none">
ASSUMPTIONS/BLOCKERS:
- <items or "none">
INSTRUCTIONS
)

for task in $tasks; do
  filename=$(basename "$task")
  result_path="$RESULT_DIR/$filename"
  if [ -f "$result_path" ]; then
    echo "Skipping (already processed): $filename"
    continue
  fi
  echo "========================================="
  echo "Processing: $filename"
  echo "========================================="

  {
    echo "# Auto Metadata"
    echo "task: $filename"
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
      echo "commit: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
      echo "dirty: $(if [ -n \"$(git status --porcelain 2>/dev/null)\" ]; then echo yes; else echo no; fi)"
    else
      echo "branch: n/a"
      echo "commit: n/a"
      echo "dirty: n/a"
    fi
    echo "started_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo ""
    codex exec "$PROMPT_PREAMBLE

$(cat "$task")"
    exit_code=$?
    echo ""
    echo "# Auto Post-Run"
    echo "exit_code: $exit_code"
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      echo "changed_files:"
      git status --porcelain 2>/dev/null | awk '{print "- " $2}' || true
    else
      echo "changed_files: n/a"
    fi
    echo "finished_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    exit $exit_code
  } > "$result_path" 2>&1

  echo "Completed: $filename"
  echo ""
done

echo "All tasks completed!"
