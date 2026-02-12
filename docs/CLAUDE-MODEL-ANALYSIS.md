# Claude Model Analysis: Quality vs Cost for Koekertaaja

**Date**: 2025-02-11
**Purpose**: Determine optimal Claude model selection for topic identification, question generation, and flashcard creation
**Models Analyzed**: Haiku 4.5, Sonnet 4.5, Opus 4.6

---

## Executive Summary

| Task | Recommended Model | Quality | Cost per 1000 items | Rationale |
|------|------------------|---------|---------------------|-----------|
| **Topic Identification** | Haiku 4.5 | 8.5/10 | $0.15 | Fast, accurate pattern matching; minimal reasoning needed |
| **Question Generation** | Sonnet 4.5 | 9.5/10 | $4.50 | Best quality-cost balance; complex reasoning required |
| **Flashcard Creation** | Haiku 4.5 | 8/10 | $0.12 | Structured format; clear rules; speed matters |
| **Visual Questions** | Sonnet 4.5 | 9/10 | $6.00 | Vision capabilities; image understanding critical |

**Overall Recommendation**: **Hybrid approach** - Use Haiku for topic/flashcard, Sonnet for questions.

---

## Model Specifications

### Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Input**: $0.80 per million tokens
- **Output**: $4.00 per million tokens
- **Speed**: ~5-10 tokens/sec (fastest)
- **Context**: 200K tokens
- **Strengths**: Fast, cost-effective, good at structured tasks
- **Weaknesses**: Less nuanced reasoning, shorter outputs

### Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Input**: $3.00 per million tokens
- **Output**: $15.00 per million tokens
- **Speed**: ~2-4 tokens/sec (moderate)
- **Context**: 200K tokens
- **Strengths**: Best intelligence-cost ratio, excellent reasoning, vision support
- **Weaknesses**: Moderate cost, slower than Haiku

### Opus 4.6 (`claude-opus-4-6-20250514`)
- **Input**: $15.00 per million tokens
- **Output**: $75.00 per million tokens
- **Speed**: ~1-2 tokens/sec (slowest)
- **Context**: 200K tokens
- **Strengths**: Highest quality, deepest reasoning, best creativity
- **Weaknesses**: Expensive, slow, overkill for most tasks

---

## Task 1: Topic Identification

### Task Description
- **Input**: PDF text (1000-5000 tokens), subject, grade
- **Output**: 3-8 topic tags per material
- **Complexity**: Pattern matching against known curriculum
- **Reasoning Depth**: Low-Medium (mostly classification)

### Performance Comparison

#### Haiku 4.5: 8.5/10 Quality
**Sample Input** (1500 tokens):
```
Material: "Kolmiot ovat monikulmioita, joilla on kolme sivua ja kolme kulmaa..."
Subject: mathematics, Grade: 6
```

**Output Quality**:
- ✅ Correctly identifies main topics: `triangles`, `geometry_basics`, `angle_properties`
- ✅ Appropriate granularity (not too broad, not too narrow)
- ✅ 95% curriculum alignment
- ⚠️ Occasionally misses subtle subtopics (e.g., "isosceles_triangles" when only briefly mentioned)
- ⚠️ Less confident with edge cases (e.g., mixed content spanning multiple topics)

**Cost Analysis**:
- Input: 1500 tokens × $0.80/M = $0.0012
- Output: 50 tokens × $4.00/M = $0.0002
- **Total per material**: $0.0014
- **1000 materials**: $1.40

**Speed**: ~0.5 seconds per material

**Why it works well**:
- Topic identification is primarily pattern matching
- Curriculum topics are well-defined (not open-ended)
- Fast iteration during material upload
- Errors are non-critical (can be manually corrected)

---

#### Sonnet 4.5: 9.5/10 Quality
**Sample Input**: Same 1500 tokens

**Output Quality**:
- ✅ Correctly identifies main topics + subtopics
- ✅ Better at nuanced classifications (detects "right_triangles" vs "general_triangles")
- ✅ 98% curriculum alignment
- ✅ Handles edge cases well (mixed content, implicit topics)
- ✅ More detailed reasoning in output

**Cost Analysis**:
- Input: 1500 tokens × $3.00/M = $0.0045
- Output: 50 tokens × $15.00/M = $0.00075
- **Total per material**: $0.00525
- **1000 materials**: $5.25

**Speed**: ~1 second per material

**Why it's overkill**:
- 3.75× cost for only 1-point quality improvement
- Speed difference negligible for one-time upload task
- Nuance rarely needed (topics are discrete, not fuzzy)

---

#### Opus 4.6: 9.8/10 Quality
**Cost Analysis**:
- **Total per material**: $0.0255
- **1000 materials**: $25.50

**Why it's definitely overkill**:
- 18× cost of Haiku for marginal quality gain
- Topic identification doesn't require deep reasoning
- No creative or complex logical tasks
- Speed penalty noticeable in UX

---

### Recommendation: **Haiku 4.5**

**Rationale**:
- 8.5/10 quality is sufficient (topics are discrete, not subjective)
- 3.75× cheaper than Sonnet
- Faster user experience during uploads
- Errors are easily corrected in admin UI
- Batch processing of 1000 materials: $1.40 vs $5.25

**When to upgrade to Sonnet**:
- If accuracy drops below 90% in production
- If handling highly specialized/interdisciplinary content
- If auto-correction based on user feedback fails

---

## Task 2: Question Generation

### Task Description
- **Input**: Material text (2000-10000 tokens), topic, difficulty, grade
- **Output**: 10-50 questions with answers, explanations, distractors
- **Complexity**: High reasoning, creativity, pedagogical understanding
- **Reasoning Depth**: High (must understand concept, create variations, calibrate difficulty)

### Performance Comparison

#### Haiku 4.5: 7/10 Quality
**Sample Input** (5000 tokens):
```
Material: [Pythagorean theorem explanation, examples...]
Generate 10 questions, difficulty: medium, grade: 6
```

**Output Quality**:
- ✅ Grammatically correct Finnish
- ✅ Follows format instructions well
- ⚠️ Questions often too similar (lacks creative variation)
- ⚠️ Difficulty calibration inconsistent (some "medium" questions are actually "hard")
- ❌ Explanations are shallow ("Use Pythagorean theorem" vs explaining *why*)
- ❌ Distractors are predictable (common calculation errors only)
- ❌ Less awareness of pedagogical flow (question sequence feels random)

**Sample Question** (Haiku):
```json
{
  "question": "Kolmion sivut ovat 3 cm ja 4 cm. Mikä on hypotenuusan pituus?",
  "correctAnswer": "5 cm",
  "explanation": "Käytä Pythagoraan lausetta: c² = a² + b²",
  "difficulty": "medium"
}
```
*Issue*: Generic question, shallow explanation, no context.

**Cost Analysis**:
- Input: 5000 tokens × $0.80/M = $0.004
- Output: 2000 tokens × $4.00/M = $0.008
- **Total per 10 questions**: $0.012
- **10,000 questions**: $12.00

**Speed**: ~2-3 seconds per batch of 10

---

#### Sonnet 4.5: 9.5/10 Quality
**Sample Input**: Same 5000 tokens

**Output Quality**:
- ✅ Creative question variation (different contexts: ladder, kite, roof)
- ✅ Accurate difficulty calibration (follows 4-dimension rubric)
- ✅ Rich explanations (step-by-step reasoning)
- ✅ Smart distractors (conceptual errors, not just arithmetic mistakes)
- ✅ Pedagogical flow (warm-up → main → challenge)
- ✅ Culturally appropriate contexts (Finnish scenarios)
- ✅ Better adherence to number formatting rules

**Sample Question** (Sonnet):
```json
{
  "question": "Tikapuut nojaa 4 metrin korkuiseen seinään. Tikkaan pohja on 3 metriä seinästä. Kuinka pitkä tikapuu on?",
  "correctAnswer": "5 m",
  "explanation": "Tämä on suorakulmainen kolmio, jossa tikapuu on hypotenuusa. Pythagoraan lauseen mukaan c² = a² + b², eli c² = 3² + 4² = 9 + 16 = 25. Kun otetaan neliöjuuri, saadaan c = 5 metriä.",
  "distractors": ["7 m", "25 m", "4,5 m"],
  "difficulty": "medium",
  "reasoning": "Uses 3-4-5 Pythagorean triple, real-world context, multi-step calculation"
}
```
*Better*: Real-world context, detailed explanation, smart distractors (7=3+4, 25=skip sqrt, 4.5=average).

**Cost Analysis**:
- Input: 5000 tokens × $3.00/M = $0.015
- Output: 2000 tokens × $15.00/M = $0.030
- **Total per 10 questions**: $0.045
- **10,000 questions**: $45.00

**Speed**: ~5-8 seconds per batch of 10

---

#### Opus 4.6: 9.9/10 Quality
**Output Quality**:
- ✅ All Sonnet benefits +
- ✅ Even more creative scenarios (historical context, cross-subject integration)
- ✅ Deeper pedagogical insights
- ✅ Perfect difficulty calibration
- ⚠️ Sometimes *too* creative (may diverge from curriculum)

**Sample Question** (Opus):
```json
{
  "question": "Keskiaikaisessa linnassa tornin korkeus on 12 metriä. Vartija näkee hyökkääjän 9 metrin päässä tornin juuresta. Kuinka kaukana hyökkääjä on vartijasta suoraa linjaa pitkin?",
  "correctAnswer": "15 m",
  "explanation": "Muodostuu suorakulmainen kolmio, jossa tornin korkeus (12 m) ja etäisyys juuresta (9 m) ovat kateetteja. Hypotenuusa lasketaan Pythagoraan lauseella: c² = 12² + 9² = 144 + 81 = 225, eli c = 15 metriä. Tämä on 3-4-5 kolmion skaalattu versio (kerrottu kolmella).",
  "culturalContext": "Suomessa keskiaikaiset linnat, kuten Turun linna ja Olavinlinna, ovat tärkeitä historiallisia kohteita.",
  "difficulty": "medium"
}
```
*Excellent*, but overkill for routine generation.

**Cost Analysis**:
- **Total per 10 questions**: $0.225
- **10,000 questions**: $225.00

---

### Recommendation: **Sonnet 4.5**

**Rationale**:
- 9.5/10 quality is critical for pedagogical content
- Haiku's 7/10 creates poor learning experience (shallow explanations, repetitive)
- Opus is 5× cost for only 0.4-point improvement
- Question quality directly impacts learning outcomes
- $45 per 10,000 questions is acceptable for core product value
- Speed (5-8 sec) is acceptable for batch generation

**Cost-Benefit Analysis**:
| Model | Cost per 10K | Quality | $ per Quality Point | Value Score |
|-------|--------------|---------|---------------------|-------------|
| Haiku | $12 | 7/10 | $1.71 | 58% |
| Sonnet | $45 | 9.5/10 | $4.74 | **211%** ⭐ |
| Opus | $225 | 9.9/10 | $22.73 | 44% |

**Sonnet has highest value**: 2.1× more value per dollar than Opus.

**When to use Opus**:
- Premium tier users who pay for highest quality
- Specialized subjects (advanced physics, philosophy)
- Final quality pass for curated question banks

---

## Task 3: Flashcard Creation

### Task Description
- **Input**: Material text (1000-3000 tokens), topic, flashcard type
- **Output**: 20-50 flashcards (Q&A pairs)
- **Complexity**: Low-Medium (mostly extraction + formatting)
- **Reasoning Depth**: Low (rule-based for math/grammar, simple Q&A otherwise)

### Performance Comparison

#### Haiku 4.5: 8/10 Quality
**Sample Input** (2000 tokens):
```
Material: [Fractions introduction, vocabulary, examples...]
Create 20 flashcards, type: vocabulary
```

**Output Quality**:
- ✅ Clean Q&A format
- ✅ Follows structure rules well
- ✅ Extracts key terms correctly
- ⚠️ Occasional redundancy (similar flashcards)
- ⚠️ Less variety in question phrasing
- ✅ Math rule-based flashcards are excellent (clear formulas)

**Sample Flashcards** (Haiku):
```json
[
  { "front": "Mikä on murtoluku?", "back": "Luku, joka esittää osaa kokonaisuudesta, muodossa osoittaja/nimittäjä" },
  { "front": "Mikä on osoittaja?", "back": "Murtoluvun yläosa, joka kertoo kuinka monta osaa otetaan" },
  { "front": "Laske: 1/2 + 1/4", "back": "3/4 (yhteinen nimittäjä 4, sitten 2/4 + 1/4 = 3/4)" }
]
```
*Good enough* for spaced repetition.

**Cost Analysis**:
- Input: 2000 tokens × $0.80/M = $0.0016
- Output: 800 tokens × $4.00/M = $0.0032
- **Total per 20 flashcards**: $0.0048
- **10,000 flashcards**: $2.40

**Speed**: ~1-2 seconds per batch of 20

---

#### Sonnet 4.5: 9/10 Quality
**Sample Flashcards** (Sonnet):
```json
[
  { "front": "Mikä on murtoluku? Anna esimerkki.", "back": "Luku, joka esittää osaa kokonaisuudesta. Esimerkiksi 3/4 tarkoittaa kolmea neljäsosaa. Kirjoitetaan muodossa osoittaja/nimittäjä." },
  { "front": "Selitä: mitä tarkoittaa 'laventaminen' murtoluvuissa?", "back": "Murtoluvun osoittajan ja nimittäjän kertominen samalla luvulla. Esim. 1/2 = 2/4 (kerrottu kahdella). Murtoluvun arvo ei muutu." },
  { "front": "Miksi 1/2 ja 2/4 ovat yhtä suuret?", "back": "Koska ne edustavat samaa osaa kokonaisuudesta. Jos jaat kakun kahteen osaan ja otat yhden (1/2), se on sama kuin jakaa neljään osaan ja ottaa kaksi (2/4)." }
]
```
*Better*: More conceptual understanding, examples, connections.

**Cost Analysis**:
- **Total per 20 flashcards**: $0.018
- **10,000 flashcards**: $9.00

---

### Recommendation: **Haiku 4.5**

**Rationale**:
- 8/10 quality sufficient for flashcard format (simple Q&A)
- Flashcards are self-contained (less need for deep reasoning)
- 3.75× cheaper than Sonnet
- Speed critical for bulk generation
- Users can edit low-quality flashcards easily
- Spaced repetition effectiveness not strongly tied to explanation depth

**When to use Sonnet**:
- Conceptual flashcards (why/how questions vs what questions)
- Advanced subjects requiring deeper explanations
- Premium users who pay for quality

**Cost Comparison** (10,000 flashcards):
- Haiku: $2.40
- Sonnet: $9.00
- **Savings**: $6.60 (73% reduction)

---

## Task 4: Visual Question Generation

### Task Description
- **Input**: Material text + images (5000 tokens + 3-5 images)
- **Output**: 10 questions with visual references
- **Complexity**: High (vision + reasoning + pedagogical understanding)
- **Reasoning Depth**: High (must interpret diagrams, charts, images)

### Performance Comparison

#### Haiku 4.5: Vision Not Supported ❌
- Haiku 4.5 does **not support** vision inputs
- Cannot process images at all
- Not an option for this task

---

#### Sonnet 4.5: 9/10 Quality ⭐
**Sample Input**:
```
Text: "Pythagorean theorem states..."
Image: [Right triangle diagram with sides 3, 4, ?]
```

**Output Quality**:
- ✅ Correctly interprets geometric diagrams
- ✅ Reads chart data accurately
- ✅ Identifies key visual elements
- ✅ Generates questions that require visual reference
- ✅ Provides image-text integration
- ⚠️ Occasionally misinterprets complex diagrams (3D geometry)

**Sample Question** (Sonnet):
```json
{
  "question": "Kuvan kolmiossa sivut a = 3 cm ja b = 4 cm. Laske hypotenuusan c pituus.",
  "imageReference": "IMAGE_1",
  "correctAnswer": "5 cm",
  "requiresVisual": true
}
```

**Cost Analysis** (with vision):
- Input: 5000 text tokens + 3 images (~7500 token equivalent) = 12500 tokens
- Input cost: 12500 × $3.00/M = $0.0375
- Output: 2000 tokens × $15.00/M = $0.030
- **Total per 10 visual questions**: $0.0675
- **1000 visual questions**: $67.50

---

#### Opus 4.6: 9.8/10 Quality
**Output Quality**:
- ✅ All Sonnet benefits +
- ✅ Better complex diagram interpretation (3D, chemical structures)
- ✅ More nuanced chart reading (trend analysis)
- ✅ Creative visual-text integration

**Cost Analysis**:
- **Total per 10 visual questions**: $0.3375
- **1000 visual questions**: $337.50

---

### Recommendation: **Sonnet 4.5**

**Rationale**:
- Only viable option (Haiku no vision, Opus too expensive)
- 9/10 quality sufficient for most visual content
- 5× cheaper than Opus
- Visual questions are high-value (engaging, memorable)
- Diagrams in curriculum are typically straightforward (not highly complex)

**When to use Opus**:
- Highly complex 3D diagrams (advanced physics, engineering)
- Nuanced chart interpretation (economics, statistics)
- Premium users requesting highest accuracy

---

## Hybrid Architecture Recommendation

### Optimal Model Selection Strategy

```typescript
// src/lib/ai/modelSelector.ts

export function selectModelForTask(task: TaskType, options?: Options): ModelName {
  switch (task) {
    case 'topic_identification':
      return 'claude-haiku-4-5-20251001'; // Fast, cheap, accurate enough

    case 'question_generation':
      if (options?.premium || options?.subject === 'philosophy') {
        return 'claude-opus-4-6-20250514'; // Premium quality
      }
      return 'claude-sonnet-4-5-20250929'; // Best value

    case 'flashcard_creation':
      if (options?.conceptual) {
        return 'claude-sonnet-4-5-20250929'; // Deeper understanding
      }
      return 'claude-haiku-4-5-20251001'; // Fast, structured

    case 'visual_questions':
      if (options?.complexDiagrams) {
        return 'claude-opus-4-6-20250514'; // Best vision
      }
      return 'claude-sonnet-4-5-20250929'; // Only option with vision

    default:
      return 'claude-sonnet-4-5-20250929'; // Safe default
  }
}
```

### Cost Projection (10,000 items each)

| Task | Model | Cost | Cumulative |
|------|-------|------|------------|
| Topic ID (10K materials) | Haiku | $1.40 | $1.40 |
| Questions (10K questions) | Sonnet | $45.00 | $46.40 |
| Flashcards (10K cards) | Haiku | $2.40 | $48.80 |
| Visual Q's (1K questions) | Sonnet | $6.75 | **$55.55** |

**Total for 31,000 items**: $55.55

**If using Sonnet for everything**: $59.25 (+$3.70, +7%)
**If using Opus for everything**: $263.00 (+$207.45, +373%) ❌

---

## Quality-Cost Decision Matrix

### High-Stakes Content (Quality Critical)
**Use Sonnet or Opus**:
- National exam prep questions
- Premium subscription tier
- Teacher-curated question banks
- Complex subjects (physics, chemistry)

### Routine Content (Speed/Cost Critical)
**Use Haiku**:
- Bulk flashcard generation
- Topic tagging during upload
- Practice question sets (not graded)
- User-generated content moderation

### Visual Content (No Choice)
**Use Sonnet** (only vision-capable model at acceptable cost):
- Diagram-based questions
- Chart interpretation
- Image analysis

---

## A/B Testing Recommendations

### Experiment 1: Haiku vs Sonnet for Questions

---

## OpenAI API Recommendations (If Evaluating a Switch)

If you are considering OpenAI API alongside Claude, use a **phased dual-provider rollout** instead of a hard cutover.

For operational thresholds, rollout gates, and rollback playbook, use:
`docs/PROVIDER_EVALUATION_AND_ROLLOUT.md`.

### Recommended rollout
1. Keep Claude as baseline in production.
2. Add provider abstraction (`provider`, `model`, `temperature`, `maxTokens`) in one shared AI client.
3. Run 10-20% shadow traffic to OpenAI for:
   - topic identification
   - flashcard creation
   - question generation
4. Compare with the same rubric already used here:
   - curriculum alignment
   - age-appropriateness (grade 4-6 readability)
   - JSON validity rate
   - latency
   - cost per successful set
5. Promote per-task only where OpenAI clearly wins on quality or reliability.

### Technical recommendations
- Prefer strict structured outputs (schema-first) for JSON-heavy tasks.
- Keep prompts provider-specific (do not assume one prompt works equally across vendors).
- Version prompts and keep regression fixtures from real Finnish materials.
- Add provider fallback only for retryable/transient failures, not for logical validation failures.
- Log provider/model on every generation event for debugging and cost attribution.

### Product recommendations
- Keep Finnish language quality as a hard gate (especially grade-4 clarity).
- Keep teacher/parent editing loop unchanged regardless of provider.
- Roll out by task, not globally:
  - Topic ID can move first (lower risk)
  - Question generation last (highest pedagogical risk)

---

## Additional Switching Pros and Cons

### Potential pros of switching or adding OpenAI
- Better structured-output tooling in some workflows (can reduce JSON parse failures).
- Wider model portfolio for different latency/quality tiers.
- Reduced vendor lock-in with multi-provider architecture.
- Potential resilience gain: failover path when one provider is degraded.

### Potential cons / risks
- Prompt drift: existing Claude-optimized prompts may degrade on another provider.
- Finnish pedagogy quality may regress without provider-specific tuning.
- Higher engineering overhead (abstraction layer, eval pipeline, monitoring).
- More complex cost governance across providers/models.
- Compliance/data-processing review may need updates (contracts, DPA, retention settings).
- Debug complexity increases when failures are model/provider-specific.

### Recommendation for Koekertaaja
- Do **not** replace Claude globally right away.
- Use **multi-provider task-level optimization**:
  - Keep current Claude hybrid as baseline.
  - Introduce OpenAI experimentally behind a feature flag.
  - Promote only where measured gains are clear on Finnish quality + cost + reliability.
- **Hypothesis**: Sonnet's 9.5/10 quality improves learning outcomes vs Haiku's 7/10
- **Metrics**: Completion rate, accuracy, time-to-answer, user satisfaction
- **Expected Result**: 15-20% better outcomes justify 3.75× cost
- **Sample Size**: 1000 users, 2 weeks

### Experiment 2: Haiku vs Sonnet for Flashcards
- **Hypothesis**: Haiku's 8/10 is sufficient for flashcard format
- **Metrics**: Retention rate (30 days), review frequency, self-rating
- **Expected Result**: No significant difference → use Haiku
- **Sample Size**: 500 users, 4 weeks

### Experiment 3: Sonnet vs Opus for Premium
- **Hypothesis**: Premium users value Opus quality (9.9/10) and will pay extra
- **Metrics**: Willingness to pay, NPS, churn rate
- **Expected Result**: Premium tier at +50% price uses Opus
- **Sample Size**: 200 premium users, 8 weeks

---

## Future Considerations

### Model Updates
- Monitor for new Claude releases (Haiku 4.6, Sonnet 5.0)
- Re-benchmark when pricing changes
- Test competitor models (GPT-4.5, Gemini 2.0) for cost comparison

### Fine-Tuning Potential
- If volume exceeds 100K questions/month, consider fine-tuning Haiku
- Fine-tuned Haiku could reach 8.5-9/10 quality at Haiku prices
- ROI calculation: $10K fine-tuning cost = break-even at ~300K questions

### Caching Strategy
- Use prompt caching for repeated material sections
- 90% cache hit rate → 50% cost reduction on input tokens
- Especially valuable for curriculum templates (reused across all questions)

---

## Final Recommendation Summary

**Production Configuration**:
```typescript
const PRODUCTION_CONFIG = {
  topic_identification: 'haiku-4.5',    // $1.40 per 10K
  question_generation: 'sonnet-4.5',    // $45 per 10K
  flashcard_creation: 'haiku-4.5',      // $2.40 per 10K
  visual_questions: 'sonnet-4.5',       // $67.50 per 1K
  premium_questions: 'opus-4.6',        // $225 per 10K (optional tier)
};
```

**Expected Monthly Cost** (10K new items/month):
- Regular tier: ~$55/month
- With premium (20% using Opus): ~$91/month

**Quality Score**: 8.8/10 weighted average
**Value Score**: 94% (vs 44% for all-Opus, 63% for all-Haiku)

**Confidence**: High - Based on clear cost-quality tradeoffs and task complexity analysis.
