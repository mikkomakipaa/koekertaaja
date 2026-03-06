# Lenient Answer Matching

## Overview

The app uses **age-appropriate lenient answer matching** for short answer and fill-in-the-blank questions to accommodate young learners (grades 4-6) who may have minor spelling mistakes, use synonyms, or phrase answers slightly differently.

## How It Works

### Three Matching Strategies

1. **Exact Match** (after normalization)
   - Case-insensitive
   - Whitespace-trimmed
   - Punctuation removed
   - Multiple spaces collapsed

2. **Contains Match**
   - Checks if correct answer is contained in user answer
   - Allows for extra explanatory text

3. **Fuzzy Match** (Levenshtein distance)
   - Calculates similarity using edit distance
   - Uses grade-specific thresholds

### Smart Validation Layers

In addition to fuzzy matching, the validator now supports semantic equivalence checks:

1. **Numerical equivalence**
   - `1/2`, `0.5`, `0,5`, and `50%` are treated as equivalent.
2. **Unit conversion**
   - Length: `mm`, `cm`, `m`, `km`
   - Mass: `mg`, `g`, `kg`, `t`
   - Time: `s`, `sec`, `min`, `h`, `d`
   - Temperature: `C`, `K`, `F`
3. **Expression equivalence**
   - Subscript/superscript normalization (`CO₂` == `CO2`)
   - Commutative additive expressions (`2x + 3` == `3 + 2x`)
4. **Finnish semantic alternatives (subject-aware)**
   - Enabled for language/society/history-type content
   - Example: `Suomi` == `Suomen tasavalta`

### Grade-Based Thresholds

| Grade | Threshold | Description |
|-------|-----------|-------------|
| 4 | 75% | Most lenient - allows ~3 mistakes in 12-char word |
| 5 | 80% | Medium - allows ~2 mistakes in 12-char word |
| 6 | 85% | Stricter - allows ~2 mistakes in 12-char word |
| 7+ | 90% | Default - requires high accuracy |

## Examples

### Grade 4 Examples (75% threshold)

**Correct Answer**: `fotosynteesin`

✅ **Accepted**:
- `fotosynteesin` (exact)
- `Fotosynteesin` (case difference)
- `fotosynteesi` (minor spelling - 1 char difference, ~92% similar)
- `fotosyntesin` (missing 'e' - 1 char difference, ~92% similar)
- `kasvien fotosynteesin` (contains correct answer)
- `fotosynteesin prosessi` (contains correct answer)

❌ **Rejected**:
- `fotosyntes` (too short - 3 chars missing, ~73% similar)
- `synteesi` (too different - only 42% similar)
- `valotus` (completely different)

### Grade 5 Examples (80% threshold)

**Correct Answer**: `hengitys`

✅ **Accepted**:
- `hengitys` (exact)
- `hengitys prosessi` (contains)
- `hennitus` (1 char difference - 87% similar)

❌ **Rejected**:
- `hennit` (too short - 75% similar)
- `hengit` (too short - 75% similar)

### Grade 6 Examples (85% threshold)

**Correct Answer**: `vesi`

✅ **Accepted**:
- `vesi` (exact)
- `Vesi` (case)
- `veden` (close variant - 80% similar if conjugation)
- `vesi virtaa` (contains)

❌ **Rejected**:
- `ves` (too short - 75% similar)
- `vetti` (different word - 60% similar)

## Implementation Details

### Normalization Process

```typescript
function normalizeString(str: string): string {
  return str
    .toLowerCase()            // "Fotosynteesin" → "fotosynteesin"
    .trim()                   // " vesi " → "vesi"
    .replace(/\s+/g, ' ')     // "vesi  virtaa" → "vesi virtaa"
    .replace(/[.,!?;:]/g, ''); // "vesi!" → "vesi"
}
```

### Similarity Calculation

Uses **Levenshtein distance**: minimum number of single-character edits (insertions, deletions, substitutions) needed to change one word into another.

**Example**: `fotosynteesin` → `fotosyntesin`
- Delete 'e' at position 8
- Edit distance: 1
- Similarity: 1 - (1 / 13) = 92.3%

### Usage in Code

```typescript
// In useGameSession hook
import { isAnswerAcceptable } from '@/lib/utils/answerMatching';

// For short_answer and fill_blank questions
isCorrect = isAnswerAcceptable(
  userAnswer,
  correctQuestion.correct_answer,
  currentQuestion.acceptable_answers, // optional alternatives
  grade // 4, 5, or 6
);
```

## Benefits for Young Learners

### Age-Appropriate Flexibility
- **Grade 4**: Most forgiving - focuses on general understanding
- **Grade 5**: Balanced - encourages accuracy while allowing minor mistakes
- **Grade 6**: Stricter - prepares for more rigorous assessments

### Pedagogical Advantages
1. **Reduces frustration** - Students aren't penalized for minor typos
2. **Encourages attempts** - Less fear of being marked wrong
3. **Focuses on understanding** - Content knowledge over perfect spelling
4. **Builds confidence** - More answers accepted = more positive reinforcement

### What's Still Required
- Understanding of the concept (similarity threshold ensures this)
- Reasonable spelling attempt (completely wrong words still rejected)
- Relevant answer (contains strategy catches explanatory text but not unrelated content)

## Testing Strategy

### Manual Testing Examples

```typescript
import { isAnswerCorrect, getAnswerFeedback } from '@/lib/utils/answerMatching';

// Grade 4 student
console.log(isAnswerCorrect('fotosynteesi', 'fotosynteesin', 4)); // true
console.log(isAnswerCorrect('fotosyntes', 'fotosynteesin', 4));   // false (too different)

// Grade 6 student
console.log(isAnswerCorrect('fotosynteesi', 'fotosynteesin', 6)); // true (still 92% similar)
console.log(isAnswerCorrect('fotosintes', 'fotosynteesin', 6));   // false (only 83% similar)

// Debugging feedback
const feedback = getAnswerFeedback('fotosynteesi', 'fotosynteesin', 4);
console.log(feedback);
// {
//   isCorrect: true,
//   similarity: 0.923,
//   threshold: 0.75,
//   method: 'fuzzy'
// }
```

## Future Enhancements

Potential improvements for future versions:

1. **Finnish-specific rules**
   - Handle common conjugations (vesi → veden, vettä)
   - Account for compound words
   - Support dialect variations

2. **Contextual matching**
   - Recognize synonyms (iso → suuri)
   - Accept related terms for science/history questions

3. **Adaptive thresholds**
   - Track individual student patterns
   - Adjust based on question difficulty
   - Consider time spent on question

4. **Feedback to students**
   - Show similarity percentage (optional)
   - Highlight accepted vs rejected parts
   - Suggest corrections for learning

## Migration Notes

**Breaking Change**: None
- Existing exact matches still work
- Only adds acceptance of near-matches
- Backwards compatible

**Database**: No changes required
- Works with existing question schema
- Uses `acceptable_answers` field if present

**Performance**: Negligible impact
- O(n*m) complexity for Levenshtein (typical n,m < 20)
- ~1ms per answer check on modern hardware
- Caching not needed for real-time gameplay
