# Prompt Improvement Roadmap

**Date**: 2025-01-18
**Status**: Ready for Execution
**Provider**: Claude API (Anthropic) - No migration to OpenAI

---

## Overview

This roadmap implements the prompt management improvements outlined in `/Documentation/PROMPT-MANAGEMENT-ANALYSIS.md`. All improvements continue using **Claude API** with the Anthropic SDK.

**Goals**:
1. Separate prompt content from code (easier editing)
2. Eliminate duplication across prompt files (DRY)
3. Improve question quality via subject-type routing
4. Enable skill-specific practice modes
5. Reduce token costs

**Timeline**: 4 phases over 2-3 months

---

## Phase 1: Foundation (Tasks 001-004)

**Duration**: Part of current sprint
**Effort**: 8-10 hours
**Impact**: ⭐⭐⭐ Foundation for all future improvements
**Status**: Ready to execute

### Tasks

#### Task 001: Create PromptLoader class
- **File**: `/todo/task-001-create-prompt-loader.md`
- **Purpose**: Load .txt template files and substitute {{variables}}
- **Deliverables**:
  - `/src/lib/prompts/PromptLoader.ts`
  - `loadTemplate()` method
  - `substituteVariables()` method
  - `buildPrompt()` method
- **Acceptance**: All 6 templates load successfully

#### Task 002: Create PromptBuilder class
- **File**: `/todo/task-002-create-prompt-builder.md`
- **Purpose**: Build variable data from generation parameters
- **Deliverables**:
  - `/src/lib/prompts/PromptBuilder.ts`
  - `buildVariables()` method
  - Load metadata JSON files
  - Format distributions, topics, grade content
- **Acceptance**: Complete variable objects for all templates

#### Task 003: Refactor questionGenerator.ts
- **File**: `/todo/task-003-refactor-question-generator.md`
- **Purpose**: Replace old prompt functions with PromptLoader + PromptBuilder
- **Deliverables**:
  - Refactored `/src/lib/ai/questionGenerator.ts`
  - Remove imports from `/src/config/prompts/*.ts`
  - Use template-based system
- **Acceptance**: Question generation works, no quality regression

#### Task 004: Test and cleanup
- **File**: `/todo/task-004-test-and-cleanup-old-prompts.md`
- **Purpose**: Verify integration and remove old files
- **Deliverables**:
  - Manual testing all 6 combinations (3 subjects × 2 modes)
  - Delete `/src/config/prompts/*.ts` files
  - Documentation updates
- **Acceptance**: All subjects work, old files deleted

### Benefits After Phase 1

✅ Prompt content separated from code
✅ Non-developers can edit .txt files
✅ Foundation for modular architecture
✅ Same question quality, cleaner codebase

---

## Phase 2: Subject-Type Routing (Task 005)

**Duration**: Immediately after Phase 1
**Effort**: 2-4 hours
**Impact**: ⭐⭐⭐⭐⭐ High - Better questions for all subjects
**Status**: Ready to execute after Phase 1

### Task 005: Subject-Type Routing

- **File**: `/todo/task-005-subject-type-routing.md`
- **Purpose**: Split generic.ts into subject-type-specific templates
- **Current Problem**:
  - `generic.ts` handles history, biology, art, music, PE, religion with same prompt
  - Different subjects need different question patterns
- **Solution**:
  - Create 3 new template types: `written`, `skills`, `concepts`
  - Map subjects to types (e.g., history→written, art→skills, religion→concepts)
  - Update PromptBuilder routing logic

### Deliverables

**Subject Type Mapping**:
- `/src/lib/prompts/subjectTypeMapping.ts`
- Maps 11+ subjects to 5 types: `language`, `math`, `written`, `skills`, `concepts`

**New Templates** (6 files):
- `/src/config/prompt-templates/quiz/written-quiz.txt` (history, biology, geography)
- `/src/config/prompt-templates/quiz/skills-quiz.txt` (art, music, PE)
- `/src/config/prompt-templates/quiz/concepts-quiz.txt` (religion, ethics)
- `/src/config/prompt-templates/flashcard/written-flashcard.txt`
- `/src/config/prompt-templates/flashcard/skills-flashcard.txt`
- `/src/config/prompt-templates/flashcard/concepts-flashcard.txt`

**Metadata**:
- `/src/config/prompt-templates/metadata/written-distributions.json`
- `/src/config/prompt-templates/metadata/skills-distributions.json`
- `/src/config/prompt-templates/metadata/concepts-distributions.json`

**Cleanup**:
- Delete `generic-quiz.txt`
- Delete `generic-flashcard.txt`
- Delete `generic-distributions.json`

### Question Pattern Differentiation

**Written (History, Biology, Geography)**:
- Fact recall: "Mitä tapahtui kun..."
- Timelines: "Missä järjestyksessä..."
- Cause-effect: "Miksi X johti Y:hyn?"
- Compare-contrast: "Miten X eroaa Y:stä?"

**Skills (Art, Music, PE)**:
- Technique identification: "Mikä tekniikka sopii..."
- Equipment: "Mitä välineitä tarvitset..."
- Safety: "Miten käytät turvallisesti..."
- Cultural context: "Kuka maalasi..."

**Concepts (Religion, Ethics)**:
- Value identification: "Miksi rehellisyys on tärkeää?"
- Perspective comparison: "Miten eri kulttuurit..."
- Scenario analysis: "Mitä tekisit jos..."
- Personal reflection: "Mitä ajattelet kun..."

### Benefits After Phase 2

✅ Better question quality for all 11+ subjects
✅ Questions match subject cognitive patterns
✅ No regression in English/Math
✅ Quick win (2-4 hours), high impact

---

## Phase 3: Modular Prompt System (Task 006)

**Duration**: 1-2 weeks after Phase 2
**Effort**: 8-12 hours
**Impact**: ⭐⭐⭐⭐ Easier maintenance, token reduction
**Status**: Ready to execute after Phase 2

### Task 006: Modular Prompt System

- **File**: `/todo/task-006-modular-prompt-system.md`
- **Purpose**: Eliminate duplication via modular architecture
- **Current Problem**:
  - Format section repeated in 6+ files
  - Topic tagging rules repeated in 6+ files
  - Grade distributions repeated across multiple JSON files
- **Solution**:
  - Extract common blocks to `core/`
  - Create subject-type modules in `types/`
  - Move curriculum to `subjects/` JSON files
  - Consolidate distributions into single JSON
  - Assemble prompts from modules at runtime

### Architecture

```
src/config/prompt-templates/
├── core/                          # Shared across all prompts
│   ├── format.txt                 # JSON schema, output structure
│   ├── topic-tagging.txt          # Topic identification rules
│   ├── flashcard-rules.txt        # Flashcard-specific instructions
│   └── grade-distributions.json   # All distributions consolidated
├── types/                          # Subject-type-specific modules
│   ├── language.txt               # English, Finnish patterns
│   ├── math.txt                   # Math-specific patterns
│   ├── written.txt                # History, biology, geography patterns
│   ├── skills.txt                 # Art, music, PE patterns
│   └── concepts.txt               # Religion, ethics patterns
└── subjects/                       # Curriculum per subject
    ├── english.json               # Grades 4-6 curriculum
    ├── math.json
    ├── history.json
    ├── biology.json
    └── ... (11+ subjects)
```

### Deliverables

**Core Modules** (4 files):
- `core/format.txt` - JSON schema definition
- `core/topic-tagging.txt` - Topic identification rules
- `core/flashcard-rules.txt` - Active recall instructions
- `core/grade-distributions.json` - All distributions (single source of truth)

**Type Modules** (5 files):
- `types/language.txt`
- `types/math.txt`
- `types/written.txt`
- `types/skills.txt`
- `types/concepts.txt`

**Subject Curriculum** (11+ files):
- `subjects/english.json`
- `subjects/math.json`
- `subjects/history.json`
- `subjects/biology.json`
- ... (all subjects)

**Updated Logic**:
- `/src/lib/prompts/PromptLoader.ts` - Add `loadModule()` method
- `/src/lib/prompts/PromptBuilder.ts` - Add `assemblePrompt()` method
- Delete all old monolithic templates

### Prompt Assembly

```typescript
const prompt = assemblePrompt({
  // 1. Core modules (shared)
  format: load('core/format.txt'),
  topicRules: load('core/topic-tagging.txt'),

  // 2. Type-specific module
  typeRules: load(`types/${subjectType}.txt`),

  // 3. Subject curriculum
  curriculum: load(`subjects/${subject}.json`),

  // 4. Distributions from consolidated JSON
  distributions: load('core/grade-distributions.json'),

  // 5. Optional: flashcard rules
  flashcardRules: mode === 'flashcard' ? load('core/flashcard-rules.txt') : ''
});
```

### Token Reduction

**Before (monolithic)**:
- 6 templates × ~1600 tokens = ~9600 tokens total
- Duplication: format, topic rules, distributions repeated

**After (modular)**:
- core/ modules: ~1600 tokens (loaded once)
- types/ modules: 5 × ~300 tokens = ~1500 tokens
- subjects/ curriculum: 11 × ~500 tokens = ~5500 tokens
- **Total**: ~7600 tokens

**Savings**: ~2000 tokens (21% reduction)

### Benefits After Phase 3

✅ 20-30% token reduction (cost savings)
✅ DRY - common blocks defined once
✅ Easier editing - change `core/format.txt` affects all
✅ Cleaner architecture
✅ Foundation for future additions

---

## Phase 4: Skill-Level Tagging (Task 007)

**Duration**: 1-2 months after Phase 3
**Effort**: 12-16 hours
**Impact**: ⭐⭐⭐⭐ Enables skill-specific practice
**Status**: Ready to execute after Phase 3

### Task 007: Skill-Level Tagging

- **File**: `/todo/task-007-skill-level-tagging.md`
- **Purpose**: Enable skill-specific practice modes
- **Current Problem**:
  - No separation between grammar vs vocabulary
  - No separation between computation vs word problems
  - Can't enable "Grammar only" practice mode
- **Solution**:
  - Define skill taxonomies per subject type
  - Add `skill` column to database
  - Update prompts to require skill tagging
  - Update stratified sampling to balance by skill

### Skill Taxonomies

**Language Skills**:
```
grammar: [verb_tenses, sentence_structure, parts_of_speech, ...]
vocabulary: [word_meaning, synonyms_antonyms, context_clues, ...]
reading: [comprehension, inference, main_idea, ...]
writing: [sentence_formation, paragraph_structure, ...]
```

**Math Skills**:
```
computation: [addition, subtraction, multiplication, division, ...]
word_problems: [problem_solving, multi_step, estimation, ...]
geometry: [shapes, area, perimeter, volume, ...]
number_sense: [place_value, fractions, decimals, ...]
```

**Written Skills** (History, Biology, etc.):
```
recall: [facts, dates, names, definitions, ...]
comprehension: [cause_effect, compare_contrast, sequences, ...]
application: [examples, real_world_connections, ...]
analysis: [patterns, relationships, conclusions, ...]
```

**Skills Skills** (Art, Music, PE):
```
technique: [identification, execution, comparison, ...]
equipment: [recognition, usage, safety, ...]
culture: [historical_context, regional_styles, artists, ...]
practice: [warm_up, drills, performance, ...]
```

**Concepts Skills** (Religion, Ethics):
```
values: [identification, importance, application, ...]
perspectives: [comparison, understanding, empathy, ...]
scenarios: [analysis, decision_making, consequences, ...]
reflection: [personal_connection, critical_thinking, ...]
```

### Deliverables

**Database Migration**:
- `/supabase/migrations/20250131_add_skill_to_questions.sql`
- Add `skill TEXT` column to questions table
- Create index on skill column

**Skill Taxonomy Files** (5 files):
- `/src/config/prompt-templates/skills/language-skills.json`
- `/src/config/prompt-templates/skills/math-skills.json`
- `/src/config/prompt-templates/skills/written-skills.json`
- `/src/config/prompt-templates/skills/skills-skills.json`
- `/src/config/prompt-templates/skills/concepts-skills.json`

**Prompt Instructions**:
- `/src/config/prompt-templates/core/skill-tagging.txt`
- "Each question MUST have exactly ONE skill tag"
- "DO NOT mix skills in a single question"
- Examples of good/bad skill tagging

**Updated Logic**:
- `/src/lib/prompts/PromptBuilder.ts` - Include skill taxonomy in assembled prompts
- `/src/hooks/useGameSession.ts` - Stratified sampling by skill within topics
- `/src/types/questions.ts` - Add skill field to Question type
- `/src/lib/validation/schemas.ts` - Validate skill field

### Question Schema Update

```typescript
interface Question {
  // ... existing fields
  topic?: string;          // High-level (e.g., "Grammar")
  skill?: string;          // Specific skill (e.g., "verb_tenses")
}
```

### Stratified Sampling Enhancement

**Before** (Phase 1-3):
- Balance questions by topic only
- Example: 15 questions = 5 per topic (Grammar, Vocabulary, Reading)

**After** (Phase 4):
- Balance questions by topic AND skill
- Example: 15 questions = 5 per topic
  - Grammar: 2-3 verb_tenses, 2-3 sentence_structure
  - Vocabulary: 2-3 word_meaning, 2-3 synonyms
  - Reading: 2-3 comprehension, 2-3 inference

### Benefits After Phase 4

✅ Skill-specific practice modes enabled
✅ No mixed-skill questions (cleaner learning)
✅ Better analytics (track which skills need work)
✅ Foundation for adaptive difficulty
✅ Improved stratified sampling

---

## Phase 5: Two-Level Topics (Future)

**Duration**: TBD (data-driven decision)
**Effort**: 16-24 hours
**Impact**: ⭐⭐⭐⭐⭐ Flexible practice, best analytics
**Status**: Consider after Phase 4 completion

### Concept

Add full topic hierarchy:

```
topic: "Grammar"           (L1: High-level)
subtopic: "Verb Tenses"    (L2: Mid-level)
skill: "present_simple"    (L3: Specific)
```

### When to Implement

- After Phase 4 is complete and validated
- When analytics show need for finer-grained topic filtering
- When user requests "Practice only Present Simple tense"
- When topic distribution shows imbalance at high level

### Benefits

- Flexible sampling at all 3 levels
- Practice modes at any granularity
- Analytics track gaps at all levels
- Most comprehensive learning tracking

---

## Execution Plan

### Immediate (Current Sprint)

1. ✅ **Complete Tasks 001-004** (Phase 1 Foundation)
   - Create PromptLoader class
   - Create PromptBuilder class
   - Refactor questionGenerator.ts
   - Test and cleanup old prompts
   - **Expected**: 8-10 hours

2. ✅ **Complete Task 005** (Phase 2 Subject-Type Routing)
   - Quick win - split generic into written/skills/concepts
   - **Expected**: 2-4 hours
   - **Total Phase 1+2**: 10-14 hours

### Short-Term (1-2 Weeks)

3. ✅ **Complete Task 006** (Phase 3 Modular System)
   - Extract common blocks to core/
   - Create type modules
   - Consolidate distributions
   - **Expected**: 8-12 hours

### Medium-Term (1-2 Months)

4. ✅ **Complete Task 007** (Phase 4 Skill Tagging)
   - Define skill taxonomies
   - Add database column
   - Update prompts
   - Update stratified sampling
   - **Expected**: 12-16 hours

### Long-Term (Future)

5. ⏳ **Consider Phase 5** (Two-Level Topics)
   - Wait for analytics data
   - User feedback on current system
   - Only if clear need demonstrated

---

## Success Metrics

### Phase 1 Success Criteria

- [ ] All 6 prompt combinations work (3 subjects × 2 modes)
- [ ] Template variables substitute correctly
- [ ] No quality regression
- [ ] Old prompt files deleted
- [ ] Non-developers can edit .txt files

### Phase 2 Success Criteria

- [ ] 11+ subjects map to correct types
- [ ] History questions use written patterns
- [ ] Art questions use skills patterns
- [ ] Religion questions use concepts patterns
- [ ] No regression in English/Math quality

### Phase 3 Success Criteria

- [ ] 20-30% token reduction measured
- [ ] All modules load successfully
- [ ] Prompt assembly < 50ms
- [ ] No quality regression
- [ ] Easier to edit prompts (edit core/format.txt affects all)

### Phase 4 Success Criteria

- [ ] 90%+ questions have skill field populated
- [ ] Zero mixed-skill questions in manual review
- [ ] Skill distribution balanced in sessions
- [ ] No performance degradation
- [ ] Foundation for skill-specific practice modes

---

## Risk Mitigation

### Phase 1 Risks

**Risk**: Template loading failures
**Mitigation**: Comprehensive error handling, fallback to inline prompts if needed

**Risk**: Variable substitution errors
**Mitigation**: Unit tests for substituteVariables(), extensive manual testing

### Phase 2 Risks

**Risk**: Subject-type mapping incorrect
**Mitigation**: Clear mapping table, test all 11+ subjects

**Risk**: Question quality degradation
**Mitigation**: Manual review of 10+ questions per type before rollout

### Phase 3 Risks

**Risk**: Module assembly order wrong
**Mitigation**: Document assembly order clearly, test all combinations

**Risk**: Token reduction not achieved
**Mitigation**: Measure before/after, adjust if needed (not critical)

### Phase 4 Risks

**Risk**: Low skill tagging coverage (<90%)
**Mitigation**: Improve prompts iteratively, clear examples, strict validation

**Risk**: Database migration failure
**Mitigation**: Test in dev first, run during low-traffic time, have rollback plan

---

## Documentation Updates

After each phase:

- [ ] Update `/CLAUDE.md` with new architecture
- [ ] Update `/Documentation/QUESTION-GENERATION-FLOW.md`
- [ ] Create `/src/config/prompt-templates/README.md` with editing guide
- [ ] Update API documentation (if needed)
- [ ] Add inline comments to new classes

---

## Next Steps

**User Action Required**:

1. Review this roadmap
2. Approve execution of Phases 1-4
3. Confirm priorities (all phases or subset)
4. Decide on execution approach:
   - Option A: Execute all phases sequentially
   - Option B: Execute Phases 1-2 first, validate, then continue
   - Option C: Execute Phase 1 only, then reassess

**After Approval**:

Execute tasks using:
```bash
# Phase 1
bash scripts/run-tasks-claude.sh task-001
bash scripts/run-tasks-claude.sh task-002
bash scripts/run-tasks-claude.sh task-003
bash scripts/run-tasks-claude.sh task-004

# Phase 2
bash scripts/run-tasks-claude.sh task-005

# Phase 3
bash scripts/run-tasks-claude.sh task-006

# Phase 4
bash scripts/run-tasks-claude.sh task-007
```

Or implement manually following task checklists.

---

**Status**: ✅ Planning Complete - Awaiting User Approval
**Updated**: 2025-01-18
