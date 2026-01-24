# Scripts

This directory contains automation scripts for development and testing workflows.

---

## Available Scripts

### Task Execution

#### `run-tasks.sh`
**Purpose**: Generic task runner that delegates to Claude or Codex CLI

**Usage**:
```bash
bash scripts/run-tasks.sh
```

**How it works**:
1. Checks for `claude` CLI (priority 1)
2. Falls back to `codex` CLI (priority 2)
3. Delegates to appropriate runner script
4. Executes tasks from `todo/` directory

**Prerequisites**:
- Claude CLI: https://claude.ai/download
- OR Codex CLI (alternative)

---

#### `run-tasks-claude.sh`
**Purpose**: Execute tasks using Claude CLI

**Usage**:
```bash
bash scripts/run-tasks-claude.sh
```

**Features**:
- Reads task files from `todo/` directory
- Executes tasks sequentially
- Saves output to `results/` directory
- Error handling and logging

---

#### `run-tasks-codex.sh`
**Purpose**: Execute tasks using Codex CLI (alternative to Claude)

**Usage**:
```bash
bash scripts/run-tasks-codex.sh
```

---

### Testing & Validation

#### `test.sh`
**Purpose**: Run comprehensive test suite (typecheck + lint + unit tests)

**Usage**:
```bash
# Run all tests (typecheck + lint + unit)
bash scripts/test.sh

# With coverage reporting
bash scripts/test.sh --coverage

# Include E2E tests (future)
bash scripts/test.sh --e2e

# Generate test report
bash scripts/test.sh --report [path]
```

**What it runs**:
1. **TypeScript type check** (`npm run typecheck`)
2. **ESLint** (`npm run lint`)
3. **Unit tests** (`npm test` or `npm run test:coverage`)
4. **E2E tests** (optional, `npm run test:e2e` - future)

**Exit codes**:
- `0`: All tests passed
- `1`: One or more tests failed

**Report output**:
- Default: `test-results/test-report.md`
- Custom: `bash scripts/test.sh --report custom-path.md`

---

#### `check-dev.sh`
**Purpose**: Run all development checks with detailed logging

**Usage**:
```bash
bash scripts/check-dev.sh
```

**What it checks**:
1. **TypeScript** (`npm run typecheck`)
2. **ESLint** (`npm run lint`)
3. **Build** (`npm run build`)

**Output**:
- Logs saved to `results/check-dev/`
- Individual logs: `type-check.log`, `lint.log`, `build.log`
- Summary: `results/check-dev/summary.log`

**When to use**:
- Before committing code
- Before creating PRs
- After major refactoring
- CI/CD validation

---

## Workflow Examples

### Before Committing Code

```bash
# Quick validation
npm run typecheck && npm run lint

# Full validation with build
bash scripts/check-dev.sh
```

### Before Creating PR

```bash
# Run all tests with coverage
bash scripts/test.sh --coverage

# Check reports
cat results/check-dev/summary.log
cat test-results/test-report.md
```

### Task-Based Development

```bash
# 1. Create task files in todo/
# task-001-add-feature.md
# task-002-write-tests.md

# 2. Run tasks
bash scripts/run-tasks.sh

# 3. Review results
ls results/
```

---

## Directory Structure

```
scripts/
├── README.md                # This file
├── run-tasks.sh             # Generic task runner
├── run-tasks-claude.sh      # Claude CLI task executor
├── run-tasks-codex.sh       # Codex CLI task executor
├── test.sh                  # Test suite runner
├── check-dev.sh             # Development checks
└── results/                 # Output logs (gitignored)
    ├── check-dev/
    │   ├── type-check.log
    │   ├── lint.log
    │   ├── build.log
    │   └── summary.log
    └── task-*.log           # Task execution logs
```

---

## Task Runner Workflow

### Task Planning Mode

**When**: Creating implementation plan for complex features

**Process**:
1. Agent reads `DWF/AGENTS.md` for context
2. Agent explores codebase (Glob, Grep, Read)
3. Agent creates task files in `todo/`:
   ```
   todo/task-001-add-answer-matching.md
   todo/task-002-write-tests.md
   todo/task-003-update-docs.md
   ```
4. Each task file follows `todo/TEMPLATE.md` structure:
   - **Goal**: What to accomplish
   - **Context**: Why this task exists
   - **Steps**: Detailed implementation steps
   - **Files**: Which files to modify
   - **Acceptance Criteria**: How to verify success

### Task Execution Mode

**When**: Implementing tasks created in planning mode

**Process**:
1. User runs: `bash scripts/run-tasks.sh`
2. Script detects `claude` or `codex` CLI
3. For each task file in `todo/`:
   - Read task instructions
   - Execute file changes
   - Run validation (typecheck, tests)
   - Log output to `results/`
4. Agent marks task complete or reports errors

### Task Review Mode

**When**: After task execution completes

**Process**:
1. User reviews `results/` logs
2. Run validation: `bash scripts/test.sh --coverage`
3. Check for:
   - Type errors
   - Lint errors
   - Test failures
   - Missing tests
4. Iterate on failed tasks

---

## NPM Script Integration

The scripts in this directory complement `package.json` scripts:

**Direct NPM scripts** (run individually):
```bash
npm run typecheck        # TypeScript validation
npm run lint             # ESLint
npm run build            # Production build
npm test                 # Vitest unit tests
npm run test:coverage    # With coverage report
```

**Automation scripts** (run workflows):
```bash
bash scripts/test.sh              # All tests in sequence
bash scripts/check-dev.sh         # All checks with logging
bash scripts/run-tasks.sh         # Task-based development
```

---

## Future Enhancements

### Planned Scripts

1. **`setup.sh`**: First-time project setup
   - Install dependencies
   - Set up environment variables
   - Initialize database (Supabase migrations)
   - Verify API keys

2. **`deploy.sh`**: Deployment automation
   - Pre-deployment checks (typecheck + build)
   - Database migrations
   - Deploy to Vercel
   - Post-deployment smoke tests

3. **`e2e.sh`**: E2E testing (Playwright)
   - Start dev server
   - Run Playwright tests
   - Generate test reports
   - Capture screenshots/videos

4. **`load-test.sh`**: Performance testing (k6)
   - Run load tests against API routes
   - Measure question generation time
   - Check database query performance
   - Generate performance report

---

## Troubleshooting

### "Neither claude nor codex CLI found"

**Solution**:
```bash
# Install Claude CLI
# Visit: https://claude.ai/download

# Or install Codex CLI
# (Follow Codex installation instructions)

# Verify installation
which claude
# or
which codex
```

### "npm run typecheck failed"

**Solution**:
```bash
# Run typecheck to see errors
npm run typecheck

# Fix type errors in your code
# Re-run validation
bash scripts/check-dev.sh
```

### "Permission denied" when running scripts

**Solution**:
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Re-run script
bash scripts/test.sh
```

### Task execution hangs

**Solution**:
```bash
# Check if task file exists
ls todo/

# Check task file format (should follow TEMPLATE.md)
cat todo/task-001-*.md

# Run task manually with verbose logging
bash -x scripts/run-tasks.sh
```

---

## Best Practices

### When to Use Each Script

| Scenario | Recommended Script |
|----------|-------------------|
| Quick validation before commit | `npm run typecheck && npm run lint` |
| Full pre-commit check | `bash scripts/check-dev.sh` |
| Running tests | `bash scripts/test.sh` |
| Running tests with coverage | `bash scripts/test.sh --coverage` |
| Creating feature plan | Manually create `todo/` files |
| Implementing feature | `bash scripts/run-tasks.sh` |
| Before PR | `bash scripts/test.sh --coverage && bash scripts/check-dev.sh` |

### Directory Hygiene

```bash
# Clean up results (safe, gitignored)
rm -rf results/

# Clean up todo (CAREFUL - not in git)
# Only do this after tasks are complete
rm -rf todo/

# Regenerate test report
bash scripts/test.sh --report
```

---

## Contributing

When adding new scripts:

1. **Follow naming convention**: `kebab-case.sh`
2. **Add shebang**: `#!/bin/bash`
3. **Set exit on error**: `set -euo pipefail`
4. **Make executable**: `chmod +x scripts/new-script.sh`
5. **Document in README**: Add to this file
6. **Test thoroughly**: Run in clean environment
7. **Handle errors gracefully**: Provide clear error messages

---

**See Also**:
- `DWF/AGENTS.md` - Agent workflow guidance
- `DWF/technical/TESTING_STRATEGY.md` - Testing approach
- `todo/TEMPLATE.md` - Task file template (if exists)
