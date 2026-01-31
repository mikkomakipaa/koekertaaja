# Task 005: Implement Subject-Type Routing (Phase 2 - Quick Win)

## Context

- Why this is needed:
  - **Phase 2 Quick Win**: Split generic.ts into subject-type-specific templates
  - Improve question quality by matching prompts to cognitive patterns
  - Current problem: `generic.ts` handles history, biology, art, music, PE, religion with same prompt
  - Different subjects need different question patterns (written vs skills vs concepts)
  - **Effort**: 2-4 hours
  - **Impact**: ⭐⭐⭐⭐⭐ High - immediate question quality improvement

- Related docs/links:
  - `/Documentation/PROMPT-MANAGEMENT-ANALYSIS.md` - Option E analysis
  - Phase 1 (Tasks 001-004) must be complete before starting
  - `/src/lib/prompts/PromptBuilder.ts` (created in Phase 1)

- Related files:
  - New: `/src/config/prompt-templates/quiz/written-quiz.txt`
  - New: `/src/config/prompt-templates/quiz/skills-quiz.txt`
  - New: `/src/config/prompt-templates/quiz/concepts-quiz.txt`
  - New: `/src/config/prompt-templates/flashcard/written-flashcard.txt`
  - New: `/src/config/prompt-templates/flashcard/skills-flashcard.txt`
  - New: `/src/config/prompt-templates/flashcard/concepts-flashcard.txt`
  - Update: `/src/lib/prompts/PromptBuilder.ts` - Add subject type mapping
  - Update: `/src/config/subjects.ts` - Add subject type metadata
  - Remove: `/src/config/prompt-templates/quiz/generic-quiz.txt`
  - Remove: `/src/config/prompt-templates/flashcard/generic-flashcard.txt`

## Scope

- In scope:
  - Create subject type mapping: `language`, `math`, `written`, `skills`, `concepts`
  - Split generic templates into 3 new templates (written, skills, concepts)
  - Update PromptBuilder to route by subject type instead of subject name
  - Differentiate question patterns for each subject type
  - Update metadata JSON files for new subject types
  - Test all subject types with sample materials
  - Keep English and Math templates unchanged

- Out of scope:
  - Modular prompt architecture (Phase 3)
  - Skill-level tagging (Phase 4)
  - Database schema changes
  - API contract changes

## Changes

- [ ] Create subject type mapping in `/src/lib/prompts/subjectTypeMapping.ts`:
  ```typescript
  export const SUBJECT_TYPE_MAPPING = {
    english: 'language',
    math: 'math',
    finnish: 'language',
    history: 'written',
    biology: 'written',
    geography: 'written',
    'environmental-studies': 'written',
    art: 'skills',
    music: 'skills',
    pe: 'skills',
    religion: 'concepts',
    ethics: 'concepts',
  } as const;

  export function getSubjectType(subject: string): SubjectType {
    return SUBJECT_TYPE_MAPPING[subject] || 'written'; // Default fallback
  }
  ```

- [ ] Create `/src/config/prompt-templates/quiz/written-quiz.txt`:
  - Focus: Fact recall, timelines, cause-effect, compare-contrast
  - Question patterns: "Mitä tapahtui kun...", "Miksi...", "Miten X vaikutti Y:hyn?"
  - Suitable for: History, Biology, Geography, Environmental Studies

- [ ] Create `/src/config/prompt-templates/quiz/skills-quiz.txt`:
  - Focus: Technique identification, equipment, safety, cultural context
  - Question patterns: "Minkä välineen käytät...", "Mikä tekniikka sopii...", "Nimeä maalaustekniikoita..."
  - Suitable for: Art, Music, PE

- [ ] Create `/src/config/prompt-templates/quiz/concepts-quiz.txt`:
  - Focus: Value identification, perspective comparison, scenario analysis
  - Question patterns: "Miksi tämä on tärkeää...", "Miten X vaikuttaa...", "Mitä ajattelet kun..."
  - Suitable for: Religion, Ethics, Philosophy

- [ ] Create flashcard equivalents:
  - `/src/config/prompt-templates/flashcard/written-flashcard.txt`
  - `/src/config/prompt-templates/flashcard/skills-flashcard.txt`
  - `/src/config/prompt-templates/flashcard/concepts-flashcard.txt`

- [ ] Create metadata JSON files:
  - `/src/config/prompt-templates/metadata/written-distributions.json`
  - `/src/config/prompt-templates/metadata/skills-distributions.json`
  - `/src/config/prompt-templates/metadata/concepts-distributions.json`
  - Copy from generic-distributions.json, adjust percentages if needed

- [ ] Update `/src/lib/prompts/PromptBuilder.ts`:
  - Import `getSubjectType()` function
  - Change template path logic to use subject type instead of subject name
  - Update metadata loading to use subject type mappings
  - Keep backward compatibility for english/math

- [ ] Update `/src/config/subjects.ts`:
  - Add `subjectType` field to subject definitions (optional metadata)
  - Document which subjects map to which types

- [ ] Remove old generic templates:
  - Delete `/src/config/prompt-templates/quiz/generic-quiz.txt`
  - Delete `/src/config/prompt-templates/flashcard/generic-flashcard.txt`
  - Delete `/src/config/prompt-templates/metadata/generic-distributions.json`

## Acceptance Criteria

- [ ] Subject type mapping works for all 11+ subjects
- [ ] 3 new written templates exist (quiz + flashcard)
- [ ] 3 new skills templates exist (quiz + flashcard)
- [ ] 3 new concepts templates exist (quiz + flashcard)
- [ ] PromptBuilder routes to correct template based on subject type
- [ ] History questions use written patterns (fact recall, timelines)
- [ ] Art questions use skills patterns (technique identification)
- [ ] Religion questions use concepts patterns (value identification)
- [ ] English and Math still work with original templates
- [ ] All metadata JSON files load correctly
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Question generation works for all subjects

## Testing

- [ ] Tests to run:
  - Manual test: Generate history quiz → verify written patterns
  - Manual test: Generate art quiz → verify skills patterns
  - Manual test: Generate religion quiz → verify concepts patterns
  - Manual test: Generate English quiz → verify still uses language template
  - Manual test: Generate Math quiz → verify still uses math template
  - Test all 11+ subjects (1 quiz each minimum)
  - `npm run typecheck`
  - `npm run lint`

- [ ] Quality checks:
  - History questions focus on timelines, causes, effects
  - Art questions focus on techniques, equipment, cultural context
  - Religion questions focus on values, perspectives, scenarios
  - No "generic" fallback questions
  - Question types match subject cognitive patterns

## Implementation Notes

**Subject Type Definitions:**

```typescript
type SubjectType = 'language' | 'math' | 'written' | 'skills' | 'concepts';
```

**Template Differentiation Examples:**

**Written (History, Biology, Geography):**
```
Fokusoidu FAKTATIETOON ja ymmärrykseen:
- Tapahtumat ja niiden järjestys (aikajana)
- Syy-seuraussuhteet
- Vertailu ja erot
- Määritelmät ja käsitteet

ESIMERKKIKYSYMYKSIÄ:
- "Mitä tapahtui Rooman valtakunnan aikana?"
- "Miksi fotosynteesissä tarvitaan valoa?"
- "Miten vuodenajat vaikuttavat luontoon?"
```

**Skills (Art, Music, PE):**
```
Fokusoidu TAITOIHIN ja tekniikkoihin:
- Välineiden ja laitteiden tunnistaminen
- Tekniikoiden nimeäminen
- Turvallisuus ja käyttö
- Kulttuurinen konteksti

ESIMERKKIKYSYMYKSIÄ:
- "Mitä välineitä tarvitset akvarellimaalauksen tekemiseen?"
- "Nimeä kolme jalkapallon perustekniikkaa."
- "Mikä soitin soittaa tämän äänen?"
```

**Concepts (Religion, Ethics, Philosophy):**
```
Fokusoidu ARVOIHIN ja näkökulmiin:
- Arvot ja periaatteet
- Näkökulmien vertailu
- Skenaarioanalyysi
- Henkilökohtainen pohdinta

ESIMERKKIKYSYMYKSIÄ:
- "Miksi rehellisyys on tärkeää?"
- "Miten auttaisit ystävää tässä tilanteessa?"
- "Mitä ajattelet kun kuulet sanan 'oikeudenmukaisuus'?"
```

**PromptBuilder Update:**

```typescript
// OLD (Task 003)
function getTemplatePath(subject: Subject, mode: 'quiz' | 'flashcard'): string {
  const subjectKey = normalizeSubject(subject); // 'english' | 'math' | 'generic'
  return `${mode}/${subjectKey}-${mode}.txt`;
}

// NEW (Task 005)
import { getSubjectType } from './subjectTypeMapping';

function getTemplatePath(subject: Subject, mode: 'quiz' | 'flashcard'): string {
  const subjectType = getSubjectType(subject); // 'language' | 'math' | 'written' | 'skills' | 'concepts'

  // Special case: English and Math keep their own templates
  if (subject === 'english' || subject === 'math') {
    return `${mode}/${subject}-${mode}.txt`;
  }

  // Generic subjects use subject type routing
  return `${mode}/${subjectType}-${mode}.txt`;
}
```

**Backward Compatibility:**

- English template: `/quiz/english-quiz.txt` (unchanged)
- Math template: `/quiz/math-quiz.txt` (unchanged)
- History → `/quiz/written-quiz.txt` (new)
- Art → `/quiz/skills-quiz.txt` (new)
- Religion → `/quiz/concepts-quiz.txt` (new)

**Metadata Loading Update:**

```typescript
// In PromptBuilder.loadMetadata()
const subjectType = getSubjectType(params.subject);

// Special case for english/math
if (params.subject === 'english') {
  distributions = require('../metadata/english-distributions.json');
} else if (params.subject === 'math') {
  distributions = require('../metadata/math-distributions.json');
} else {
  // Use subject type for others
  distributions = require(`../metadata/${subjectType}-distributions.json`);
}
```

**Distribution Examples:**

All three new types can start with same distributions as generic, but can be tuned later:

```json
{
  "4": {
    "helppo": {
      "multiple_choice": 60,
      "fill_blank": 20,
      "short_answer": 10,
      "matching": 10
    },
    "normaali": {
      "multiple_choice": 40,
      "fill_blank": 30,
      "short_answer": 20,
      "matching": 10
    }
  }
  // ... grades 5-6
}
```

**Success Metrics:**

- Question quality improvement visible in manual testing
- Better alignment between question patterns and subject cognitive patterns
- No regression in English/Math question quality
- All 11+ subjects generate valid questions
