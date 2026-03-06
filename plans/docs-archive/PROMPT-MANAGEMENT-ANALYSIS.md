# Prompt Management & Question Quality Analysis

**Date**: 2025-01-18
**Added to**: `/Documentation/OPENAI-MIGRATION-WIREFRAME.md`

---

## Summary

Comprehensive analysis added to the OpenAI migration wireframe document covering current prompt management design, problems, and 5 improvement options with implementation roadmap.

---

## What Was Analyzed

### Current State
- **6 TypeScript prompt files**: english.ts, math.ts, generic.ts + flashcard variants
- **Massive duplication**: Grade distributions, JSON schema, topic tagging rules repeated 6 times
- **Subject type confusion**: generic.ts handles history, biology, geography, art, music, PE, religion (different cognitive patterns, same prompt)
- **No skill-level tagging**: Can't separate grammar from vocabulary, computation from word problems
- **Large prompts**: ~2000 tokens sent per request (higher API costs)

### Problems Identified

1. **Code Duplication** - Same structures repeated across 6 files
2. **Subject Type Confusion** - Generic template for too many different subject types
3. **Mixed Skill Questions** - No way to tag grammar vs vocabulary, computation vs word problems
4. **Token Waste** - Large prompts with repeated instructions
5. **Hard to Edit** - TypeScript code editing required for prompt changes

---

## Improvement Options Proposed

### **Option A: Template System Only** (Tasks 001-004)
**Status**: Foundation - already planned

- Separates prompt content from code
- Plain text `.txt` template files
- `PromptLoader` class loads templates
- `PromptBuilder` class builds variable data

**Pros**: Clean separation, easier editing
**Cons**: Still 6 separate files, doesn't solve subject type confusion
**Complexity**: Low
**Recommendation**: ✅ Complete first as foundation

---

### **Option B: Modular Prompt System** (Recommended)
**Build on Option A with subject-type modules**

**Architecture**:
```
src/config/prompt-templates/
├── core/
│   ├── format.txt              # JSON schema (shared)
│   ├── topic-tagging.txt       # Topic rules (shared)
│   └── grade-distributions.json # All distributions
├── types/
│   ├── language.txt            # English, Finnish
│   ├── math.txt                # Math-specific rules
│   └── written.txt             # History, biology, geography
├── subjects/
│   ├── english.json            # Curriculum per grade
│   ├── math.json
│   └── generic.json
└── assembled/
    ├── quiz/                   # Auto-generated
    └── flashcard/              # Auto-generated
```

**Prompt Assembly**:
```typescript
buildPrompt({subject, difficulty, grade, mode}) {
  const subjectType = getSubjectType(subject); // language|math|written

  // Load modules
  const format = load('core/format.txt');
  const topicRules = load('core/topic-tagging.txt');
  const typeRules = load(`types/${subjectType}.txt`);
  const curriculum = load(`subjects/${subject}.json`);
  const distributions = load('core/grade-distributions.json');

  // Assemble
  return format + topicRules + typeRules + curriculum + distributions;
}
```

**Benefits**:
- ✅ DRY - common blocks defined once
- ✅ Clear separation by subject type
- ✅ Smaller token usage
- ✅ Easy editing - change type module to affect all subjects of that type

**Complexity**: Medium
**Effort**: 8-12 hours
**Recommendation**: ✅ Implement after Option A

---

### **Option C: Skill-Level Topic Tagging** (Builds on B)
**Add explicit skill taxonomy**

**English Skills**:
- grammar: [verb_tenses, sentence_structure, parts_of_speech]
- vocabulary: [word_meaning, synonyms, context_clues]
- reading: [comprehension, inference, main_idea]
- writing: [sentence_formation, paragraph_structure]

**Math Skills**:
- computation: [addition, subtraction, multiplication, division]
- word_problems: [problem_solving, multi_step]
- geometry: [shapes, area, perimeter]
- number_sense: [place_value, fractions, decimals]

**Written Subjects Skills**:
- recall: [facts, dates, names, definitions]
- comprehension: [cause_effect, compare_contrast, sequences]
- application: [examples, real_world_connections]
- analysis: [patterns, relationships, conclusions]

**Question Schema Update**:
```json
{
  "question_text": "...",
  "type": "multiple_choice",
  "topic": "Grammar",           // High-level
  "skill": "verb_tenses",        // Specific skill
  "subtopic": "Present Simple"   // Optional
}
```

**Prompt Requirement**:
```
SKILL TAGGING REQUIREMENTS:
1. Each question MUST have exactly ONE skill tag
2. DO NOT mix skills in a single question
   ❌ BAD: "Complete AND identify the verb tense" (mixed)
   ✅ GOOD: "Complete: I ___ to school" (grammar only)
3. Tag the PRIMARY skill being tested
```

**Benefits**:
- ✅ Clearer questions - no skill mixing
- ✅ Better sampling - stratified by topic AND skill
- ✅ Practice modes - "Grammar only" feature
- ✅ Quality metrics - track which skills need better questions

**Complexity**: Medium
**Effort**: 12-16 hours
**Database**: Add `skill TEXT` column
**Recommendation**: ✅ Implement medium-term

---

### **Option D: Two-Level Topics** (Builds on C)
**Enforce 2-level taxonomy**

```
topic: "Grammar"           // L1: High-level (stratified sampling)
subtopic: "Verb Tenses"    // L2: Mid-level (focused practice)
skill: "present_simple"    // L3: Specific (tracking)
```

**Examples**:
- English: Grammar → Verb Tenses → present_simple
- Math: Computation → Addition/Subtraction → multi_digit_addition
- History: Ancient History → Greece → democracy

**Database Migration**:
```sql
ALTER TABLE questions
  ADD COLUMN subtopic TEXT,
  ADD COLUMN skill TEXT;
```

**Benefits**:
- ✅ Flexible sampling by L1, L2, or L3
- ✅ Practice modes at all levels
- ✅ Analytics track gaps at all levels
- ✅ Balanced generation across hierarchy

**Complexity**: High
**Effort**: 16-24 hours
**Recommendation**: ⏳ Long-term (if analytics show need)

---

### **Option E: Subject-Type Routing** (Quick Win)
**Split generic.ts into 3 types**

**Before**:
```
generic.ts → history, biology, geography, art, music, PE, religion, ethics
```

**After**:
```
written.ts   → history, biology, geography (content-heavy)
skills.ts    → art, music, PE (skill-based)
concepts.ts  → religion, ethics, philosophy (concept-based)
```

**Subject Type Mapping**:
```typescript
const SUBJECT_TYPE_MAPPING = {
  english: 'language',
  math: 'math',
  finnish: 'language',
  history: 'written',
  biology: 'written',
  geography: 'written',
  art: 'skills',
  music: 'skills',
  pe: 'skills',
  religion: 'concepts',
  ethics: 'concepts',
};
```

**Prompt Differentiation**:

**written.txt**: Fact recall, timelines, cause-effect, compare-contrast
**skills.txt**: Technique identification, equipment, safety, cultural context
**concepts.txt**: Value identification, perspective comparison, scenario analysis

**Benefits**:
- ✅ Better question quality - patterns match cognitive demands
- ✅ Easy to implement - just split + route
- ✅ No DB changes

**Complexity**: Low
**Effort**: 2-4 hours
**Recommendation**: ✅ **QUICK WIN** - implement immediately

---

## Implementation Roadmap

### **Phase 1: Foundation** (Tasks 001-004)
- ✅ Template files created
- ⏳ PromptLoader class
- ⏳ PromptBuilder class
- ⏳ Refactor questionGenerator
- ⏳ Cleanup old TypeScript prompts

**Timeline**: Part of OpenAI migration
**Effort**: Included in tasks 001-004

---

### **Phase 2: Subject-Type Routing** (Option E)
- Split generic.txt → written.txt, skills.txt, concepts.txt
- Add subject type mapping
- Update PromptBuilder routing

**Timeline**: Immediately after Phase 1
**Effort**: 2-4 hours
**Impact**: ⭐⭐⭐⭐⭐ High - better questions for all subjects

---

### **Phase 3: Modular Prompt System** (Option B)
- Extract common blocks to core/
- Create type modules
- Move distributions to JSON
- Update PromptBuilder assembly

**Timeline**: 1-2 weeks after migration
**Effort**: 8-12 hours
**Impact**: ⭐⭐⭐⭐ Medium-High - easier maintenance, reduced duplication

---

### **Phase 4: Skill-Level Tagging** (Option C)
- Define skill taxonomies
- Add skill column to database
- Update prompts with skill requirements
- Update stratified sampling

**Timeline**: 1-2 months
**Effort**: 12-16 hours
**Impact**: ⭐⭐⭐⭐ High - enables skill-specific practice modes

---

### **Phase 5: Two-Level Topics** (Option D)
- Define topic hierarchy (L1/L2/L3)
- Migrate existing data
- Update prompts
- Add UI for hierarchy filtering

**Timeline**: Future enhancement
**Effort**: 16-24 hours
**Impact**: ⭐⭐⭐⭐⭐ Very High - flexible practice, better analytics

---

## Recommended Action

### Immediate (with OpenAI Migration)
1. ✅ **Complete Tasks 001-004** (template system)
2. ✅ **Implement Option E** (Subject-Type Routing) - **2-4 hour quick win**

### Short-term (1-2 weeks)
3. ✅ **Implement Option B** (Modular Prompt System)

### Medium-term (1-2 months)
4. ✅ **Implement Option C** (Skill-Level Tagging)

### Long-term (Future)
5. ⏳ **Consider Option D** (Two-Level Topics)

---

## Why This Order

**Phases 1-2**: Immediate benefits with low risk
- Foundation enables everything else
- Subject-type routing is quick win for question quality

**Phase 3**: Reduces maintenance burden before scaling
- Makes future changes easier
- Reduces token costs

**Phases 4-5**: Add features once foundation is solid
- Build on proven architecture
- Data-driven decision (wait for analytics)

---

## Key Takeaways

1. **Current prompts have significant duplication** - fixing this reduces maintenance burden

2. **Subject-type confusion is biggest quality issue** - splitting generic.ts is quick win

3. **Skill-level tagging is future growth path** - enables "Grammar only" practice modes

4. **Modular system reduces token costs** - assemble only needed blocks

5. **Phased approach manages risk** - foundation first, features later

---

**Status**: Analysis complete, added to wireframe
**Next Step**: User validation of OpenAI migration + prompt improvement roadmap
**Document**: `/Documentation/OPENAI-MIGRATION-WIREFRAME.md`
