# Task 004: Test integration and cleanup old prompt files (Phase 1)

## Context

- Why this is needed:
  - **Phase 1 Foundation**: Verify the new template-based system works correctly end-to-end
  - Continue using **Claude API** (validate no regressions)
  - Remove deprecated prompt functions to avoid confusion
  - Complete the prompt separation migration before Phase 2

- Related docs/links:
  - `/Prompt-separation-plan.md` (overall architecture plan)
  - `/DWF/technical/TESTING_STRATEGY.md` (testing approach)
  - Task 001 (PromptLoader)
  - Task 002 (PromptBuilder)
  - Task 003 (questionGenerator refactor)

- Related files:
  - `/src/lib/ai/questionGenerator.ts` (refactored in Task 003)
  - `/src/config/prompts/*.ts` (old prompts to be removed)
  - `/app/api/generate-questions/route.ts` (API route to test)
  - `/src/lib/prompts/PromptLoader.ts` (created in Task 001)
  - `/src/lib/prompts/PromptBuilder.ts` (created in Task 002)

## Scope

- In scope:
  - Test all 6 prompt combinations manually (3 subjects × 2 modes)
  - Verify generated questions match quality expectations
  - Verify topic balancing still works
  - Check that all template variables are correctly substituted
  - Run TypeScript type checking
  - Run linting
  - Remove old prompt files: `/src/config/prompts/*.ts`
  - Remove `/src/config/prompts/` directory if empty
  - Update any imports that reference old prompt files (should be none after Task 003)
  - Document the new prompt system for future developers

- Out of scope:
  - Writing unit tests (optional enhancement for future)
  - Anthropic Console integration (Phase 2)
  - Performance optimization
  - Changing AI behavior or question quality

## Changes

- [ ] Manual Testing:
  - Test English quiz (helppo) with grade 5
  - Test English quiz (normaali) with grade 6
  - Test Math quiz (helppo) with grade 4
  - Test Math flashcards with grade 5
  - Test Generic quiz (normaali) with history subject, grade 6
  - Test Generic flashcards with biology subject, grade 5
  - Verify all questions have proper topic field
  - Verify distributions match expected percentages
  - Check logs for successful template loading messages

- [ ] Code Quality Checks:
  - Run `npm run typecheck` and fix any errors
  - Run `npm run lint` and fix any warnings
  - Review questionGenerator.ts for unused imports
  - Review PromptLoader.ts for edge cases

- [ ] Cleanup:
  - Delete `/src/config/prompts/english.ts`
  - Delete `/src/config/prompts/math.ts`
  - Delete `/src/config/prompts/generic.ts`
  - Delete `/src/config/prompts/english-flashcards.ts`
  - Delete `/src/config/prompts/math-flashcards.ts`
  - Delete `/src/config/prompts/generic-flashcards.ts`
  - Remove `/src/config/prompts/` directory if empty
  - Search codebase for any remaining references to old prompt functions
  - Remove any unused imports from questionGenerator.ts

- [ ] Documentation:
  - Add comment block at top of questionGenerator.ts explaining new system
  - Update inline comments to reference template files instead of prompt functions
  - Optionally add README.md in `/src/config/prompt-templates/` explaining structure

## Acceptance Criteria

- [ ] All 6 test cases generate valid questions successfully
- [ ] Questions match expected quality and format from before refactoring
- [ ] Topic field is present in all generated questions
- [ ] Topic balancing works (roughly equal questions per topic)
- [ ] No TypeScript errors (`npm run typecheck` passes)
- [ ] No ESLint errors (`npm run lint` passes)
- [ ] All 6 old prompt files are deleted
- [ ] `/src/config/prompts/` directory is removed
- [ ] No references to old prompt functions remain in codebase
- [ ] Logs show successful template loading and variable substitution
- [ ] Generated prompts are complete (no missing `{{variables}}`)
- [ ] Development server starts without errors (`npm run dev`)

## Testing

- [ ] Tests to run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run dev` (verify server starts)
  - Manual API test via `/create` page for each subject/mode combination
  - Check browser console for errors
  - Check server logs for template loading messages
  - Grep codebase for old prompt imports: `rg "from '@/config/prompts"` (should be empty)

- [ ] New/updated tests:
  - Future: Unit tests for PromptLoader.substituteVariables()
  - Future: Unit tests for PromptBuilder.buildVariables()
  - Future: Integration test for questionGenerator with mock templates

## Implementation Notes

**Manual Testing Process:**

1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000/create
3. For each test case:
   - Select subject (English/Math/Other)
   - Select grade (4/5/6)
   - Upload sample material (PDF or text)
   - Generate questions
   - Verify success and check generated questions
   - Open browser DevTools → Network tab → Check API response
   - Open terminal → Check server logs for template loading
   - Verify questions have topic field
   - Count questions per topic (should be balanced)

**Test Cases:**
```
1. English, Grade 5, Helppo, Quiz mode
   - Expected: 50% multiple_choice, topic field present

2. English, Grade 6, Normaali, Quiz mode
   - Expected: 25% multiple_choice, 40% fill_blank, topic field present

3. Math, Grade 4, Helppo, Quiz mode
   - Expected: 60% multiple_choice, topic field present

4. Math, Grade 5, Flashcard mode
   - Expected: 70% fill_blank, 20% matching, topic field present

5. History (Generic), Grade 6, Normaali, Quiz mode
   - Expected: Generic prompt, topic field present

6. Biology (Generic), Grade 5, Flashcard mode
   - Expected: Generic flashcard prompt, topic field present
```

**Verification Checklist for Each Test:**
- [ ] API call succeeds (200 status)
- [ ] Correct number of questions generated
- [ ] All questions have `topic` field
- [ ] Topic distribution is balanced (±1-2 questions per topic)
- [ ] Question types match expected distribution
- [ ] No `{{variable}}` placeholders in questions (all substituted)
- [ ] Explanations are present and clear
- [ ] Logs show: "Loading template: quiz/english-quiz.txt" (or similar)

**Cleanup Verification:**
```bash
# Should return no results after cleanup
rg "getEnglishPrompt" src/
rg "getMathPrompt" src/
rg "getGenericPrompt" src/
rg "from '@/config/prompts'" src/

# Should show prompts directory doesn't exist
ls -la src/config/prompts/
# Expected: "No such file or directory"
```

**Documentation to Add:**

At top of `questionGenerator.ts`:
```typescript
/**
 * Question Generator using Template-Based Prompt System
 *
 * This module generates AI questions using a template-based prompt architecture.
 * Prompts are stored as .txt files in /src/config/prompt-templates/ with {{variable}}
 * placeholders that are substituted at runtime.
 *
 * Components:
 * - PromptLoader: Loads template files and substitutes variables
 * - PromptBuilder: Builds variable data from generation parameters
 *
 * Template structure:
 * - quiz/english-quiz.txt, quiz/math-quiz.txt, quiz/generic-quiz.txt
 * - flashcard/english-flashcard.txt, flashcard/math-flashcard.txt, flashcard/generic-flashcard.txt
 *
 * Metadata:
 * - /src/config/prompt-templates/metadata/*.json (distributions, grade content, difficulty)
 *
 * For template editing, see /Prompt-separation-plan.md
 */
```

Optional README in `/src/config/prompt-templates/`:
```markdown
# Prompt Templates

This directory contains AI prompt templates for question generation.

## Structure
- `quiz/` - Quiz mode templates (2 difficulty levels: helppo, normaali)
- `flashcard/` - Flashcard mode templates (memorization-optimized)
- `metadata/` - JSON files with distributions, grade content, difficulty instructions

## Editing Templates
1. Edit .txt files directly
2. Use {{variable}} syntax for placeholders
3. Test changes by running app locally
4. See /Prompt-separation-plan.md for full documentation

## Variable Substitution
Variables are provided by PromptBuilder class and substituted by PromptLoader.
```

**Common Issues to Check:**
- Missing variables in template causing `{{variable}}` to appear in output
- File path errors (check casing, extensions)
- Metadata JSON parsing errors
- Distribution percentages not adding to 100%
- Topic list formatting issues
- Material section missing file references
