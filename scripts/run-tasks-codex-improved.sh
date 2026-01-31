#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TASK_DIR="$ROOT_DIR/todo"
RESULT_DIR="$ROOT_DIR/results"
RAW_RESULT_DIR="$RESULT_DIR/raw"

# Create directories with proper permissions
mkdir -p "$RESULT_DIR"
mkdir -p "$RAW_RESULT_DIR"
chmod 755 "$RESULT_DIR" "$RAW_RESULT_DIR" 2>/dev/null || true

if [ ! -d "$TASK_DIR" ]; then
  echo "ERROR: Task directory '$TASK_DIR' not found."
  exit 1
fi

# Check if task directory is readable
if [ ! -r "$TASK_DIR" ]; then
  echo "ERROR: Task directory '$TASK_DIR' is not readable."
  echo "Run: chmod 755 '$TASK_DIR'"
  exit 1
fi

# Find task files more robustly
tasks=$(find "$TASK_DIR" -maxdepth 1 -name "task-*.md" -type f 2>/dev/null | sort || true)
if [ -z "$tasks" ]; then
  echo "No task files found in '$TASK_DIR'."
  exit 0
fi

# Check if codex is available
if ! command -v codex &> /dev/null; then
  echo "ERROR: 'codex' command not found in PATH."
  echo "Install it or ensure it's in your PATH."
  exit 1
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

total_tasks=$(echo "$tasks" | wc -l | tr -d ' ')
current_task=0

for task in $tasks; do
  current_task=$((current_task + 1))
  filename=$(basename "$task")
  result_path="$RESULT_DIR/$filename"
  raw_result_path="$RAW_RESULT_DIR/$filename"

  # Check file permissions
  if [ ! -r "$task" ]; then
    echo "[$current_task/$total_tasks] SKIPPING (not readable): $filename"
    echo "Run: chmod 644 '$task'"
    continue
  fi

  if [ -f "$result_path" ]; then
    echo "[$current_task/$total_tasks] SKIPPING (already processed): $filename"
    continue
  fi

  echo "========================================="
  echo "[$current_task/$total_tasks] Processing: $filename"
  echo "========================================="

  # Function to run codex
  run_codex() {
    local prompt
    prompt="$PROMPT_PREAMBLE"$'\n\n'"$(cat "$task")"
    codex --no-alt-screen exec "$prompt"
    return $?
  }

  # Run codex and capture output (allow failures)
  set +e
  run_codex > "$raw_result_path" 2>&1
  exit_code=$?
  set -e

  # Check for authentication issues
  if [ $exit_code -ne 0 ]; then
    if grep -Eqi "not logged in|unauthorized|login required" "$raw_result_path" 2>/dev/null; then
      echo "Codex requires login; starting device authentication..."
      codex login --device-auth

      # Retry after login
      set +e
      run_codex > "$raw_result_path" 2>&1
      exit_code=$?
      set -e
    fi
  fi

  # Extract result format from output (improved AWK)
  awk '
    /^STATUS:/ { block=""; in_block=1; after=0 }
    {
      if (in_block) {
        if (after && $0 !~ /^-/ && $0 !~ /^$/ && $0 !~ /^[A-Z]+:/) {
          in_block=0
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

  # If extraction failed, create error result
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

  # Set result file permissions
  chmod 644 "$result_path" "$raw_result_path" 2>/dev/null || true

  # Report status
  if [ $exit_code -ne 0 ]; then
    echo "ERROR: Task failed with exit code $exit_code"
    echo "Check $raw_result_path for details"
  else
    echo "COMPLETED: $filename"
  fi
  echo ""
done

echo "========================================="
echo "All tasks completed!"
echo "Results: $RESULT_DIR"
echo "Raw logs: $RAW_RESULT_DIR"
echo "========================================="
