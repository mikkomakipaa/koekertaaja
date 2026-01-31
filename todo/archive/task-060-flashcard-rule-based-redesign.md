# Task 060: Flashcard Rule-Based Redesign

**Status:** 🔴 Not Started
**Estimate:** 8 points
**Priority:** P1

## Overview

Redesign flashcard prompts for mathematics, grammar, and other rule-based subjects to present concepts/rules instead of practice questions. This improves learning by teaching "how to" rather than just testing knowledge.

## Current Behavior

**Front:** "Laske suorakulmion ala, kun sivut ovat 4m ja 6m"
**Back:** "24 m²" + explanation

## Target Behavior

**Front:** "Miten lasketaan suorakulmion pinta-ala?"
**Back:** "Pinta-ala = pituus × leveys\n\nEsimerkki: Jos suorakulmion sivut ovat 4m ja 6m, niin pinta-ala = 4m × 6m = 24 m²"

---

## Acceptance Criteria

### 1. Prompt Template Updates

- [ ] Update `src/config/prompt-templates/core/flashcard-rules.txt`:
  - Add instructions for rule-based question format
  - Specify front format: "Miten lasketaan/tehdään...?" or "Mikä on [sääntö/kaava]?"
  - Specify back format: Formula/rule + worked example
  - Add list of applicable subjects/topics

- [ ] Create subject-specific flashcard guidelines:
  - **Mathematics:** Geometry (area, volume, perimeter), arithmetic operations, fractions, decimals, percentages
  - **Language (Grammar):** Verb conjugation rules, sentence structure, grammar patterns
  - **Physics:** Basic formulas (if applicable)
  - **Chemistry:** Chemical equations (if applicable)

### 2. Prompt Builder Logic

- [ ] Update `src/lib/prompts/PromptBuilder.ts`:
  - Add logic to detect rule-based subjects (mathematics, grammar, etc.)
  - Apply rule-based flashcard instructions for applicable subjects
  - Keep existing question-based approach for vocabulary, facts, etc.

### 3. AI Prompt Engineering

- [ ] Add examples to prompt showing desired format:
  ```
  GOOD FLASHCARD (Mathematics - Geometry):
  Front: "Miten lasketaan suorakulmion pinta-ala?"
  Back: "Pinta-ala = pituus × leveys\n\nEsimerkki: Jos suorakulmion sivut ovat 4m ja 6m, niin pinta-ala = 4m × 6m = 24 m²"

  GOOD FLASHCARD (Grammar):
  Front: "Miten muodostetaan yksikön ensimmäisen persoonan imperfekti?"
  Back: "Verbi + -in päätteellä\n\nEsimerkki: puhua → puhuin, syödä → söin, juosta → juoksin"

  BAD FLASHCARD:
  Front: "Laske: 4m × 6m"
  Back: "24 m²"
  ```

### 4. Format Handling

- [ ] Ensure MathText component supports formula rendering
- [ ] Test multi-line formatting for back of card (formula + example)
- [ ] Verify dark mode readability for formulas and examples

### 5. Testing

- [ ] Generate test flashcard set for **Mathematics - Geometry** (area, volume, perimeter)
- [ ] Generate test flashcard set for **Mathematics - Arithmetic** (operations, order)
- [ ] Generate test flashcard set for **Grammar** (verb conjugation, sentence structure)
- [ ] Verify front/back format matches specification
- [ ] Verify examples are age-appropriate and clear

### 6. Documentation

- [ ] Update `docs/FLASHCARD_TEMPLATE_VERIFICATION.md` with new rules
- [ ] Document which subjects use rule-based vs question-based approach
- [ ] Add examples to documentation

---

## Implementation Notes

### Subject Detection Logic

```typescript
// In PromptBuilder.ts
const isRuleBasedSubject = (subject: string, topic?: string): boolean => {
  const ruleBasedSubjects = [
    'matematiikka',
    'äidinkieli', // Grammar topics only
    'englanti', // Grammar topics only
    'ruotsi', // Grammar topics only
    'fysiikka', // Formula topics
    'kemia', // Equation topics
  ];

  // Check if subject is rule-based
  if (ruleBasedSubjects.includes(subject.toLowerCase())) {
    // For language subjects, check if topic is grammar-related
    if (['äidinkieli', 'englanti', 'ruotsi'].includes(subject.toLowerCase())) {
      return topic?.toLowerCase().includes('kielioppi') || topic?.toLowerCase().includes('grammar') || false;
    }
    return true;
  }

  return false;
};
```

### Example Prompt Addition

Add to flashcard-rules.txt:

```
## RULE-BASED FLASHCARD FORMAT (For Mathematics, Grammar, Formulas)

When creating flashcards for rule-based subjects (mathematics, grammar, formulas):

**FRONT (Question format):**
- Ask "How to" questions: "Miten lasketaan...?", "Miten muodostetaan...?", "Mikä on kaava...?"
- Focus on the rule/concept, not a specific calculation

**BACK (Formula + Example):**
- State the rule/formula clearly
- Provide a worked example showing the rule in action
- Keep examples simple and age-appropriate
- Format: "Rule/Formula\n\nEsimerkki: [concrete example with numbers/words]"

**Example:**
Front: "Miten lasketaan suorakulmion pinta-ala?"
Back: "Pinta-ala = pituus × leveys\n\nEsimerkki: Jos suorakulmion sivut ovat 4m ja 6m, niin pinta-ala = 4m × 6m = 24 m²"
```

---

## Files to Modify

1. `src/config/prompt-templates/core/flashcard-rules.txt` - Add rule-based instructions
2. `src/lib/prompts/PromptBuilder.ts` - Add subject detection and conditional rules
3. `docs/FLASHCARD_TEMPLATE_VERIFICATION.md` - Update documentation
4. `tests/flashcard-template-verification.test.ts` - Add test cases for rule-based format

---

## Non-Goals

- ❌ No backfill of existing flashcard sets (only affects new generation)
- ❌ No changes to flashcard display UI (FlashcardCard.tsx already supports multi-line text)
- ❌ No changes to vocabulary or fact-based flashcard subjects

---

## Testing Checklist

After implementation, generate flashcard sets and verify:

- [ ] Mathematics (Geometry): Cards ask "Miten lasketaan [shape] pinta-ala/tilavuus?"
- [ ] Mathematics (Arithmetic): Cards ask "Mikä on laskujärjestys?" etc.
- [ ] Grammar (Finnish): Cards ask "Miten muodostetaan [tense/form]?"
- [ ] Grammar (English): Cards ask "How to form [grammar structure]?"
- [ ] Back of cards includes formula/rule + concrete example
- [ ] Examples use numbers/words appropriate for grade level
- [ ] MathText renders formulas correctly
- [ ] Dark mode is readable

---

## Success Criteria

✅ New mathematics flashcard sets present rules and formulas with examples
✅ New grammar flashcard sets present grammar rules with examples
✅ Front of card asks "Miten" or "Mikä" questions about the rule/concept
✅ Back of card provides rule/formula + worked example
✅ Non-rule subjects (vocabulary, facts) remain question-based
✅ All tests pass and documentation is updated
