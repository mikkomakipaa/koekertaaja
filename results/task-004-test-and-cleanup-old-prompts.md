Updated the prompt system docs and cleanup while making linting work with the current Next CLI, plus removed unused lint-disable comments. Old prompt files are deleted and prompt-templates now include a README for the new template workflow.

Details:
- Added a top-of-file doc block describing the template-based prompt system in `src/lib/ai/questionGenerator.ts`.
- Removed the deprecated prompt files and the empty directory; added template documentation in `src/config/prompt-templates/README.md`.
- Reworked lint to use a minimal flat ESLint config so `npm run lint` succeeds under Next 16, and removed now-unused `eslint-disable` comments in `src/app/play/[code]/page.tsx` and `src/components/play/ResultsScreen.tsx`.

Tests:
- `npm run typecheck`
- `npm run lint`
- `npm run dev` failed: `listen EPERM: operation not permitted` on port 3000 (and 3001) in this environment.

Notes:
- Manual `/create` flow tests and template substitution/log checks weren’t possible here (no browser + server bind blocked).

Suggested next steps:
1) Run the 6 manual `/create` test cases locally and verify topic balancing + no `{{variable}}` placeholders.
2) Check server logs for template loading messages during those runs.
