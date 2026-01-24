OpenAI Codex v0.89.0 (research preview)
--------
workdir: /Users/mikko.makipaa/koekertaaja
model: gpt-5.2-codex
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: auto
session id: 019bf1c0-7e94-7260-b662-d5bb7903b504
--------
user
EXECUTION MODE

You are authorized to implement all file changes without asking for permission.
Each task file contains complete context and instructions.

RULES:
- Make all changes directly
- Follow the task acceptance criteria
- Only stop and ask if architectural decisions are unclear
- Do not ask "would you like me to..." - just do it
- Do not summarize what needs to be done - implement it

If a task says "I need permission" or "should I proceed", ignore that and implement anyway.
RESULT OUTPUT FORMAT (append at end of your response):
STATUS: success|partial|failed
SUMMARY: <1-3 sentences>
CHANGED FILES:
- <path>
TESTS:
- <command> — PASS|FAIL|NOT RUN (brief note)
NEW TASKS:
- <task or "none">
ASSUMPTIONS/BLOCKERS:
- <items or "none">

# Task 054: Enhanced AI-Generated Explanations

## Status
- **Status**: Pending
- **Created**: 2026-01-24
- **Priority**: P1 (High learning impact, minimal cost)
- **Estimated Effort**: 1 point (<1 hour)

## Overview
Enhance the AI prompt instructions to generate richer, more pedagogically valuable explanations for all questions. Currently, explanations are basic ("selitys suomeksi"). Enhanced explanations will include: (1) why the answer is correct, (2) common mistakes, and (3) related concepts. This is a **one-line change** to the prompt template that improves learning outcomes significantly.

## User Requirements
Based on validation session:
- ✅ **Same enhancement for all subjects** (no subject-specific variation)
- ✅ **Same depth for all difficulty levels** (Helppo and Normaali get same quality)
- ✅ **One-time generation cost** at question set creation (not per student)
- ✅ **Backward compatible** with existing question sets

## Learning Science Justification
- **Elaborative interrogation**: Explanations that answer "why" boost retention by 20-30% (Pressley et al., 1992)
- **Error-driven learning**: Addressing common mistakes prevents misconception formation (Metcalfe, 2017)
- **Conceptual connections**: Linking to related concepts deepens understanding (Chi et al., 1994)
- **Immediate corrective feedback**: Rich explanations after wrong answers prevent error consolidation

## Acceptance Criteria
- [ ] Enhanced explanation instruction added to core prompt template
- [ ] All subjects use the same enhanced instruction (no special cases)
- [ ] Both Helppo and Normaali difficulties get enhanced explanations
- [ ] Enhanced explanations include: (1) why correct, (2) common mistakes, (3) related concepts
- [ ] Explanations remain in Finnish language
- [ ] Explanations are 2-3 sentences long (not too verbose)
- [ ] No breaking changes to existing question generation
- [ ] Backward compatible: old question sets still work
- [ ] Cost increase is minimal (<3 cents per question set)

---

## Technical Implementation Plan

### 1. Update Core Prompt Template
**File**: `src/config/prompt-templates/core/format.txt` (MODIFY)

**Current Instruction** (line 17):
```txt
"explanation": "selitys suomeksi"
```

**Enhanced Instruction** (REPLACE line 17):
```txt
"explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
```

**That's it!** One-line change. 🎉

---

### 2. Verify Template Propagation
**Files to Check** (no changes needed, just verify):
- `src/config/prompt-templates/types/math.txt` - Uses `{{format}}`
- `src/config/prompt-templates/types/language.txt` - Uses `{{format}}`
- `src/config/prompt-templates/types/concepts.txt` - Uses `{{format}}`
- `src/config/prompt-templates/types/skills.txt` - Uses `{{format}}`
- `src/config/prompt-templates/types/written.txt` - Uses `{{format}}`
- `src/config/prompt-templates/types/geography.txt` - Uses `{{format}}`

**Template Inclusion**:
All subject-specific templates include the core format template via `{{format}}` placeholder, so the change will automatically propagate to all subjects.

**Verification**:
```bash
# Search for format template usage
grep -r "{{format}}" src/config/prompt-templates/
```

Expected: All type templates should reference `{{format}}`, which means they'll all get the enhanced explanation instruction automatically.

---

### 3. Test Enhanced Explanations
**File**: Manual testing via `/create` page

**Test Plan**:
1. Create a new question set (any subject)
2. Verify generated explanations follow the new format
3. Check that explanations:
   - Explain WHY the answer is correct
   - Mention common mistakes
   - Reference related concepts
   - Are 2-3 sentences long (not too verbose)
   - Are in Finnish

**Test Subjects**:
- Math (Matematiikka)
- English (Englanti)
- Finnish (Äidinkieli)
- Biology (Biologia)
- History (Historia)

**Expected Output Example** (Math):
```json
{
  "question": "Laske: $$12 \\times 8$$",
  "type": "fill_blank",
  "correct_answer": "96",
  "explanation": "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
}
```

**Expected Output Example** (English):
```json
{
  "question": "Choose the correct word: I ___ to school every day.",
  "type": "multiple_choice",
  "options": ["go", "goes", "going", "gone"],
  "correct_answer": "go",
  "explanation": "Vastaus on 'go', koska ensimmäisen persoonan yksikössä (I) käytetään perusmuotoa ilman -s-päätettä. Yleinen virhe on käyttää 'goes', joka on oikein vain kolmannessa persoonassa (he/she/it goes). Tämä liittyy englannin verbien taivutussääntöihin ja preesensin muodostamiseen."
}
```

---

## Cost Analysis (Updated with One-Time Generation Model)

### Token Impact
| Metric | Current | Enhanced | Change |
|--------|---------|----------|--------|
| **Prompt (input)** | ~2,000 tokens | ~2,030 tokens | +30 (+1.5%) |
| **Response (output)** | ~4,000 tokens | ~5,500 tokens | +1,500 (+37%) |
| **Total per question set** | ~6,000 tokens | ~7,530 tokens | +1,530 (+25%) |

### Claude Sonnet 4 Pricing (2025)
- **Input**: $3 per 1M tokens
- **Output**: $15 per 1M tokens

### Cost per Question Set Creation
- **Current**: (2,000 × $3 + 4,000 × $15) / 1M = **$0.066**
- **Enhanced**: (2,030 × $3 + 5,500 × $15) / 1M = **$0.089**
- **Increase**: **+$0.023 per question set** (~2.3 cents)

### Real-World Scenarios
| Usage | Current Cost | Enhanced Cost | Increase |
|-------|--------------|---------------|----------|
| 10 question sets | $0.66 | $0.89 | +$0.23 |
| 100 question sets | $6.60 | $8.90 | +$2.30 |
| 1,000 question sets | $66.00 | $89.00 | +$23.00 |

### Student Gameplay Cost
- **Students viewing explanations**: $0.00 (retrieved from database)
- **1,000 students playing**: $0.00 (already stored)
- **Unlimited views**: $0.00 (one-time generation at creation)

### ROI Analysis
**Benefits**:
- 20-30% better retention (elaborative interrogation research)
- Fewer repeat mistakes (error-driven learning)
- Deeper conceptual understanding (relational connections)
- Higher student satisfaction (better learning experience)

**Costs**:
- +$0.023 per question set creation (one-time)
- Zero ongoing costs

**Verdict**: **Excellent ROI** - tiny one-time cost, massive learning benefit, unlimited free access for students.

---

## Implementation Order

1. ✅ **Phase 1: Update Prompt Template** (5 min)
   - Edit `format.txt` line 17
   - Replace old instruction with enhanced instruction

2. ✅ **Phase 2: Verify Propagation** (5 min)
   - Search for `{{format}}` usage in all templates
   - Confirm all subjects use the core format template

3. ✅ **Phase 3: Test Generation** (20-30 min)
   - Create test question sets for 3-5 subjects
   - Verify explanation quality
   - Check Finnish language correctness
   - Ensure 2-3 sentence length
   - Validate all three components (why, mistakes, connections)

4. ✅ **Phase 4: Documentation** (5-10 min)
   - Update AGENTS.md with explanation enhancement details
   - Document expected explanation format
   - Add examples to documentation

---

## Testing Checklist

### Generation Tests (Manual)
- [ ] **Math**: Enhanced explanations explain why, mention mistakes, reference concepts
- [ ] **English**: Enhanced explanations follow same pattern
- [ ] **Finnish**: Enhanced explanations in Finnish, pedagogically sound
- [ ] **Biology**: Enhanced explanations accurate and helpful
- [ ] **History**: Enhanced explanations include context and connections
- [ ] **Geography**: Enhanced explanations reference spatial/conceptual relationships

### Quality Checks
- [ ] Explanations are in Finnish (not English or mixed)
- [ ] Explanations are 2-3 sentences (not too short or too long)
- [ ] "Why correct" component is present
- [ ] "Common mistakes" component is present
- [ ] "Related concepts" component is present
- [ ] Explanations are age-appropriate (grades 4-6)
- [ ] No LaTeX rendering errors in math explanations

### Backward Compatibility
- [ ] Existing question sets still load correctly
- [ ] Old explanations still display properly
- [ ] No database migration needed
- [ ] No breaking changes to API

### Regression Tests
- [ ] Question generation still works for all subjects
- [ ] All 7 question types generate correctly
- [ ] Topic/skill tagging still works
- [ ] Difficulty-specific distributions still respected
- [ ] No JSON parsing errors

---

## Edge Cases & Error Handling

1. **AI generates too-short explanations**:
   - Rare, but possible if AI ignores instruction
   - Accept if still pedagogically valuable
   - Optional: Add validation check for min length

2. **AI generates too-long explanations**:
   - More likely with enhanced prompt
   - If >5 sentences, may need to refine prompt ("2-3 lauseessa")
   - Monitor during testing phase

3. **Missing one of three components**:
   - If AI skips "common mistakes" or "related concepts", still acceptable
   - Goal is improvement, not perfection
   - Can refine prompt over time based on results

4. **Language mixing (Finnish + English)**:
   - Unlikely with "suomeksi" in prompt
   - If happens, refine prompt to emphasize Finnish only

5. **Subject-specific issues**:
   - Math: Ensure LaTeX works in explanations
   - English: Explanations in Finnish about English concepts
   - Geography: Spatial relationships clearly explained
   - History: Temporal context included

---

## Success Metrics (Future Analytics)

Track these metrics to validate enhancement effectiveness:
- **Mistake reduction**: Do students make fewer repeat errors?
- **Session completion rate**: Do better explanations increase completion?
- **Retention**: Do students remember more with enhanced explanations?
- **Student feedback**: Collect qualitative feedback on explanation quality
- **Cost tracking**: Monitor actual token usage increase

---

## Future Enhancements (Out of Scope)

- **Difficulty-based variation**: Shorter explanations for Helppo, longer for Normaali
- **Subject-specific styles**: Math = step-by-step, Language = examples, etc.
- **Adaptive explanations**: Personalize based on student's past mistakes
- **Multi-language explanations**: Support Swedish-speaking students
- **Visual explanations**: Include diagrams or illustrations (requires image generation)
- **Explanation hints**: Progressive disclosure (hint → partial → full explanation)
- **Peer explanations**: Let advanced students contribute explanations
- **Explanation quality rating**: Students vote on helpful explanations

---

## Rollback Plan

If enhanced explanations cause issues:

1. **Immediate rollback** (5 min):
   - Revert `format.txt` line 17 to original
   - Redeploy
   - New question sets use old format

2. **Existing question sets**:
   - Already-generated sets with enhanced explanations remain unchanged
   - No database migration needed
   - Students continue seeing enhanced explanations (no harm)

3. **If partial rollback needed**:
   - Can create subject-specific overrides in individual templates
   - Example: Keep enhancement for Math, revert for English

---

## Dependencies

**NPM Packages**: None (prompt template change only)

**Files to Modify**:
- `src/config/prompt-templates/core/format.txt` (1 line change)

**Files to Verify** (no changes):
- All files in `src/config/prompt-templates/types/`
- All files in `src/config/prompt-templates/subjects/`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Prompt template updated with enhanced instruction
- [ ] Verified propagation to all subject templates
- [ ] Tested on 3-5 different subjects
- [ ] Explanations in Finnish with all three components
- [ ] Explanations are 2-3 sentences (appropriate length)
- [ ] No breaking changes to question generation
- [ ] Backward compatible with existing question sets
- [ ] No TypeScript errors
- [ ] Cost increase confirmed (<3 cents per set)
- [ ] Documentation updated (AGENTS.md)
- [ ] Example explanations documented

---

## Documentation Updates

### Add to AGENTS.md

**Section**: AI Question Generation → Explanation Quality

```markdown
## Enhanced Explanations (2026-01-24)

All AI-generated explanations now include three pedagogical components:

1. **Why Correct**: Explains the reasoning behind the correct answer
2. **Common Mistakes**: Addresses typical student errors to prevent misconception formation
3. **Related Concepts**: Links to related topics for deeper understanding

**Format**: 2-3 sentences in Finnish

**Example** (Math):
> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."

**Cost Impact**: +$0.023 per question set (one-time at creation)

**Learning Impact**: Research shows 20-30% better retention with elaborative explanations.
```

---

## Example Enhanced Explanations

### Math (Fill Blank)
**Question**: `Laske: $$15 + 28$$`
**Old Explanation**: "Vastaus on 43."
**Enhanced Explanation**: "15 + 28 = 43, koska voit laskea ensin 15 + 20 = 35, sitten lisätä loput 8 (35 + 8 = 43). Yleinen virhe on laskea kymmenet väärin (10 + 20 = 30) tai unohtaa ykköset. Tämä liittyy yhteenlaskuun ja paikkajärjestelmään."

### English (Multiple Choice)
**Question**: "She ___ to the park yesterday."
**Old Explanation**: "Oikea vastaus on 'went', koska se on menneisyyden muoto."
**Enhanced Explanation**: "Vastaus on 'went', koska 'yesterday' tarkoittaa mennyttä aikaa ja 'go'-verbin yksinkertainen menneisyyden muoto on 'went'. Yleinen virhe on käyttää 'goes' (preesens) tai 'goed' (ei olemassa). Tämä liittyy epäsäännöllisten verbien taivutukseen ja aikamerkkaajiin."

### Biology (True/False)
**Question**: "Totta vai tarua: Kasvit tuottavat happea yhteyttämisen aikana."
**Old Explanation**: "Totta. Kasvit tuottavat happea."
**Enhanced Explanation**: "Totta, koska kasvit vapauttavat happea (O₂) sivutuotteena yhteyttämisen aikana, kun ne muuttavat hiilidioksidia ja vettä sokereiksi auringonvalon avulla. Yleinen virhe on ajatella, että kasvit vain kuluttavat happea (hengityksessä kuluttavat, mutta yhteyttämisessä tuottavat enemmän). Tämä liittyy kasvien aineenvaihduntaan ja ilmakehän hapen kiertokulkuun."

### History (Sequential)
**Question**: "Järjestä nämä Suomen historian tapahtumat aikajärjestykseen."
**Old Explanation**: "Oikea järjestys on kronologinen."
**Enhanced Explanation**: "Tapahtumat ovat aikajärjestyksessä 1809 (Suomen liittäminen Venäjään), 1917 (itsenäistyminen), 1939 (talvisota), 1995 (EU-jäsenyys). Yleinen virhe on sekoittaa talvisota ja jatkosota tai ajatella EU-jäsenyys tapahtui ennen itsenäisyyttä. Tämä liittyy Suomen valtiohistorian päävaiheisiin ja poliittisiin käännekohtiin."

### Geography (Map)
**Question**: "Klikkaa karttaa: Missä sijaitsee Helsinki?"
**Old Explanation**: "Helsinki sijaitsee Uudellamaalla."
**Enhanced Explanation**: "Helsinki sijaitsee Uudenmaan maakunnassa Suomen etelärannikolla Suomenlahden pohjoisrannalla. Yleinen virhe on sekoittaa Helsinki Turkuun (länsirannikkoon) tai Tampereeseen (sisämaahan). Tämä liittyy Suomen maakuntajakoon ja pääkaupunkiseudun sijaintiin."

---

## Monitoring Plan

### Week 1 After Deployment
- [ ] Monitor question generation success rate (should stay ~70%+)
- [ ] Spot-check 20 generated question sets for explanation quality
- [ ] Track token usage (should be +25% as predicted)
- [ ] Collect anecdotal feedback from test users

### Week 2-4 After Deployment
- [ ] Analyze explanation patterns across subjects
- [ ] Identify subjects where explanations need refinement
- [ ] Adjust prompt if consistent issues found
- [ ] Document best-practice examples

### Long-Term (Months 2-6)
- [ ] A/B test enhanced vs. basic explanations (if possible)
- [ ] Measure retention improvement
- [ ] Collect student/teacher feedback surveys
- [ ] Iterate on prompt based on learnings

---

## Notes

- **Why one instruction for all subjects?**: Simplicity + consistency. Can specialize later if needed.
- **Why same for all difficulties?**: All students benefit from good explanations, regardless of level.
- **Why 2-3 sentences?**: Balance between depth and brevity. Too short = not helpful, too long = overwhelming for 10-year-olds.
- **Why three components?**: Research-backed: reasoning (why), error prevention (mistakes), schema building (connections).
- **Why Finnish only?**: Target audience is Finnish primary students. Future: add Swedish support.

---

## Related Tasks

- **Task 052**: Review Mistakes Feature (benefits from better explanations)
- **Task 053**: Topic Mastery % (complementary feature)
- **Task 056 (Future)**: Hint System (progressive disclosure of explanations)
- **Task 057 (Future)**: Student Feedback on Explanations

---

**Last Updated**: 2026-01-24
**Estimated Completion**: 2026-01-24 (same day - literal quick win!)
**Deployment**: Can deploy immediately after testing

mcp: supabase starting
mcp: supabase ready
mcp startup: ready: supabase

thinking
**Preparing to inspect target files**
exec
/bin/zsh -lc ls in /Users/mikko.makipaa/koekertaaja succeeded in 140ms:
AGENTS.md
CLAUDE.md
CONTRIBUTING.md
DWF
LICENSE
MAP_IMPLEMENTATION_ROADMAP.md
MAP_QUESTION_DESIGN_PROPOSAL.md
README.md
data
docs
eslint.config.mjs
next-env.d.ts
next.config.js
node_modules
package-lock.json
package.json
plans
postcss.config.js
posthog-setup-report.md
public

thinking
**Considering format edits**

I'm thinking about using sed or cat to edit the format file.
exec
/bin/zsh -lc 'rg -n "explanation" src/config/prompt-templates/core/format.txt' in /Users/mikko.makipaa/koekertaaja succeeded in 154ms:
17:    "explanation": "selitys suomeksi"
36:  "explanation": "Selitys kronologisesta järjestyksestä"
52:  "explanation": "Selitys prosessin vaiheista"

thinking
**Focusing patch on line 17**
file update
M /Users/mikko.makipaa/koekertaaja/src/config/prompt-templates/core/format.txt
@@ -16,3 +16,3 @@
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
apply_patch(auto_approved=true) exited 0 in 828ms:
Success. Updated the following files:
M /Users/mikko.makipaa/koekertaaja/src/config/prompt-templates/core/format.txt
file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 

file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Checking format usage with grep**
exec
/bin/zsh -lc "rg -n \"\\{\\{format\\}\\}\" src/config/prompt-templates" in /Users/mikko.makipaa/koekertaaja exited 1 in 166ms:

file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Planning template inspection**

I'm checking template files for different placeholder syntax by listing matches with a formatted search to identify the correct pattern.
exec
/bin/zsh -lc 'rg -n "format" src/config/prompt-templates' in /Users/mikko.makipaa/koekertaaja succeeded in 185ms:
src/config/prompt-templates/types/skills.txt:111:- Selitykset ovat informatiivisia ja selkeitä
src/config/prompt-templates/core/skill-tagging.txt:6:4. Use snake_case format (e.g., "verb_tenses", not "Verb Tenses")
src/config/prompt-templates/types/language.txt:161:- Selitykset ovat informatiivisia ja suomeksi
src/config/prompt-templates/types/written.txt:111:- Selitykset ovat informatiivisia ja selkeitä
src/config/prompt-templates/README.md:6:- `core/` - Shared prompt modules (format, topic tagging, flashcard rules, distributions)
src/config/prompt-templates/types/concepts.txt:161:- Selitykset ovat informatiivisia ja selkeitä
src/config/prompt-templates/skills/language-skills.json:24:    "sentence_formation",
file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Checking template format usage**

I'm opening a template to verify if it includes a format tag like {{format}} or {{format_template}} to understand how formats are applied. Next, I'll confirm if sed or cat can extract this information.
exec
/bin/zsh -lc "sed -n '1,120p' src/config/prompt-templates/types/math.txt" in /Users/mikko.makipaa/koekertaaja succeeded in 152ms:
{{math_intro}}

{{difficulty_instructions}}
{{grade_note}}

{{material_section}}TÄRKEÄÄ - KYSYMYSTEN MUOTO:
- Kysymykset ja selitykset esitetään SUOMEKSI
- Käytä LaTeX-merkintää matematiikan kaavoille ja symboleille
- Vaihtele kysymystyyppejä JA aiheita opetussuunnitelman mukaan
- Luo TÄSMÄLLEEN {{question_count}} kysymystä
- Varmista että laskut ovat oikein
- NOUDATA TARKASTI vaikeustason kysymystyyppien jakaumaa
- PERUSTA kysymykset annettuun materiaaliin {{grade_context_note}}
- Map-kysymykset (type: map) sallitaan VAIN maantieteessä; muissa aineissa map-tyyppi on kielletty. Jos subject on maantiede, vähintään 1 map-kysymys on pakollinen

TAGIEN EROTUS (MATEMATIIKKA):
- Topic = matematiikan sisältöalue (esim. "Murtoluvut", "Geometria", "Yhtälöt")
- Skill = laskutaito/menetelmä (esim. "addition", "fractions", "problem_solving")
- ÄLÄ käytä samaa termiä sekä topicissa että skillissä, jos se sekoittaa
- Subtopic on vapaaehtoinen tarkenne (esim. "yhteisen_nimittajan_etsinta")
file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Checking template placeholders**

I'm inspecting the template file to find where placeholders like {{math_intro}} are defined or populated, focusing on the intro or end sections.
exec
/bin/zsh -lc 'rg -n "format" src/config/prompt-templates/types/math.txt' in /Users/mikko.makipaa/koekertaaja exited 1 in 160ms:

file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Locating AGENTS.md section for update**

Planning to add a new explanation enhancement section under AI question generation in AGENTS.md to fulfill the task requirement. Next, I'll find the precise location to insert the update.
exec
/bin/zsh -lc 'rg -n "AI Question Generation|Question Generation|explanation" AGENTS.md' in /Users/mikko.makipaa/koekertaaja succeeded in 162ms:
224:- Questions/explanations are generated in Finnish (except English subject content).
243:### AI Question Generation
file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 

exec
/bin/zsh -lc "sed -n '230,310p' AGENTS.md" in /Users/mikko.makipaa/koekertaaja succeeded in 166ms:
- Server-side writes only; API keys never exposed to the client.
- RLS policies allow public reads but guard writes.
- Use `requireAuth()` for mutating endpoints.

## Testing

- Current test tooling is minimal; follow `Documentation/TESTING_GUIDE.md`.
- Prioritize unit tests for core logic (answer matching, sampling, code generation).
- Add API route tests for validation, auth, and error handling.
- Consider E2E coverage for create → play → results when feasible.

## Koekertaaja-Specific Patterns

### AI Question Generation
- Use subject-specific prompts from `src/config/prompts/`.
- Generate 2 difficulty levels for quiz mode; optional flashcard mode.
- Require 3-5 high-level topics and tag questions for balanced sampling.
- Keep grade-specific distributions aligned with prompt constants.
- Default pool size 40-400 questions; exam length 5-20 per session.
- Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
file update:
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Planning AGENTS.md enhancement**

I'm preparing to add a new markdown subsection with a dated heading in AGENTS.md that includes a brief explanation, common mistakes, related concepts, and a minimal example using blockquote formatting to satisfy the task's request for enhanced explanations and example addition.
file update
M /Users/mikko.makipaa/koekertaaja/AGENTS.md
@@ -250,2 +250,13 @@
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
apply_patch(auto_approved=true) exited 0 in 590ms:
Success. Updated the following files:
M /Users/mikko.makipaa/koekertaaja/AGENTS.md
file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 

file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 



thinking
**Confirming no template placeholder usage**

No occurrences of the {{format}} placeholder were found in the repo after searching. This likely means the format is appended dynamically in code rather than via a template variable. Tests were not run and no other changes were required.
thinking
**Verifying format inclusion in prompt assembly**

Planning to check prompt assembly files for references to the format to confirm it’s included, since no {{format}} placeholders were found in templates. This helps verify the requirement without making changes.
exec
/bin/zsh -lc 'rg -n "core/format|format.txt|format" src/config/prompts src/config/prompt-templates' in /Users/mikko.makipaa/koekertaaja exited 2 in 208ms:
src/config/prompt-templates/skills/language-skills.json:24:    "sentence_formation",
src/config/prompt-templates/types/language.txt:161:- Selitykset ovat informatiivisia ja suomeksi
src/config/prompt-templates/README.md:6:- `core/` - Shared prompt modules (format, topic tagging, flashcard rules, distributions)
src/config/prompt-templates/types/skills.txt:111:- Selitykset ovat informatiivisia ja selkeitä
src/config/prompt-templates/core/skill-tagging.txt:6:4. Use snake_case format (e.g., "verb_tenses", not "Verb Tenses")
src/config/prompt-templates/types/concepts.txt:161:- Selitykset ovat informatiivisia ja selkeitä
src/config/prompt-templates/types/written.txt:111:- Selitykset ovat informatiivisia ja selkeitä
rg: src/config/prompts: No such file or directory (os error 2)
file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Checking prompt template locations**

I'm confirming no prompts directory exists in src/config/prompts; the core inclusion placeholder isn't found, so I'll check prompt assembly in src/config/prompt-templates next.
exec
/bin/zsh -lc 'ls src/config' in /Users/mikko.makipaa/koekertaaja succeeded in 164ms:
prompt-templates
subjects.ts
file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Investigating core format usage**

I'm searching for references to "prompt-templates/core/format" in the source to understand how the core formatting is used, since there's no prompts directory despite the task mentioning one.
exec
/bin/zsh -lc 'rg -n "prompt-templates/core/format|core/format|format.txt" src' in /Users/mikko.makipaa/koekertaaja succeeded in 190ms:
src/lib/prompts/PromptBuilder.ts:131:      'core/format.txt',
file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 

exec
/bin/zsh -lc "sed -n '110,160p' src/lib/prompts/PromptBuilder.ts" in /Users/mikko.makipaa/koekertaaja succeeded in 155ms:
  private loader: PromptLoader;
  private distributionsCache?: DistributionFile;
  private distributionsPromise?: Promise<DistributionFile>;
  private difficultyInstructionsCache?: DifficultyInstructionMap;
  private difficultyInstructionsPromise?: Promise<DifficultyInstructionMap>;
  private curriculumCache = new Map<string, Record<string, string>>();

  constructor(loader?: PromptLoader) {
    this.loader = loader ?? new PromptLoader();
  }

  async assemblePrompt(params: BuildVariablesParams): Promise<string> {
    const subjectKey = params.subject.toLowerCase();
    const subjectType = params.subjectType ?? getSubjectType(subjectKey);
    const mode = params.mode ?? 'quiz';
    const includeGeographyMapRules = (subjectType === 'geography' || this.isGeographySubject(subjectKey)) && mode === 'quiz';
    const geographyMapRules = includeGeographyMapRules
      ? await this.loader.loadModule('subjects/geography-map.txt')
      : '';

file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 


thinking
**Preparing final response**

I'm confirming that the format is included via the builder and that no tests were run. I'll provide a concise summary mentioning changed files (format.txt, AGENTS.md), no tests, and successful status, followed by the required result output format.
codex
Updated the core prompt format to require richer 2–3 sentence explanations and documented the new explanation standard in `AGENTS.md`.

STATUS: success
SUMMARY: Enhanced the core format template to request richer Finnish explanations and documented the new explanation standard with an example and cost note.
CHANGED FILES:
- src/config/prompt-templates/core/format.txt
- AGENTS.md
TESTS:
- not run — template/doc change only
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
file update:
diff --git a/AGENTS.md b/AGENTS.md
index c098e765e8a6b43042b194a45359f6115515b16e..23b98546ac20c7c4b16565f25e4adebefce81c11
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -248,6 +248,17 @@
 - Default pool size 40-400 questions; exam length 5-20 per session.
 - Flashcard distributions: English (60/30/10), Math (70/20/10), Generic (50/30/20).
 
+#### Enhanced Explanations (2026-01-24)
+All AI-generated explanations include three pedagogical components in 2-3 Finnish sentences:
+1. Why the answer is correct
+2. Common mistakes students make
+3. Related concepts for deeper understanding
+
+Example (Math):
+> "12 × 8 = 96, koska 12 kertaa 8 on 96 (voit laskea 10×8=80 ja 2×8=16, yhteensä 96). Yleinen virhe on kertoa vain kymmenet (10×8=80) ja unohtaa loput. Tämä liittyy kertotauluihin ja hajottamismenetelmään."
+
+Cost impact: about +$0.023 per question set creation (one-time).
+
 ### Game Session Management
 - Stratified sampling by topic; fallback to random when topics are sparse.
 - Points: 10 per correct, +5 bonus when streak >= 3.
diff --git a/src/config/prompt-templates/core/format.txt b/src/config/prompt-templates/core/format.txt
index 69f57f95650b48efd45b667bf5854200397573fc..c473a165720cbc5be9e8ccdfff694d5dc0987fb4
--- a/src/config/prompt-templates/core/format.txt
+++ b/src/config/prompt-templates/core/format.txt
@@ -14,7 +14,7 @@
     "correct_order": [0, 2, 1, 3],
     "correct_answer": "oikea vastaus",
     "acceptable_answers": ["vaihtoehtoinen vastaus"],
-    "explanation": "selitys suomeksi"
+    "explanation": "Selitä suomeksi 2-3 lauseessa: 1) MIKSI tämä vastaus on oikea, 2) Mitä yleisiä virheitä oppilaat tekevät tässä, 3) Mihin muihin käsitteisiin tämä liittyy"
   }
 ]
 

tokens used
36 015
Updated the core prompt format to require richer 2–3 sentence explanations and documented the new explanation standard in `AGENTS.md`.

STATUS: success
SUMMARY: Enhanced the core format template to request richer Finnish explanations and documented the new explanation standard with an example and cost note.
CHANGED FILES:
- src/config/prompt-templates/core/format.txt
- AGENTS.md
TESTS:
- not run — template/doc change only
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
