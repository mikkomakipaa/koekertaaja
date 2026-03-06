# AI Prompt System Review - Analysis from Claude's Perspective

**Date:** 2026-02-11
**Reviewer:** Claude Sonnet 4.5 (Self-Analysis)
**Scope:** Question and flashcard generation system prompts

---

## Executive Summary

### ✅ What Works Well

1. **Clear JSON structure** - Format specification is unambiguous
2. **Topic identification** - Enhanced topic analysis with metadata is sophisticated
3. **Rule-based flashcards** - Clear distinction between calculation vs. rule explanation
4. **Explanation style** - Direct student address ("sinä") is well-specified
5. **Curriculum integration** - Grade-specific content provides good context

### ⚠️ Major Issues

1. **Rigid distributions contradict flexibility guidance** - Conflicting instructions
2. **Flashcard type confusion** - Artificial split into 3 types doesn't match traditional use
3. **Topic vs. Skill boundaries unclear** - Overlapping definitions cause confusion
4. **Missing question type selection guidance** - When to use sequential vs. fill_blank?
5. **Distribution enforcement unclear** - "MUST" vs. "guidance" mixed messages

### 🎯 Tailor-Made Content Quality

**Current Score: 7/10**

- ✅ Material is analyzed and topics identified accurately
- ✅ Grade-appropriate vocabulary and concepts
- ✅ Questions stay within provided material
- ⚠️ Distribution rigidity limits natural question formation
- ⚠️ Topic tagging sometimes arbitrary when material doesn't fit predefined topics
- ❌ Sequential questions underutilized due to 15% limit

---

## Detailed Analysis

## 1. Topic Identification System

### ✅ Strengths

**Enhanced Topic Analysis (topicIdentifier.ts):**
```typescript
{
  "name": "Pinta-alat",
  "coverage": 0.45,          // Clear percentage allocation
  "difficulty": "normaali",  // Per-topic difficulty
  "keywords": [...],         // Specific terms for question generation
  "subtopics": [...],        // Hierarchical structure
  "importance": "high"       // Priority guidance
}
```

**Why this works:**
- Coverage percentages (sum to 1.0) give clear distribution targets
- Keywords provide concrete terms to use in questions
- Subtopics allow for nuanced question variation
- Difficulty per topic allows tailored question complexity

### ⚠️ Weaknesses

**Problem 1: Coverage enforcement is rigid**
```
Prompt says: "~{{questions_per_topic}} kysymystä per aihealue"
              "Sallittu vaihtelu: ±1 kysymys per aihealue"
```

**AI perspective:**
- If material has 45% geometry, 35% arithmetic, 20% fractions
- And we need 20 questions
- System forces: 9 geometry, 7 arithmetic, 4 fractions
- **But:** What if geometry material only has 6 good question opportunities?
- **Result:** I'm forced to create 3 mediocre/repetitive questions to hit quota

**Better approach:**
- Use coverage as **guidance** not strict requirement
- Allow ±2-3 questions variance
- Prioritize quality over hitting exact numbers

**Problem 2: Topic names must match EXACTLY**
```
Prompt: "ÄLÄ KEKSI UUSIA AIHEALUEITA"
        "KÄYTÄ TÄSMÄLLEEN SAMAA KIRJOITUSASUA"
```

**AI perspective:**
- Identified topic: "Pinta-alat ja tilavuudet"
- I generate question about volume
- Should I tag as "Pinta-alat ja tilavuudet" or create subtopic?
- **Current system:** Forbids nuance
- **Better:** Allow subtopics to be more specific: topic="Pinta-alat ja tilavuudet", subtopic="Kuution tilavuus"

### 💡 Recommendations

1. **Relax exact topic matching:**
   ```
   OLD: "KÄYTÄ TÄSMÄLLEEN SAMAA KIRJOITUSASUA"
   NEW: "Use identified topics as primary categories. Use subtopic field for specifics."
   ```

2. **Change coverage from strict to guidance:**
   ```
   OLD: "Sallittu vaihtelu: ±1 kysymys per aihealue"
   NEW: "Target distribution based on coverage, but prioritize question quality.
         Variance of ±25% per topic is acceptable if material supports it."
   ```

3. **Add materiality check:**
   ```
   NEW: "If a topic has insufficient material for its target question count,
         redistribute to topics with richer content rather than forcing low-quality questions."
   ```

---

## 2. Question Type Distribution System

### ❌ Major Problem: Contradictory Instructions

**The conflict:**

**Instruction A (Rigid):**
```
"NOUDATA TARKASTI vaikeustason kysymystyyppien jakaumaa"
Distribution: fill_blank: 60%, short_answer: 30%, matching: 10%
```

**Instruction B (Flexible):**
```
"Jakauma on suuntaa-antava: valitse sopivin kysymystyyppi sisällön mukaan"
```

**AI perspective:**
- Which instruction takes precedence?
- If material is a timeline (clearly sequential content), can I use 40% sequential?
- Current answer: Unclear, I default to rigid interpretation to be safe
- **Result:** Timeline material forced into fill_blank format

### ⚠️ Specific Issues

**Issue 1: Sequential underutilization**

Material: "Water cycle: 1. Evaporation 2. Condensation 3. Precipitation 4. Collection"

**Current prompt says:**
```
"Historian aikajanoissa pyri noin 15% sequential-kysymyksiin"
```

**AI analysis:**
- This is PERFECT sequential material (ordered process)
- But I can only use 15% sequential (3 out of 20 questions)
- The other 17 questions will be awkwardly forced into other formats
- **Result:** "Täydennä: Water cycle step 2 is ___" instead of natural "Order these steps"

**Better approach:**
```
"Use sequential format when material has clear chronological or process-based structure.
 For timeline/process-heavy material, sequential questions can be 30-50% of total.
 For other material, use sparingly (5-15%)."
```

**Issue 2: Fill_blank overuse**

Current flashcard distribution:
```json
{
  "fill_blank": 60,
  "short_answer": 30,
  "matching": 10
}
```

**AI perspective:**
- Vocabulary: "What is 'cat' in Finnish?" → Natural as short_answer or fill_blank
- Grammar rule: "How do you form past tense?" → Should be short_answer
- But I'm forced to make 60% fill_blank
- **Result:** Awkward constructions like "Past tense is formed by ___" when "How do you form past tense?" is more natural

**Issue 3: Flashcard type split is artificial**

Traditional flashcard:
```
Front: "What is the capital of Finland?"
Back: "Helsinki"
```

Current system forces:
```
Type 1 (fill_blank): "The capital of Finland is ___" → "Helsinki"
Type 2 (short_answer): "What is the capital of Finland?" → "Helsinki"
Type 3 (matching): Match countries with capitals → Finland:Helsinki
```

**AI perspective:**
- All three test the same knowledge
- I'm required to create artificial variations to hit percentages
- Traditional flashcards don't have "types" - they're just Q&A pairs
- **Recommendation:** See task-131 (simplify to single flashcard type)

### 💡 Recommendations

**1. Remove rigid distribution enforcement:**

```typescript
// OLD (Rigid):
"TÄRKEÄÄ: Sinun TÄYTYY noudattaa kysymystyyppien jakaumaa TÄSMÄLLEEN:"

// NEW (Guidance):
"AVAILABLE QUESTION TYPES AND WHEN TO USE THEM:

1. multiple_choice: Best for concepts, comparisons, classifications
   - Use when: 3-4 plausible wrong answers exist
   - Example: 'Which country is in Europe? A) Finland B) Brazil C) Japan D) Australia'

2. fill_blank: Best for vocabulary, formulas, single-word answers
   - Use when: One specific word/phrase completes the sentence
   - Example: 'The capital of Finland is ___'

3. sequential: Best for timelines, processes, ordered steps
   - Use when: Material has inherent order (chronological, logical steps)
   - Example: 'Order the water cycle steps: A) Precipitation B) Evaporation C) Condensation'
   - For process-heavy material, can be 30-50% of questions

4. short_answer: Best for explanations, 'why/how' questions
   - Use when: Answer requires explanation not single word
   - Example: 'Why do leaves change color in fall?'

5. true_false: Best for fact verification, misconceptions
   - Use when: Statement can be clearly true or false
   - Example: 'Finland joined EU in 1995. True or false?'

6. matching: Best for pairs (word-translation, country-capital, formula-name)
   - Use when: Multiple related pairs exist in material
   - Minimum 4 pairs required

INSTRUCTIONS:
- Analyze each piece of material and choose the MOST APPROPRIATE type
- Aim for VARIETY - avoid >60% of any single type
- Typical distributions (for reference, NOT strict requirements):
  * Language: 40% fill_blank, 30% multiple_choice, 20% short_answer, 10% other
  * Math: 50% fill_blank, 30% multiple_choice, 20% other
  * History: 35% multiple_choice, 25% sequential, 20% fill_blank, 20% other
  * Process/timeline material: Can use 30-50% sequential
"
```

**2. Add post-generation variety check:**

Instead of enforcing upfront, validate after generation:
```typescript
function validateVariety(questions: Question[]): ValidationWarning[] {
  const typeCounts = countByType(questions);
  const warnings = [];

  // Warn if one type dominates (>70%)
  if (any type > 70%) warnings.push(`Consider more variety...`);

  // Warn if sequential underused for timeline material
  if (hasTimelineContent && sequential < 20%) warnings.push(`Timeline material could use more sequential questions...`);

  return warnings;
}
```

---

## 3. Topic vs. Skill Distinction

### ⚠️ Current Problem: Overlapping Definitions

**Language subject example:**

Prompt says:
```
Topic = sisältö/teema (esim. "Koulu", "Matkustaminen", "Perhe")
Skill = kielitaito (esim. "verb_tenses", "word_meaning")
```

**AI confusion:**

Question: "Complete: I ___ to school every day. (go)"

Should I tag as:
- Topic: "School" (content theme) + Skill: "verb_tenses" (language skill)
- OR Topic: "Present Simple" (grammar topic) + Skill: "conjugation"?

**Current guidance is unclear** when topic is grammatical content.

### ⚠️ Math subject example:

Question: "Calculate the area of a rectangle with sides 4m and 6m"

- Topic: "Pinta-alat" (identified from material)
- Skill: Should this be "area_calculation", "multiplication", or "geometry"?

**Problem:** Skill taxonomy doesn't clearly map to topics

### 💡 Recommendations

**1. Clarify hierarchy:**

```
TOPIC HIERARCHY:

Level 1 - Content Area (from material analysis):
  - Use the identified topics from topic identification step
  - Example: "Geometry", "Verb Tenses", "World War II"

Level 2 - Subtopic (optional, more specific):
  - Refine the content area
  - Example: topic="Geometry" subtopic="Rectangle areas"

Level 3 - Skill (cognitive/procedural ability being tested):
  - What mental operation is required?
  - Example: "calculation", "recall", "comprehension", "application"

EXAMPLES:

Question: "What is 4 × 6?"
- topic: "Pinta-alat" (from identified topics)
- subtopic: "Suorakulmio" (specific shape)
- skill: "multiplication" (operation being tested)

Question: "Complete: I ___ to school. (go)"
- topic: "Daily Routines" (from identified topics)
- subtopic: "School life" (optional)
- skill: "verb_tenses" (grammar skill being tested)

Question: "Why did the Roman Empire fall?"
- topic: "Ancient Rome" (from identified topics)
- subtopic: "Fall of Rome" (specific event)
- skill: "cause_effect" (analytical skill)
```

**2. Provide skill selection flowchart:**

```
SKILL SELECTION GUIDE:

1. What does the student DO to answer?

   Calculate/Compute → Skills: multiplication, division, addition, subtraction,
                               area_calculation, volume_calculation

   Recall fact → Skills: recall, factual_knowledge, memorization

   Understand concept → Skills: comprehension, conceptual_understanding

   Apply rule/formula → Skills: application, formula_application, grammar_application

   Analyze/Explain → Skills: analysis, cause_effect, critical_thinking

   Create/Produce → Skills: writing, composition, creative_expression

   Identify/Recognize → Skills: identification, classification, pattern_recognition

2. Pick the MOST SPECIFIC skill that fits

3. When in doubt:
   - Math: Focus on operation (multiplication, area_calculation)
   - Language: Focus on grammar skill (verb_tenses, word_meaning)
   - History/Social: Focus on cognitive skill (recall, cause_effect, analysis)
   - Science: Focus on scientific skill (observation, hypothesis, experiment)
```

---

## 4. Rule-Based Flashcards

### ✅ This Works Very Well

The rule-based flashcard format is **one of the best parts** of the current system.

**Clear instructions:**
```
KYSYMYKSEN MUOTO:
- Kysy "miten" tai "mikä"-kysymyksiä
- Keskity sääntöön/konseptiin, ÄLÄ tiettyyn laskutehtävään
- Esimerkki: "Miten lasketaan suorakulmion pinta-ala?"

VASTAUKSEN MUOTO:
- Ilmoita sääntö/kaava selkeästi
- Lisää toimiva esimerkki
- Muoto: "Sääntö/Kaava\n\nEsimerkki: [konkreettinen esimerkki]"
```

**Why this works:**
- Clear distinction: Rule questions vs. calculation questions
- Examples embedded in answers (teaching moment)
- "Miten?" format is natural and clear

**Example of good output:**
```json
{
  "question": "Miten lasketaan suorakulmion pinta-ala?",
  "answer": "pituus × leveys",
  "explanation": "Pinta-ala = pituus × leveys\n\nEsimerkki: Jos suorakulmion sivut ovat 4m ja 6m, pinta-ala = 4m × 6m = 24 m²"
}
```

### 💡 Minor Improvement

**Add clarity on when rule-based applies:**

```
RULE-BASED FORMAT APPLIES TO:
✅ Math formulas (area, volume, speed, etc.)
✅ Physics laws (F=ma, E=mc², etc.)
✅ Chemistry equations (balancing, reactions)
✅ Grammar rules (verb conjugation, sentence structure)
✅ Process steps (how to solve a problem)

❌ NOT for:
- Vocabulary (word translations)
- Facts (capitals, dates, names)
- Definitions (what is photosynthesis?)

DETECTION:
If contentType='grammar' → ALWAYS rule-based
If subject='math' OR 'physics' OR 'chemistry' → ALWAYS rule-based
Otherwise → Determine based on material content
```

---

## 5. Explanation Style

### ✅ Very Clear and Effective

**Current instructions:**
```
SELITYSTEN TYYLI:
- Kirjoita kaikki selitykset SUORAAN oppilaalle (sinä)
- OIKEIN: "Kun desimaaliosat ovat samat, ne kumoavat toisensa."
- VÄÄRIN: "Oppilaat eivät huomaa usein..."
- Käytä: "Huomaa että...", "Muista että...", "Saatat helposti..."
```

**Why this works:**
- Direct address is more engaging
- "Sinä" form creates personal connection
- Specific examples of good/bad phrasing
- Helps students understand common mistakes

**No changes needed** - this is excellent.

---

## 6. Material Coverage and Grounding

### ✅ Strong Material Grounding

**Instructions:**
```
"PERUSTA kysymykset annettuun materiaaliin"
"Pysy annetussa materiaalissa, älä lisää uutta sisältöä"
```

**AI perspective:**
- Clear instruction to stay within material bounds
- Prevents hallucination or adding outside knowledge
- **Works well in practice**

### ⚠️ Minor Issue: Curriculum Context Can Conflict

**Scenario:**
- Material: Basic English greetings (Grade 4 level)
- Curriculum loaded: Grade 6 curriculum (more advanced)
- Possible confusion: Should I match material or curriculum?

**Current behavior:**
- I prioritize material content
- But curriculum influences difficulty expectations

**Recommendation:**

```
MATERIAL vs. CURRICULUM PRIORITY:

1. CONTENT comes from MATERIAL (what questions are about)
   - Only ask about concepts/facts present in uploaded material
   - Don't add concepts from curriculum that aren't in material

2. DIFFICULTY guided by GRADE + DIFFICULTY setting
   - Use curriculum to set appropriate complexity level
   - Vocabulary level, sentence complexity match grade

3. TOPICS from MATERIAL ANALYSIS
   - Identified topics take precedence
   - Curriculum provides context, not content

EXAMPLE:
Material: Simple geometry (triangles, rectangles)
Grade 6 curriculum: Includes advanced geometry (3D shapes, angles)
→ Questions about triangles/rectangles (from material)
→ Using Grade 6 vocabulary and complexity (from curriculum)
→ NOT asking about 3D shapes (not in material)
```

---

## 7. JSON Format and Validation

### ✅ Very Clear Structure

**Strengths:**
```json
{
  "question": "kysymysteksti",
  "type": "multiple_choice",
  "topic": "aihealue",            // Required
  "skill": "taito_tagi",          // Required
  "subtopic": "optional",         // Optional, good
  "options": ["A", "B", "C", "D"],
  "correct_answer": "A",
  "explanation": "..."
}
```

**Why this works:**
- Required vs. optional fields clearly marked
- Type-specific fields (options for multiple_choice, pairs for matching)
- Backward compatible (supports timeline sequential with year field)

### ⚠️ Minor Issues

**Issue 1: acceptable_answers unclear format**

Prompt says:
```
"acceptable_answers": ["vaihtoehtoinen vastaus"]
```

**Questions:**
- Should this be exact matches only?
- Case-sensitive or insensitive?
- Does "dog" match "Dog" or "dogs" or "a dog"?

**Recommendation:**
```
ACCEPTABLE_ANSWERS FORMAT:

- List alternative phrasings that are EQUALLY CORRECT
- Will be matched case-insensitively and whitespace-trimmed
- Examples:
  ✅ "acceptable_answers": ["cat", "kissa", "a cat"]
  ✅ "acceptable_answers": ["5 cm²", "5 neliösenttimetriä"]
  ❌ Don't include wrong answers or partial credit answers

- For math: Include equivalent notations
  Question: "Write 0.5 as a fraction"
  correct_answer: "1/2"
  acceptable_answers: ["½", "one half", "1:2"]
```

**Issue 2: Matching pairs minimum unclear**

Prompt says:
```
"VÄHINTÄÄN 4 paria"
```

**Question:** Maximum? Should I create 10 pairs if material has them?

**Recommendation:**
```
MATCHING REQUIREMENTS:
- Minimum: 4 pairs
- Maximum: 8 pairs (beyond this, split into multiple questions)
- Optimal: 5-6 pairs (manageable for students)
```

---

## 8. Missing Guidance

### ❌ When to Use Each Question Type

**Current state:** Question types are listed, but "when to use" is vague.

**Example - Multiple Choice vs. Fill Blank:**

Material: "The capital of Finland is Helsinki."

Could be:
- Multiple choice: "What is the capital of Finland? A) Helsinki B) Stockholm C) Oslo D) Copenhagen"
- Fill blank: "The capital of Finland is ___"

**Question:** Which should I choose? Both are valid.

**Current guidance:** None specific.

**Recommendation:** See section 2 above (question type selection guidance)

### ❌ Difficulty Calibration Unclear

**Current state:**
```
"difficulty": "helppo"
"difficulty": "normaali"
```

**Question:** What makes a question "helppo" vs. "normaali"?

**Current guidance:**
```
helppo: Perusasiat, tunnistaminen, yksinkertaiset käsitteet
normaali: Soveltaminen, ymmärtäminen, monimutkaisemmat ongelmat
```

**Problem:** This is cognitive (Bloom's taxonomy) guidance, but doesn't account for:
- Vocabulary complexity
- Sentence length
- Number of steps required
- Conceptual prerequisites

**Recommendation:**

```
DIFFICULTY CALIBRATION GUIDE:

HELPPO (Grades 4-6):
Vocabulary: Common, everyday words (100-500 most frequent words)
Sentence: Short, simple (max 10-12 words)
Cognitive: Recognition, recall, direct application
Steps: Single step (no multi-step reasoning)
Examples:
  ✅ "What is 5 + 3?"
  ✅ "The capital of Finland is ___"
  ✅ "True or false: Water boils at 100°C"

NORMAALI (Grades 4-6):
Vocabulary: Academic, subject-specific terms
Sentence: Moderate complexity (12-20 words, may have subordinate clause)
Cognitive: Understanding, application, simple analysis
Steps: 2-3 steps (combine concepts, apply formula, explain)
Examples:
  ✅ "If a rectangle has sides 4m and 6m, what is its area?"
  ✅ "Explain why plants need sunlight"
  ✅ "Complete with correct tense: She ___ (go) to London last week"

VAIKEA (Grades 6+ only, written subjects):
Vocabulary: Advanced, abstract concepts
Sentence: Complex (20+ words, multiple clauses)
Cognitive: Analysis, synthesis, evaluation
Steps: Multi-step reasoning (3+ steps, compare, synthesize)
Examples:
  ✅ "Compare the causes of WWI and WWII"
  ✅ "Analyze how geography influenced Roman expansion"

GRADE-SPECIFIC MODIFIERS:
Grade 4:
  - Helppo: Very simple sentences, basic vocabulary
  - Normaali: Simple application, familiar contexts

Grade 5:
  - Helppo: Straightforward recall and recognition
  - Normaali: Application with some complexity

Grade 6:
  - Helppo: Multi-concept recognition
  - Normaali: Complex application, explanation required
  - Vaikea: Analysis, synthesis (written subjects only)
```

### ❌ Number Formatting Edge Cases

Current rule:
```
Desimaalierottimena AINA pilkku (,): "15,25"
Lukusarjojen erottimena puolipiste + välilyönti: "5; 10; 15; 20"
```

**Unclear cases:**
- Thousands separator? "1000" or "1 000" or "1.000"?
- Scientific notation? "1,5 × 10³" or "1,5E3"?
- Fractions in text? "1/2" or "½" or "yksi kahdesosa"?
- Negative numbers? "-5" or "−5" (minus vs hyphen)?

**Recommendation:**

```
FINNISH NUMBER FORMATTING (COMPLETE RULES):

1. DECIMAL SEPARATOR: Always comma
   ✅ "15,25" ✅ "0,5" ✅ "3,14159"
   ❌ "15.25" ❌ "0.5"

2. THOUSANDS SEPARATOR: Space (nbsp recommended)
   ✅ "1 000" ✅ "1 000 000" ✅ "15 250,50"
   ❌ "1000" (ok for <10000) ❌ "1,000" ❌ "1.000"

3. LIST SEPARATOR: Semicolon + space
   ✅ "5; 10; 15; 20"
   ❌ "5, 10, 15, 20" (looks like decimals)

4. RANGES: Use en-dash (–) or hyphen with spaces
   ✅ "5–10" ✅ "5 - 10"
   ❌ "5-10" (hyphen without spaces, ambiguous)

5. NEGATIVE NUMBERS: Use minus sign (−) or hyphen
   ✅ "−5" ✅ "-5" (both acceptable)

6. FRACTIONS:
   - Inline: Use slash "1/2" or Unicode "½"
   - Display: Use proper fraction notation when possible
   ✅ "1/2" ✅ "½" ✅ "yksi kahdesosa"

7. SCIENTIFIC NOTATION:
   ✅ "1,5 × 10³" (preferred)
   ✅ "1,5 · 10³" (acceptable)
   ❌ "1,5E3" (avoid in educational context)

8. UNITS:
   - Space between number and unit
   ✅ "15 cm" ✅ "20 kg" ✅ "100 °C"
   ❌ "15cm" ❌ "20kg" ❌ "100°C"

9. PERCENTAGES:
   - NO space before %
   ✅ "15%" ✅ "99,5%"
   ❌ "15 %" ❌ "99,5 %"
```

---

## 9. Overall System Coherence

### Current Prompt Assembly

```
Final Prompt =
  format.txt                    (JSON structure)
  + topic-tagging.txt           (Topic balance rules)
  + skill-tagging.txt           (Skill selection)
  + type template (language.txt) (Subject-specific rules)
  + curriculum context          (Grade-specific content)
  + distributions              (Type percentages) ← CONFLICT HERE
  + flashcard-rules.txt        (If flashcard mode)
  + material                    (Actual content)
```

**Coherence Score: 6/10**

**Problems:**
1. **Conflicting priorities:** "Stay in material" vs. "hit exact distribution percentages"
   - If material is 80% process-based, but sequential limited to 15%, which wins?

2. **Overlapping instructions:** Type template AND flashcard-rules both give type guidance
   - Can create redundancy or contradiction

3. **Unclear precedence:** Which instruction overrides when conflict occurs?

**Recommendation:**

Add precedence hierarchy at top of final prompt:
```
INSTRUCTION PRECEDENCE (when conflicts arise):

1. HIGHEST: JSON Format requirements (must be valid JSON)
2. HIGH: Material grounding (stay within provided material)
3. HIGH: Required fields (topic, skill must be present)
4. MEDIUM: Question quality (natural, appropriate type for content)
5. MEDIUM: Topic balance (distribute across identified topics)
6. LOW: Distribution percentages (guidance, not strict requirement)
7. LOW: Exact coverage per topic (aim for target, allow variance)

If instructions conflict, follow higher-precedence rule.

Example: If material is 80% timeline content but distribution says 15% sequential:
→ Material grounding (HIGH) + Question quality (MEDIUM) override Distribution (LOW)
→ Use 40-60% sequential because that's what the material naturally supports
```

---

## 10. Recommendations Summary

### Priority 1: Remove Distribution Rigidity (CRITICAL)

**Task-130 (Planned)** addresses this.

**Changes needed:**
1. Remove "NOUDATA TARKASTI" and "MUST generate EXACTLY" language
2. Replace with "GUIDANCE" and "typical distributions"
3. Add question type selection decision tree
4. Allow sequential to be 30-50% for process/timeline material

**Expected impact:**
- More natural questions
- Better use of sequential for appropriate content
- Less AI confusion about conflicting priorities

### Priority 2: Simplify Flashcards (HIGH)

**Task-131 (Planned)** addresses this.

**Changes needed:**
1. Single flashcard type (not 3 artificial types)
2. Simple Q&A format with flip interaction
3. Keep rule-based format for math/grammar/science
4. Remove distribution percentages for flashcards

**Expected impact:**
- Traditional flashcard UX
- Less code complexity
- More natural question phrasing

### Priority 3: Clarify Topic/Skill Distinction (MEDIUM)

**New task needed.**

**Changes needed:**
1. Add hierarchy diagram (Topic → Subtopic → Skill)
2. Provide skill selection flowchart
3. Give 10+ examples of proper tagging
4. Clarify overlapping cases (grammar topics vs. skills)

**Expected impact:**
- Consistent tagging
- Better analytics (can track skill mastery)
- Less ambiguity for AI

### Priority 4: Add Question Type Selection Guidance (MEDIUM)

**Included in Task-130.**

**Changes needed:**
1. When to use each type (with examples)
2. Sequential usage expansion (30-50% for timeline material)
3. Multiple choice vs. fill_blank decision criteria
4. Matching minimum/maximum pairs

**Expected impact:**
- More appropriate question types
- Better use of sequential
- Less arbitrary type selection

### Priority 5: Add Difficulty Calibration Guide (LOW)

**New task needed.**

**Changes needed:**
1. Detailed rubric for helppo/normaali/vaikea
2. Grade-specific modifiers
3. Vocabulary complexity guidelines
4. Cognitive complexity (Bloom's taxonomy)

**Expected impact:**
- More consistent difficulty levels
- Better grade-appropriate questions
- Clearer expectations for AI

### Priority 6: Complete Number Formatting Rules (LOW)

**Minor update to format.txt.**

**Changes needed:**
1. Add thousands separator rule
2. Add scientific notation rule
3. Add fraction formatting rule
4. Add unit spacing rule

**Expected impact:**
- Consistent number formatting
- Fewer formatting errors
- Clearer instructions

---

## Overall Assessment

### Current System Quality: 7/10

**Strengths:**
- ✅ Topic identification is sophisticated and accurate
- ✅ Rule-based flashcards work very well
- ✅ Explanation style is clear and effective
- ✅ JSON structure is well-defined
- ✅ Material grounding prevents hallucination

**Weaknesses:**
- ❌ Rigid distributions conflict with natural question formation
- ❌ Flashcard type split is artificial
- ❌ Topic vs. Skill boundaries unclear
- ❌ Question type selection guidance missing
- ❌ Difficulty calibration vague

### Can It Produce Tailor-Made Content? YES, with caveats

**When it works well:**
- Material is balanced across topics ✅
- Content fits predefined question types ✅
- No timeline/process-heavy material ✅
- Vocabulary or fact-based content ✅

**When it struggles:**
- Timeline/process-heavy material (sequential underused) ⚠️
- Material doesn't fit topic distribution targets ⚠️
- Flashcard generation (forced type variations) ⚠️
- Boundary cases between question types ⚠️

### After Implementing Tasks 130 + 131: Expected Quality 9/10

**Improvements:**
- ✅ Natural question type selection
- ✅ Sequential questions used appropriately
- ✅ Flashcards simplified to traditional format
- ✅ Less conflict between instructions
- ✅ Better handling of diverse material types

**Remaining limitations:**
- ⚠️ Topic/Skill distinction still somewhat unclear
- ⚠️ Difficulty calibration not standardized
- ⚠️ Number formatting edge cases not fully specified

**Recommended next steps after 130+131:**
1. Task-132: Clarify Topic/Skill hierarchy and selection
2. Task-133: Add difficulty calibration rubric
3. Task-134: Complete number formatting specification

---

## Conclusion

The current system is **good but constrained by rigidity**. The upcoming improvements (tasks 130-131) will address the most critical issues. With those changes, the system will be excellent for tailor-made content generation.

**Key insight:** Modern AI (Claude Sonnet 4.5) is sophisticated enough to make good decisions about question types, difficulty, and balance WITHOUT rigid percentages. The system should guide and validate rather than strictly enforce.

**Analogy:**
- Current system: "You MUST use exactly 60% fill_blank, 30% short_answer, 10% matching"
- Better system: "Here are 6 question types and when each works best. Create natural questions and aim for variety."

The AI will naturally produce better quality with the second approach because it can match question type to content rather than forcing content into predetermined formats.
