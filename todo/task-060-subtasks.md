# Task 060: Flashcard Rule-Based Redesign - Subtasks

This document breaks down Task 060 into smaller, actionable subtasks.

---

## Subtask 060.1: Update Flashcard Rules Template

**Estimate:** 2 points
**File:** `src/config/prompt-templates/core/flashcard-rules.txt`

**Tasks:**
- [ ] Add section for "Rule-Based Flashcard Format"
- [ ] Specify front format: "Miten lasketaan/tehdään...?" or "Mikä on [rule]?"
- [ ] Specify back format: "Rule/Formula\n\nEsimerkki: [worked example]"
- [ ] Add 3-5 good examples (mathematics, grammar)
- [ ] Add 2-3 bad examples (what NOT to do)
- [ ] List applicable subjects and topics

**Example addition:**
```
## RULE-BASED FLASHCARD FORMAT

For subjects with rules, formulas, or procedures (Mathematics, Grammar):

Front: Ask "How to" questions
- "Miten lasketaan suorakulmion pinta-ala?"
- "Miten muodostetaan imperfekti?"
- "Mikä on Pythagoraan lause?"

Back: State rule + provide worked example
- "Pinta-ala = pituus × leveys\n\nEsimerkki: 4m × 6m = 24 m²"
- "Verbi + -in\n\nEsimerkki: puhua → puhuin, syödä → söin"

Do NOT create calculation practice cards:
❌ Front: "Laske: 4m × 6m"
```

---

## Subtask 060.2: Add Subject Detection Logic

**Estimate:** 3 points
**File:** `src/lib/prompts/PromptBuilder.ts`

**Tasks:**
- [ ] Create `isRuleBasedSubject()` helper function
- [ ] Define list of rule-based subjects (matematiikka, grammar topics, etc.)
- [ ] For language subjects, check if topic includes "kielioppi" or "grammar"
- [ ] Add conditional logic to apply rule-based instructions
- [ ] Test with different subject/topic combinations

**Code structure:**
```typescript
private isRuleBasedSubject(subject: string, topic?: string): boolean {
  const ruleBasedSubjects = ['matematiikka', 'fysiikka', 'kemia'];
  const languageSubjects = ['äidinkieli', 'englanti', 'ruotsi'];

  if (ruleBasedSubjects.includes(subject.toLowerCase())) {
    return true;
  }

  if (languageSubjects.includes(subject.toLowerCase())) {
    // Only grammar topics
    return topic?.toLowerCase().includes('kielioppi') ||
           topic?.toLowerCase().includes('grammar') ||
           false;
  }

  return false;
}

// In buildFlashcardPrompt():
if (this.isRuleBasedSubject(subject, topic)) {
  prompt += this.loadTemplate('flashcard-rule-based-format.txt');
}
```

---

## Subtask 060.3: Create Test Flashcard Sets

**Estimate:** 2 points
**Location:** Manual testing via `/create` page

**Tasks:**
- [ ] Generate **Mathematics - Geometry** flashcard set (pinta-ala, tilavuus)
- [ ] Generate **Mathematics - Arithmetic** flashcard set (laskujärjestys, peruslaskutoimitukset)
- [ ] Generate **Grammar - Finnish** flashcard set (imperfekti, partisiippi)
- [ ] Generate **Grammar - English** flashcard set (past tense, plurals)
- [ ] Verify each card follows "Miten...?" front format
- [ ] Verify each card has formula/rule + example on back
- [ ] Screenshot examples for documentation

---

## Subtask 060.4: Update Documentation

**Estimate:** 1 point
**Files:**
- `docs/FLASHCARD_TEMPLATE_VERIFICATION.md`
- `docs/QUESTION-GENERATION-FLOW.md` (if needed)

**Tasks:**
- [ ] Add section on rule-based vs question-based flashcards
- [ ] List which subjects use which approach
- [ ] Add examples of good rule-based flashcards
- [ ] Update flowchart/decision tree if exists
- [ ] Add testing guidelines for future flashcard sets

---

## Implementation Order

1. **Subtask 060.1** (Update template) - Start here
2. **Subtask 060.2** (Subject detection logic) - Core functionality
3. **Subtask 060.3** (Testing) - Validate implementation
4. **Subtask 060.4** (Documentation) - Finalize

---

## Testing Strategy

### Unit Tests
- Test `isRuleBasedSubject()` with various subject/topic combinations
- Verify correct template is loaded based on subject

### Integration Tests
- Generate flashcard sets via API
- Parse and validate question format
- Check front format matches "Miten...?" pattern
- Check back format includes both rule and example

### Manual Tests
- Create multiple flashcard sets through UI
- Play through flashcard sessions
- Verify readability and usefulness
- Check dark mode rendering

---

## Success Metrics

- ✅ 100% of new math flashcards use "Miten lasketaan...?" format
- ✅ 100% of new grammar flashcards use "Miten muodostetaan...?" format
- ✅ 100% of backs include both rule and worked example
- ✅ Vocabulary/fact subjects remain unchanged
- ✅ No breaking changes to existing flashcard sets

---

## Rollback Plan

If implementation causes issues:
1. Revert `flashcard-rules.txt` changes
2. Remove conditional logic from PromptBuilder
3. Existing flashcard sets unaffected (no database changes)
4. API remains backward compatible
