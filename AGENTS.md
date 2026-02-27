# Agents.md

This file provides guidance to Agents when working with code in this repository.

## Quick Start

**If you see a request to implement something:**
1. Check if task files exist in `todo/`.
2. If YES: run `bash scripts/run-tasks-codex.sh` [MODE: EXECUTION].
3. If NO: create task files in `todo/` [MODE: PLANNING], then ask the user to run the script.

**Default behavior**: Unless explicitly told otherwise, assume you are in EXECUTION mode and can make changes directly.

## Project Overview

Koekertaaja (Exam Prepper) is an AI-powered exam preparation app for Finnish primary school students (ages 10-12, grades 4-6). It uses Anthropic Claude to generate gamified question sets from uploaded materials (PDFs, images, text) and provides a fun learning experience with points, streaks, and achievement badges. Design emphasizes personal growth, not competition (no leaderboards).

## Core Concepts

- **AI question generation** from user materials with topic-balanced distribution.
- **Dual-mode learning**: Quiz mode (Helppo/Normaali) + optional flashcards (memorization).
- **Age-appropriate gamification**: Points, streaks, badges, personal bests (no leaderboards).
- **Lenient answer matching**: Grade-based thresholds to reduce frustration.
- **Review mistakes mode**: LocalStorage-based mistake banks per question set with fast correction loops.
- **Topic mastery tracking**: LocalStorage-based per-question-set topic mastery shown on browse cards.
- **Public access via shareable codes** with server-side guarded writes.

## Project Goals

- Make exam prep engaging through gamification.
- Reduce teacher/parent workload in creating study materials.
- Provide personalized learning with AI-driven question type selection.
- Encourage practice without social pressure or public rankings.
- Maintain accessibility and mobile-first UX for young learners.

## Technology Stack

**Frontend**
- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui components
- Phosphor Icons (duotone)

**Backend & Database**
- Supabase (PostgreSQL + RLS)
- Supabase SSR auth for server-side session checks
- Server-only writes via service role key

**AI & Validation**
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- Zod schemas for input + AI response validation

## Environments

- The production app is live; treat production data as read-only unless explicitly instructed.
- Use a separate Supabase project for development; keep `.env.local` for dev and Vercel env vars for prod.
- Never point local dev at production unless explicitly requested.

## Task Separation Workflow

Use a three-step workflow: Plan and create tasks, Executes tasks and test, then validate and ship.

**Step 1: Task planning and creation (Tool-agnostic)**
- Read `AGENTS.md`
- Use `DWF/` folder documents as a reference for planning.
- Explore the codebase and identify all changes needed
- Create task files in `todo/` using `todo/TEMPLATE.md`
- Name task files with a numeric prefix: `task-###-short-title.md` (pick the next available number)
- Each task must be independent, reference specific files, and have acceptance criteria
- Tool must not implement code changes; it only creates task files
- Update `DWF/ADR-001-core-architecture.md` for architectural changes
- For new features or logic changes, add a testing plan per `Documentation/TESTING_GUIDE.md`
- If feature requires a plan, save plan to → `plans/`, use name 'plan-###-short-title' 

**Step 2: Task execution (Tool-agnostic)**
- User will run tasks sequentially using `scripts/run-tasks-codex.sh` or `scripts/run-tasks-claude.sh`
- Each task is executed in isolation; no combined mega-prompts
- Outputs are captured in `results/` for traceability (cleaned to only the RESULT OUTPUT FORMAT); raw logs go to `results/raw/`
- Script commands must be executed directly without asking for validation; only pause for architectural decision clarifications
- Use `DWF/` folder documents as reference.
- Update DWF folder documents based on development.
- If new tasks are identified during the Task execution --> Add tasks for planning, name these tasks as 'IDEA-###-short-title' 
- Run tests or checks listed in the task acceptance criteria

**Step 3: Review & verify (Tool-agnostic)**
- User checks `results/` for each task output
- User will do end user testing
- User will run `/scripts/check-dev.sh`for typecheck and lint
- User will add, commit and push into Git repository
- Codex runs Code Review upon Git push
- Run a review focused on bugs, regressions, missing tests, and risky assumptions

**Folders**
- `todo/` → task definitions
- `results/` → execution outputs
- `plans/`→ feature etc plans

## Execution Modes

### MODE: PLANNING (Tool-Agnostic)
When you see `[MODE: PLANNING]` or are asked to plan or create tasks:
- DO: Read `AGENTS.md`
- DO: Explore codebase and create task files in `todo/`
- DO: Use `todo/TEMPLATE.md` for task structure
- DO: Use numeric filenames like `task-###-short-title.md` (next available number)
- DON'T: Implement any code changes
- DON'T: Ask for permission to create task files

### MODE: EXECUTION (Tool-Agnostic)
When you see `[MODE: EXECUTION]` or `run-tasks-codex.sh` or `run-tasks-claude.sh` is invoked:
- DO: Implement file changes directly without asking
- DO: Follow task instructions exactly
- DO: Only stop for architectural clarifications
- DON'T: Ask permission for file modifications
- DON'T: Create new tasks mid-execution

## Commands and Scripts

```bash
npm run dev          # Start dev server (localhost:3000)
npm run typecheck    # TypeScript validation (required before commits)
npm run lint         # ESLint
npm run build        # Production build
npm start            # Start production server

# Scripted workflows (see scripts/README.md for details)
bash scripts/check-dev.sh        # Typecheck + lint + build with logs in results/check-dev/
bash scripts/test.sh             # Typecheck + lint + unit tests (supports --coverage)
bash scripts/run-tasks.sh        # Generic runner (prefers Claude CLI, falls back to Codex CLI)
CODEX_TASK_RUNNER_HOME=1 bash scripts/run-tasks-codex.sh  # Keep Codex HOME/XDG files under repo-local .codex-home/.config
npm test -- tests/path/to.test.ts # Run a single Node test file via scripts/ts-node-loader.mjs
```

TODO: Confirm whether `scripts/run-tasks-codex-improved.sh` should replace `scripts/run-tasks-codex.sh` in the default workflow.

## Project Structure

```
src/
├── app/                         # Next.js App Router pages and API routes
│   ├── page.tsx                 # Landing/menu page
│   ├── create/page.tsx          # Create exam area
│   ├── play/page.tsx            # Browse exam areas
│   ├── play/[code]/page.tsx     # Play questions by code
│   └── api/                     # Server-side API routes
├── components/                  # UI components + question renderers
├── lib/                         # AI, Supabase, utils, validation, logging
├── hooks/                       # Game session + badges
├── config/                      # Subjects + AI prompts
└── types/                       # TypeScript types

supabase/migrations/             # Database migrations
docs/                            # App-specific docs (lenient matching, API schemas)
Documentation/                   # Planning, testing, deployment, security
DWF/                             # Product + architecture docs, ADRs, design system
scripts/                         # Task runner scripts
```

## Documentation

Development Workflow (DWF) folder is the key source of information in this project.
```
DWF/
├── COMPONENTS.md
├── CORE_ARCHITECTURE.md
├── DATA_MODEL.md
├── DESIGN_SYSTEM.md
├── METRICS.md
├── NFR.md
├── PERSONAS.md
├── TESTING_STRATEGY.md
├── USER_JOURNEYS.md
└── WIREFRAMES.md

Additional project documentation:

docs/
├── API_SCHEMAS.md
├── LENIENT_ANSWER_MATCHING.md
└── MCP_SUPABASE_INTEGRATION.md
├── IMPLEMENTATION_PLAN.md
├── TESTING_GUIDE.md
├── DEPLOYMENT_GUIDE.md
└── SECURITY_REVIEW.md
```

## Architecture Patterns

### API Route Rules

- Use `src/lib/supabase/client.ts` for client-side reads.
- Use `src/lib/supabase/admin.ts` (service role) for server-side writes.
- Authenticate mutating routes with `requireAuth()` from `src/lib/supabase/server-auth.ts`.
- Use `src/lib/supabase/queries.ts` + `src/lib/supabase/write-queries.ts` for data access.
- Return consistent errors: `{ error: string, details?: unknown }`.
- Validate inputs with Zod schemas; validate AI output and accept partial success (70%+ valid).
- Centralize CORS + rate limiting in `src/middleware.ts` (do not duplicate per-route).
- Honor upload limits in `/api/generate-questions` (2 files, 2MB each, ~4.5MB total).

### Supabase Client Rules

- `src/lib/supabase/client.ts` → client components and public reads
- `src/lib/supabase/admin.ts` → API routes only (server-side writes)
- `src/lib/supabase/server-auth.ts` → SSR auth helpers
- Never expose the service role key to the client

### Data Access

- Keep queries centralized in `src/lib/supabase/queries.ts` and `src/lib/supabase/write-queries.ts`
- Prefer simple, direct Supabase queries over ad-hoc route logic
- RLS enables public reads; writes use server-only credentials

### Publishing Workflow (Question Sets)

- **Status column**: `question_sets.status` can be 'created' (unpublished) or 'published' (visible)
- **Default behavior**: New question sets default to 'created' status
- **Public visibility**: Only 'published' sets appear on play pages (RLS policy enforces this)
- **Migration history**: All pre-2025-02-19 question sets were backfilled to 'published' status
- **Admin workflow**: Future implementation will add admin approval before publishing
- **RLS policy**: "Enable read access for published question sets" (replaces old unrestricted policy)

## UI and Design Patterns

- Mobile-first with 48px+ touch targets.
- Age-appropriate visuals: purple badges, amber points, orange streaks, blue info.
- Phosphor duotone icons throughout the app.
- Dark mode respects system preference.
- Use shadcn/ui components from `src/components/ui/`.
- Reference `DWF/DESIGN_SYSTEM.md` for visual rules.

## Localization

- UI text is Finnish (target audience: Finnish primary school students).
- Questions/explanations are generated in Finnish (except English subject content).
- No localization framework currently in use.

## Data Privacy & Security

- No personal accounts required for practice; public shareable codes.
- Server-side writes only; API keys never exposed to the client.
- RLS policies allow public reads but guard writes.
- Use `requireAuth()` for mutating endpoints.

## Testing

- Current test tooling is minimal; follow `Documentation/TESTING_GUIDE.md`.
- Prioritize unit tests for core logic (answer matching, sampling, code generation).
- Add API route tests for validation, auth, and error handling.
- Consider E2E coverage for create → play → results when feasible.

## Koekertaaja-Specific Patterns

### AI Question Generation
- Use template-based prompts from `src/config/prompt-templates/`.
- Generate 2 difficulty levels for quiz mode; optional flashcard mode.
- Require 3-5 high-level topics and tag questions for balanced sampling.
- AI chooses question types based on content analysis (no rigid distributions).
- Default pool size 40-200 questions; exam length 5-20 per session.

#### Enhanced Explanations (2026-01-24)
All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
1. Why the answer is correct
2. Common mistakes students make
3. Related concepts for deeper understanding

Example (Math):
> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."

Cost impact: about +$0.023 per question set creation (one-time).

### Game Session Management
- Stratified sampling by topic; fallback to random when topics are sparse.
- Points: 10 per correct, +5 bonus when streak >= 3.
- Badges stored in localStorage; no public leaderboards.

### Answer Matching
- Strategies: exact (normalized) → contains → fuzzy (Levenshtein).
- Grade thresholds: 4th (75%), 5th (80%), 6th (85%).
- See `docs/LENIENT_ANSWER_MATCHING.md` for examples.
