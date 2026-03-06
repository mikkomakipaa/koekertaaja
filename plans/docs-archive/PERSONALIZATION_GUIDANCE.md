# Personalization Guidance

Updated: 2026-02-27

This file captures recurring collaboration misunderstandings and the minimal guardrails added to prevent repeats.

## Recurring Misunderstandings

1. Agent guidance file missing in this checkout
- Outcome: agents searched for `AGENTS.md`/`CLAUDE.md` and fell back to stale assumptions.
- Guardrail: keep root `AGENTS.md` present and treat it as active guidance.

2. Legacy workflow paths referenced as if active
- Outcome: instructions referenced `DWF/`, `Documentation/`, `todo/`, and `results/` even when absent, causing dead-end setup steps.
- Guardrail: verify folder existence before following path-based workflow instructions; do not assume legacy folders.

3. AI provider ambiguity (Claude-only vs dual-provider reality)
- Outcome: docs and prompts mixed old Claude-only language with newer provider-selection behavior.
- Guardrail: treat `src/lib/ai/modelSelector.ts` and tests as source of truth for provider/model behavior.

## Agent Behavior Preferences

- Prefer minimal, direct edits over broad documentation rewrites.
- If a key guidance file is missing, create it in-repo instead of relying on external copies.
- When instructions conflict, cite the exact file used as source of truth in the run summary.

## Open Questions

1. Should we keep a compatibility `CLAUDE.md` symlink (to `AGENTS.md`) for older references in docs?
