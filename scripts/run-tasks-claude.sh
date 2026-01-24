#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TASK_DIR="$ROOT_DIR/todo"
RESULT_DIR="$ROOT_DIR/results"
RAW_RESULT_DIR="$RESULT_DIR/raw"

mkdir -p "$RESULT_DIR"
mkdir -p "$RAW_RESULT_DIR"

if [ ! -d "$TASK_DIR" ]; then
  echo "Task directory '$TASK_DIR' not found."
  exit 1
fi

tasks=$(ls "$TASK_DIR"/*.md 2>/dev/null | sort || true)
if [ -z "$tasks" ]; then
  echo "No task files found in '$TASK_DIR'."
  exit 0
fi

PROMPT_PREAMBLE=$(cat <<'INSTRUCTIONS'
[MODE: EXECUTION]

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
  raw_result_path="$RAW_RESULT_DIR/$filename"
  if [ -f "$result_path" ]; then
    echo "Skipping (already processed): $filename"
    continue
  fi
  echo "========================================="
  echo "Processing: $filename"
  echo "========================================="

  # Run Claude with explicit permission mode for scripted execution
  # --permission-mode bypassPermissions: Skips all permission prompts for file operations
  # --add-dir: Explicitly allow access to project directory
  # -p: Print mode (non-interactive)
  # Pass content via stdin instead of as argument (more reliable for multi-line)
  set +e
  {
    echo "$PROMPT_PREAMBLE"
    echo ""
    cat "$task"
  } | claude -p \
    --permission-mode bypassPermissions \
    --add-dir "$ROOT_DIR" > "$raw_result_path" 2>&1

  exit_code=$?
  set -e
  awk '
    /^STATUS:/ { block=""; in=1; after=0 }
    {
      if (in) {
        if (after && $0 !~ /^-/ && $0 !~ /^$/) {
          in=0
        } else {
          block = block $0 "\n"
          if ($0 ~ /^ASSUMPTIONS\/BLOCKERS:/) {
            after=1
          }
        }
      }
    }
    END { printf "%s", block }
  ' "$raw_result_path" > "$result_path"

  if [ ! -s "$result_path" ]; then
    {
      echo "STATUS: failed"
      echo "SUMMARY: Task runner did not capture a valid RESULT OUTPUT FORMAT. See raw log."
      echo "CHANGED FILES:"
      echo "- none"
      echo "TESTS:"
      echo "- NOT RUN"
      echo "NEW TASKS:"
      echo "- none"
      echo "ASSUMPTIONS/BLOCKERS:"
      echo "- raw log at $raw_result_path"
    } > "$result_path"
  fi

  if [ $exit_code -ne 0 ]; then
    echo "ERROR: Task failed with exit code $exit_code"
    echo "Check $raw_result_path for details"
    # Continue processing other tasks instead of exiting
  else
    echo "Completed: $filename"
  fi
  echo ""
done

echo "All tasks completed!"
