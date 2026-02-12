# Consolidated Development Roadmap - Koekertaaja

**Last Updated**: 2026-02-09
**Status**: Comprehensive overview of completed, active, and planned work

---

## Overview

This document consolidates all development roadmaps, showing what's been completed, what's in progress, and what's planned for the future.

---

## ✅ COMPLETED INITIATIVES

### 1. MVP Implementation (Nov 2024)
**Status**: ✅ Complete
**Reference**: `docs/MVP_COMPLETE.md`, `docs/IMPLEMENTATION_PLAN.md`

**Delivered**:
- ✅ AI-powered question generation (Anthropic Claude Sonnet 4)
- ✅ Multiple question types (multiple choice, fill-blank, true/false, matching)
- ✅ Code-based sharing system (6-char codes)
- ✅ Quiz and Flashcard modes
- ✅ Session-based gameplay (no auth required)
- ✅ Supabase database with RLS policies
- ✅ Next.js 14 App Router architecture
- ✅ 40+ components, full TypeScript coverage
- ✅ Deployed to production (Vercel)

**Impact**: Foundation of the application - all core functionality working

---

### 2. Prompt Improvement Initiative (Jan 2025)
**Status**: ✅ All 4 Phases Complete
**Reference**: `docs/PROMPT-IMPROVEMENT-ROADMAP.md`

#### Phase 1: Foundation ✅
**Tasks 001-004** (Archived: `todo/archive/task-001` through `task-004`)

**Delivered**:
- ✅ `PromptLoader` class - Load .txt template files with variable substitution
- ✅ `PromptBuilder` class - Build variable data from generation parameters
- ✅ Refactored `questionGenerator.ts` to use template-based system
- ✅ Cleaned up old inline prompt code

**Files Created**:
- `/src/lib/prompts/PromptLoader.ts`
- `/src/lib/prompts/PromptBuilder.ts`

**Impact**: Prompt content separated from code, easier for non-developers to edit

---

#### Phase 2: Subject-Type Routing ✅
**Task 005** (Archived: `todo/archive/task-005-subject-type-routing.md`)

**Delivered**:
- ✅ Split generic prompts into subject-type-specific templates:
  - `language` - English, Finnish
  - `math` - Mathematics
  - `written` - History, Biology, Geography
  - `skills` - Art, Music, PE
  - `concepts` - Religion, Ethics
- ✅ Created `subjectTypeMapping.ts` for routing logic
- ✅ Dedicated templates for each subject type

**Files Created**:
- `/src/lib/prompts/subjectTypeMapping.ts`
- `/src/config/prompt-templates/types/language.txt`
- `/src/config/prompt-templates/types/math.txt`
- `/src/config/prompt-templates/types/written.txt`
- `/src/config/prompt-templates/types/skills.txt`
- `/src/config/prompt-templates/types/concepts.txt`

**Impact**: Better question quality - questions match subject-specific cognitive patterns

---

#### Phase 3: Modular Prompt System ✅
**Task 006** (Archived: `todo/archive/task-006-modular-prompt-system.md`)

**Delivered**:
- ✅ Extracted common blocks to `core/` modules:
  - `format.txt` - JSON schema definition
  - `topic-tagging.txt` - Topic identification rules
  - `flashcard-rules.txt` - Active recall instructions
  - `skill-tagging.txt` - Skill tagging instructions
  - `grade-distributions.json` - Consolidated distributions
- ✅ Created modular prompt assembly system
- ✅ Moved curriculum data to `subjects/*.json` files (11+ subjects)

**Files Created**:
- `/src/config/prompt-templates/core/format.txt`
- `/src/config/prompt-templates/core/topic-tagging.txt`
- `/src/config/prompt-templates/core/flashcard-rules.txt`
- `/src/config/prompt-templates/core/skill-tagging.txt`
- `/src/config/prompt-templates/core/grade-distributions.json`
- `/src/config/prompt-templates/subjects/english.json`
- `/src/config/prompt-templates/subjects/math.json`
- `/src/config/prompt-templates/subjects/finnish.json`
- ...and 8 more subject files

**Impact**:
- 20-30% token reduction (cost savings)
- DRY principle - common blocks defined once
- Easier prompt maintenance

---

#### Phase 4: Skill-Level Tagging ✅
**Task 007** (Archived: `todo/archive/task-007-skill-level-tagging.md`)

**Delivered**:
- ✅ Added `skill` column to questions table (migration completed)
- ✅ Defined skill taxonomies for all subject types:
  - Language skills (grammar, vocabulary, reading, writing)
  - Math skills (computation, word_problems, geometry, number_sense)
  - Written skills (recall, comprehension, application, analysis)
  - Skills skills (technique, equipment, culture, practice)
  - Concepts skills (values, perspectives, scenarios, reflection)
- ✅ Updated prompts to require skill tagging
- ✅ Enhanced stratified sampling to balance by skill within topics

**Files Created**:
- `/src/config/prompt-templates/skills/language-skills.json`
- `/src/config/prompt-templates/skills/math-skills.json`
- `/src/config/prompt-templates/skills/written-skills.json`
- `/src/config/prompt-templates/skills/skills-skills.json`
- `/src/config/prompt-templates/skills/concepts-skills.json`
- `/src/config/prompt-templates/skills/geography-skills.json`

**Migrations**:
- `20250131_add_skill_to_questions.sql` (implied - need to verify)

**Impact**:
- Foundation for skill-specific practice modes
- Better learning analytics
- No mixed-skill questions

---

### 3. Publishing Workflow (Jan 2025)
**Status**: ✅ Complete
**Tasks 024-029** (Archived)

**Delivered**:
- ✅ Two-state publishing workflow (`created` → `published`)
- ✅ Admin-only publish/unpublish API endpoint
- ✅ Email-based admin allowlist (`ADMIN_EMAILS` env var)
- ✅ RLS policies - only published sets visible on Play pages
- ✅ Status field in database with indexes
- ✅ Tests for API validation and authorization

**Migrations**:
- `20250219_add_status_to_question_sets.sql`
- `20250219_backfill_published_status.sql`

**Files Created**:
- `/src/app/api/question-sets/publish/route.ts`
- Tests in `/tests/admin-publish-api.test.ts`
- Tests in `/tests/question-set-status-filtering.test.ts`

**Impact**: Control over which question sets are publicly accessible

---

### 4. Enhanced Topic Identification (Jan 2025)
**Status**: ✅ Complete
**Task 065** (Archived: `todo/archive/task-065-enhanced-topic-identification.md`)

**Delivered**:
- ✅ Enhanced data structure for topic metadata
- ✅ Distribution logic improvements
- ✅ Coverage validation
- ✅ Difficulty mapping enhancements
- ✅ Separate `/api/identify-topics` endpoint

**Files Updated**:
- `/src/lib/ai/topicIdentifier.ts`
- `/src/app/api/identify-topics/route.ts`

**Impact**: More accurate topic assignment, better coverage validation

---

### 5. Reliable Question Generation Architecture (Jan 2025)
**Status**: ✅ Complete
**Task 064** (Archived: multiple subtasks)

**Delivered**:
- ✅ Server-side partial success handling
- ✅ Client UI for partial success scenarios
- ✅ Tests for partial success flows
- ✅ Split endpoints for better error handling

**Impact**: Robust question generation even when AI produces incomplete results

---

### 6. Question Flagging System (Jan 2025)
**Status**: ✅ Complete
**Tasks 066-068** (Archived)

**Delivered**:
- ✅ Question flags schema in database
- ✅ API endpoints for flagging questions
- ✅ UI components in player for flagging
- ✅ RLS policies for question flags

**Migrations**:
- `20260128_add_question_flags.sql`
- `20260131_add_question_flags_policies.sql`
- `20260131_fix_questions_rls_policy.sql`

**Impact**: Users can report problematic questions

---

### 7. Design System & UX Improvements (Jan-Feb 2025)
**Status**: ✅ Complete
**Tasks 052-059** (Archived)

**Delivered**:
- ✅ Review mistakes feature
- ✅ Topic mastery percentage display
- ✅ Enhanced AI explanations (Task 054)
- ✅ Design system refresh (Task 055)
- ✅ Common UX improvements (Task 056)
- ✅ Mode-specific UX improvements (Task 057)
- ✅ Button design improvements (Task 058)
- ✅ Aligned quiz/flashcard headers (Task 059)

**Impact**: Better user experience, consistent design language

---

### 8. Landing Page Redesign (Jan 2025)
**Status**: ✅ Complete
**Tasks 01-09** (Archived: landing page redesign)

**Delivered**:
- ✅ Hero section redesign
- ✅ Two modes section (Quiz vs Flashcard)
- ✅ Subject areas showcase
- ✅ Audience sections (students, teachers, parents)
- ✅ How it works section
- ✅ Screenshots/mockups
- ✅ Scroll animations
- ✅ Dark mode enhancements
- ✅ Accessibility audit

**Impact**: Professional marketing site, improved conversion

---

### 9. Timeline Visualization (Dec 2024)
**Status**: ✅ Complete
**Tasks 005-008** (Archived)

**Delivered**:
- ✅ Timeline visualization component
- ✅ Year indicator support
- ✅ Updated prompts with timeline examples
- ✅ Integrated timeline mode into question flow

**Impact**: Support for history/chronology questions

---

### 10. Map Question Type (Jan-Feb 2025)
**Status**: ⚠️ Implemented then Removed
**Tasks 019-029, 035-040** (Archived)

**Delivered** (then removed):
- ✅ Map question schema design
- ✅ Database support for map questions
- ✅ Prompts for geography map questions
- ✅ UI components for map rendering
- ✅ Validation and tests
- ✅ Map asset pipeline

**Decision**: Removed due to complexity vs. usage - see active tasks 086-089 for cleanup

**Impact**: Learned about feature complexity trade-offs

---

### 11. Multi-Subject Support (Dec 2024 - Jan 2025)
**Status**: ✅ Complete

**Delivered**:
- ✅ 11+ subjects supported: English, Math, Finnish, History, Biology, Geography, Environmental Studies, Art, Music, PE, Religion, Ethics
- ✅ Grade-specific content (Grades 4-6)
- ✅ Subject-specific curriculum files
- ✅ Metadata per subject (topics, difficulty distributions)

**Files Created**:
- Subject configurations in `/src/config/prompt-templates/subjects/`
- Metadata in `/src/config/prompt-templates/metadata/`

**Impact**: Comprehensive coverage of Finnish elementary curriculum

---

### 12. Rule-Based Flashcard System (Jan 2025)
**Status**: ✅ Complete
**Tasks 060-062** (Archived)

**Delivered**:
- ✅ Rule-based flashcard redesign
- ✅ Rule-based flashcard validation
- ✅ Rule-based question count flexibility

**Impact**: More reliable flashcard generation

---

## 🚧 ACTIVE WORK (In Progress)

### Current Sprint - Design System Standardization
**Tasks**: 086-115 (30 active tasks)
**Priority**: High
**Theme**: Clean up, standardize, and improve UI consistency

#### Cleanup & Security (Tasks 086-094)
- [ ] **086-089**: Remove map question type completely (4 tasks)
  - Remove core types
  - Remove UI components
  - Remove API/DB support
  - Remove documentation
- [ ] **090**: Fix questions RLS policy
- [ ] **091**: Add rate limiting to AI endpoints
- [ ] **092**: Replace console.log with logger
- [ ] **093**: Add question flags RLS policies
- [ ] **094**: Add environment variable validation

**Impact**: Cleaner codebase, better security, improved maintainability

---

#### Mobile UI Improvements (Tasks 095-099)
- [ ] **095**: Create collapsible search component
- [ ] **096**: Implement mobile header layout
- [ ] **097**: Horizontal scroll for grade filters
- [ ] **098**: Add sticky header with scroll shadow
- [ ] **099**: Add search autocomplete

**Impact**: Better mobile experience (majority of users on mobile)

---

#### Design System Standardization (Tasks 100-111)
- [ ] **100**: Standardize border radius
- [ ] **101**: Unify button styling
- [ ] **102**: Standardize card containers
- [ ] **103**: Fix dark mode borders
- [ ] **104**: Define typography scale
- [ ] **105**: Standardize spacing scale
- [ ] **106**: Unify shadow strategy
- [ ] **107**: Fix search input padding
- [ ] **108**: Create design tokens
- [ ] **109**: Enhance Button component
- [ ] **110**: Create Card component
- [ ] **111**: Create Badge component

**Impact**: Consistent design language, easier maintenance, better UX

---

#### Page Refactoring (Tasks 112-115)
- [ ] **112**: Refactor Browse page
- [ ] **113**: Refactor Play question page
- [ ] **114**: Refactor Results screen
- [ ] **115**: Refactor Create page

**Impact**: Cleaner code, use standardized components

---

## 📋 PLANNED FUTURE WORK

### From NEXT_STEPS.md

#### Phase 5: Additional Features (Post-Design System)
**Priority**: Medium
**Timeframe**: Q2 2026

**Planned**:
- [ ] Browse/search question sets enhancements
- [ ] Edit existing question sets
- [ ] Delete question sets (with confirmation)
- [ ] Question set statistics dashboard
- [ ] LaTeX rendering for Math questions
- [ ] Audio support for language listening comprehension

**Impact**: Richer feature set for teachers and students

---

#### Phase 6: Teacher Features (Optional)
**Priority**: Low
**Timeframe**: TBD

**Planned**:
- [ ] Teacher accounts (authentication)
- [ ] Class management system
- [ ] Student progress tracking
- [ ] Custom question creation (manual entry)
- [ ] Dashboards for teachers/parents
- [ ] Question quality ratings
- [ ] Adaptive difficulty based on performance

**Impact**: Transform into full learning platform

**Consideration**: Would require major architecture changes (auth system, user data storage)

---

#### Phase 7: Two-Level Topics (Data-Driven Decision)
**Priority**: TBD
**Reference**: `PROMPT-IMPROVEMENT-ROADMAP.md` Phase 5

**Concept**:
```
topic: "Grammar"           (L1: High-level)
subtopic: "Verb Tenses"    (L2: Mid-level)
skill: "present_simple"    (L3: Specific)
```

**When to Implement**:
- After Phase 4 (skill tagging) is validated
- When analytics show need for finer-grained topic filtering
- When users request "Practice only Present Simple tense" mode
- When topic distribution shows imbalance at high level

**Impact**: Most flexible practice modes, best analytics granularity

---

## 📊 METRICS & SUCCESS CRITERIA

### Completed Initiative Metrics

| Initiative | Status | Impact Rating | Token Savings | Quality Improvement |
|-----------|--------|---------------|---------------|---------------------|
| Phase 1: Foundation | ✅ | ⭐⭐⭐ | - | Foundation for all improvements |
| Phase 2: Subject-Type Routing | ✅ | ⭐⭐⭐⭐⭐ | - | Better questions for all subjects |
| Phase 3: Modular System | ✅ | ⭐⭐⭐⭐ | 20-30% | Easier maintenance |
| Phase 4: Skill Tagging | ✅ | ⭐⭐⭐⭐ | - | Foundation for adaptive learning |
| Publishing Workflow | ✅ | ⭐⭐⭐ | - | Content control |
| Question Flagging | ✅ | ⭐⭐⭐ | - | Quality assurance |
| Enhanced Topic ID | ✅ | ⭐⭐⭐⭐ | - | Better coverage validation |

---

## 🎯 CURRENT PRIORITIES

### High Priority (Do First)
1. **Tasks 086-089**: Remove map question type (cleanup debt)
2. **Tasks 090-094**: Security & infrastructure improvements
3. **Tasks 100-108**: Design system standardization

### Medium Priority (Do Next)
4. **Tasks 095-099**: Mobile UI improvements
5. **Tasks 109-111**: Component library creation
6. **Tasks 112-115**: Page refactoring with new components

### Low Priority (Future)
7. **Phase 5**: Additional features (browse, edit, statistics)
8. **Phase 6**: Teacher features (major undertaking)
9. **Phase 7**: Two-level topics (data-driven decision)

---

## 📈 PROGRESS SUMMARY

### Overall Stats
- **Completed Tasks**: ~85+ tasks (archived)
- **Active Tasks**: 30 tasks (086-115)
- **Planned Initiatives**: 3 major phases

### Completion Rate by Initiative
- ✅ MVP: 100% complete
- ✅ Prompt Improvements (Phases 1-4): 100% complete
- ✅ Publishing Workflow: 100% complete
- ✅ Design Refresh: 100% complete
- 🚧 Design System Standardization: 0% complete (30 tasks)
- ⏳ Additional Features (Phase 5): Not started
- ⏳ Teacher Features (Phase 6): Not started
- ⏳ Two-Level Topics (Phase 7): Awaiting data

### Lines of Code Impact
- **Files Created**: 100+ (estimated)
- **Migrations**: 15+ database migrations
- **Components**: 40+ React components
- **API Routes**: 10+ endpoints
- **Test Files**: 20+ test suites

---

## 🔄 DEVELOPMENT WORKFLOW

### How We Work

1. **Task Creation**: Create detailed task in `/todo/` with acceptance criteria
2. **Implementation**: Implement following CLAUDE.md guidelines
3. **Testing**: Manual testing + automated tests where applicable
4. **Archiving**: Move completed tasks to `/todo/archive/`
5. **Documentation**: Update AGENTS.md and relevant docs
6. **Commit**: Tag AI-generated commits with `[AI]`

### Current Status

**Last Major Milestone**: Prompt Improvement Phases 1-4 Complete (Jan 2025)
**Current Focus**: Design system standardization (Tasks 086-115)
**Next Milestone**: Complete design system, start Phase 5 features

---

## 📝 NOTES

### Key Decisions
- **No Authentication Required**: Privacy-focused, code-based sharing only
- **Claude API Only**: No migration to OpenAI (decision documented)
- **Mobile-First**: Majority of users on mobile devices
- **Rule-Based Over AI**: Where possible, use deterministic rules (flashcards)
- **Cost Optimization**: 20-30% token reduction through modular prompts

### Lessons Learned
- **Map Questions**: Complexity vs. usage trade-off - removed after implementation
- **Prompt Modularity**: Big wins in maintainability and cost
- **Skill Tagging**: Foundation for future adaptive learning
- **Partial Success Handling**: Robust AI integration requires graceful degradation

### Technical Debt
- Map question cleanup (Tasks 086-089) - high priority
- Design system inconsistencies (Tasks 100-108) - addressing now
- Console.log vs proper logging (Task 092)
- Missing rate limiting on AI endpoints (Task 091)

---

## 🚀 GETTING STARTED

### For New Contributors

1. **Read Core Docs**:
   - `CLAUDE.md` - AI assistant guidelines
   - `IMPLEMENTATION_PLAN.md` - Architecture overview
   - `docs/QUESTION-GENERATION-FLOW.md` - How questions are generated

2. **Review Active Tasks**: Browse `/todo/` for current work

3. **Set Up Local Environment**:
   ```bash
   npm install
   cp .env.example .env.local
   # Add your Supabase and Anthropic API keys
   npm run dev
   ```

4. **Pick a Task**: Start with Tasks 086-094 (cleanup) or 100-108 (design system)

---

## 📚 REFERENCES

### Primary Documents
- `docs/PROMPT-IMPROVEMENT-ROADMAP.md` - Phases 1-4 (all complete)
- `docs/IMPLEMENTATION_PLAN.md` - Original architecture
- `docs/MVP_COMPLETE.md` - MVP completion status
- `docs/NEXT_STEPS.md` - Post-MVP roadmap
- `CLAUDE.md` - Development guidelines

### Task Archives
- `/todo/archive/` - 85+ completed tasks
- `/todo/` - 30 active tasks (086-115)

### Migration History
- `supabase/migrations/README.md` - Database evolution

---

**Last Updated**: 2026-02-09
**Next Review**: After Tasks 086-115 completion
