# Plan 190 — Prompt Optimization: Topic-Batch Mode

**Date:** 2026-04-12
**Status:** Revised — two review rounds resolved; ready for implementation

### Review Findings (resolved)

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | High | Part A moved contract text into TypeScript methods, breaking `prompt_version` observability in metrics (`PromptLoader.getVersionMetadata()` only tracks loaded `.txt` files) | Steps 6–7 revised: contract text stays in versioned `.txt` files (`whole-set-tagging.txt`, `focused-batch-tagging.txt`); branching in TS is over which file to load, not over which string to return |
| 2 | High | Part B's uniform `distribution` bypass in B2 would skip backend capacity caps (`questionCapacity`, `flashcardCapacity`) and collapse separate quiz/flashcard limits into one number | B2 revised: pass `questionCount: questionsPerTopic` without `distribution`; backend's `calculateOptimalCounts` path remains active and enforces per-mode capacity caps |
| 3 | Medium | Tests targeted private methods (brittle); `TopicConfirmationDialog` topic-exclusion invariant underspecified (`onConfirm` callback unclear, no `selected` state in current code) | Test checklist revised to target public `assemblePrompt()` output; B4 adds `selected: boolean` state, at-least-one-topic invariant, and typed `onConfirm(confirmedTopics: EnhancedTopic[])` |
| 4 | Medium | Part A pros/cons and Step 5 still referred to `buildWholeSetTaggingSection()` private methods and `taggingModeSection` variable after the design moved to file loading | Pros/cons and Step 5 rewritten to match file-loading design; Step 5 now covers both `buildVariables()` and `assemblePromptWithMetadata()` changes |
| 5 | Medium | Step 7 assembly example used fictitious variable names (`systemRole`, `outputFormat`, `topicTagging`) instead of real ones from `PromptBuilder.ts:187` | Assembly example replaced with real variable names and insertion point annotated against the current module list |
| 6 | Low | Part B pros section and Goal still referenced `QUESTIONS_PER_TOPIC = 10` constant after the design moved to `calcQuestionsPerTopic()` adaptive formula | All "constant" framing replaced with adaptive formula references throughout Part B background, goal, and pros |

---

## Plan Review — Pros and Cons vs. Current Setup

### Part A — Prompt optimization

#### What the current setup does

Every generation call — whether it is a focused single-topic batch or a multi-topic whole-set call — receives the same JAKAUTUMINEN block: *"spread N questions evenly across all topics."* For a focused-batch call this is a conflicting signal: `identifiedTopics` contains only one name, but the model is told to distribute across topics. The model follows the schema correctly (all questions get the same topic) but the balancing instruction is noise. No topic boundary enforcement or anti-duplication rule exists for any call today.

#### Pros

- **Directly removes the conflicting signal** — the model no longer receives multi-topic balancing language when doing single-topic work. This is the cleanest possible fix for the root cause.
- **Backward safe** — the branch condition is `Boolean(params.focusTopic)`. Every call that does not pass `focusTopic` loads `whole-set-tagging.txt`, which preserves the current multi-topic balancing contract verbatim. No regression risk for non-batched flows.
- **Branching lives in TypeScript, contract text lives in versioned files** — `assemblePromptWithMetadata()` branches on which `.txt` file to load. Both files are tracked by `PromptLoader.getVersionMetadata()`, so changes flow into `prompt_version` in metrics. Template files are independently versionable and testable via public `assemblePrompt()` output.
- **Addresses the flashcard clustering problem** — `focused-batch-flashcard.txt` adds recall-target uniqueness and subtopic spread. Without it, a 10-card flashcard batch on "Presens" would likely cluster around the same 2–3 grammatical patterns rephrased.
- **Prompt length increase is bounded** — the focused-batch section is roughly the same token length as the replaced JAKAUTUMINEN block. Net increase is small.

#### Cons and mitigations

- **Four-layer wiring for one signal** — `focusTopic` must be added to four interfaces and forwarded through four call sites (`generate-single` route → `GenerationRequest` → `GenerateQuestionsParams` → `BuildVariablesParams`). Tedious but not risky. The real cost is future maintenance: a developer reading the chain without context may find the chain surprising.
  - *Mitigation:* Add a `// AIDEV-FOCUS-BATCH-CHAIN` comment on each interface field and call site so the chain is self-documenting. The comment identifies which fields are part of this forwarding chain, so a future developer can search for the tag rather than trace the type hierarchy.

- **Finnish prompt text is draft-quality** — the plan's prompt text is a first pass. Effectiveness depends on careful phrasing. The anti-duplication section in particular ("Älä kysy samaa faktaa kahdesti eri sanoin") is a common instruction that models sometimes interpret loosely. The text will likely need iteration after first benchmarking.
  - *Mitigation:* Define a minimal benchmark fixture before merging — two source documents (biology passage + Finnish grammar conjugation table) and a fixed topic per document. Run focused-batch generation with the new and old prompts against these fixtures and count: (a) topic drift violations, (b) near-duplicate question pairs. The fixture is small enough to check manually; the goal is a before/after comparison, not automation. Run once after Part A ships and again after any prompt text edit.

- **Regression risk when extracting `whole-set-tagging.txt`** — the new file must reproduce the current KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block exactly. A subtle whitespace or punctuation difference would change the whole-set prompt for all existing users without any visible signal.
  - *Mitigation:* Before editing `topic-tagging.txt`, capture the assembled prompt for a whole-set call via a debug log and copy the tagging block as a golden string into a test fixture. Write a test asserting `assemblePrompt(whole-set-params)` still contains that golden block after the file split. Only then remove the block from `topic-tagging.txt` and verify the test still passes against the newly extracted `whole-set-tagging.txt`.

- **Part A alone does not fully solve repetition at high per-topic counts** — with 50 total questions and 3 topics, the model still receives 17 per topic. Anti-duplication rules help, but 17 narrow-scope questions on a single topic is a lot to ask regardless of instructions.
  - *Mitigation:* Addressed by Part B. The two parts are designed to work together: Part A fixes the prompt contract, Part B reduces per-topic count to a range where the contract can be honoured. Neither is sufficient alone.

---

### Part B — Per-topic question count model

#### What the current setup does

`TopicConfirmationDialog` calls `calculateRecommendedPoolSize()` which computes `totalConcepts × 3–5 × importanceFactor`, clamped to 30–200. This number becomes the initial slider value. Admins can override the total (20–200 slider) and fine-tune per-topic counts individually. The actual per-topic allocation is `Math.round(recommendedTotal × topic.coverage × importanceMultiplier)`. After confirmation, `questionCount` state is set to this total and passed into the generation loop where `buildResolvedTopicDistribution` divides it coverage-weighted across topics.

In practice, the AI recommendation often produces inflated totals (60–120 for typical exam material), leading to 15–25 per topic for 3–5 topic sets — the core of the repetition problem.

#### Pros

- **Biggest practical impact on repetition** — for a 3-topic set on standard material (30 concepts), `calcQuestionsPerTopic(30, 3) = 10` per topic = 30 total, down from a typical AI-recommended 60. This cuts per-topic depth roughly in half. It is the single most effective lever against repetition, more so than prompt improvements alone.
- **Simpler admin UX** — no count negotiation in the confirmation dialog. The admin confirms topics, not numbers. One fewer mental model to navigate.
- **Natural scaling from material density** — `calcQuestionsPerTopic` reads `totalConcepts` from the AI analysis, so denser material automatically yields deeper coverage per topic (up to 15), and thin material yields fewer (floor 6). Total questions are an output of analysis, not an arbitrary slider choice.
- **Eliminates chunking for the main path** — `calcQuestionsPerTopic` always returns a value in [6, 15], which is always ≤ 20 (the per-batch cap). `chunkQuestionCounts` always returns a single-element array on this path; the chunking loop and its associated state (`chunkSizes`, iteration index, chunk label) can be removed from the topic-batch path entirely.
- **Uniform per-topic depth is correct for independent batches** — coverage-weighted distribution was designed for whole-set generation where one prompt produced all topics. In topic-batch mode, each call is independent; there is no shared context to benefit from reweighting. Equal depth per topic is both simpler and more conceptually appropriate.
- **Removes genuinely vestigial code** — `CapacityWarningDialog` already has a comment saying the old check was removed. The state, import, and render are dead weight.

#### Cons and mitigations

- **Loss of control for power users and rich material** — an admin with a 40-page dense textbook covering 3 topics is capped at 30 questions. Previously they could request 90+. For a school building a question bank intended for repeated use across a full term, 30 questions (2 sessions before full repetition) is constraining.
  - *Mitigation:* Replace the flat constant with the adaptive formula (see below). Dense material produces more concepts per topic → more questions per topic, up to 15. This gives rich 3-topic material 45 questions rather than 30. A follow-up depth selector (Lyhyt / Normaali / Laaja) would restore explicit admin control without resurrecting the slider. Create a follow-up issue after Part B ships.

- **2-topic edge case is thin** — `2 × 10 = 20` questions means students see everything in 1.3 play sessions. Repetition starts on the second session. The current setup with `calculateRecommendedPoolSize` would produce a larger bank for a rich 2-topic document.
  - *Mitigation:* The adaptive formula addresses this for concept-rich material: a dense 2-topic document with 30 total concepts gets `Math.round(30 / 2) = 15` per topic = 30 questions (2 sessions). For genuinely thin material, 20 questions is the correct honest output. Show the estimated session count in the `TopicConfirmationDialog` so the admin can see this before confirming — e.g., "~1.3 kierrosta" — giving them the option to add more topics or accept the result.

- **Adaptive formula is not calibrated across subject types** — flashcard vocabulary sets benefit from larger banks (each card is a single word pair; 10 cards per topic is few). Grammar rule flashcards and quiz sets on applied mathematics may need different depths.
  - *Mitigation:* The formula's range [6, 15] covers the practical variation. Vocabulary sets tend to produce many concepts per topic (20–30 words = `Math.round(25/1) = 15`, capped). Grammar rule sets produce fewer concepts per narrow topic (5–8 rules = `Math.round(6/1) = 6–8`). This self-calibrates better than a flat constant. If a specific subject type consistently under- or over-shoots, adjust `MIN`/`MAX` bounds — a one-line change.

- **mode='both' effect is non-obvious** — a 4-topic set in both modes produces 40 quiz + 40 flashcard = 80 questions. The admin never explicitly chose 80 questions; it is an emergent result of topic count × mode × per-topic count.
  - *Mitigation:* Show the breakdown explicitly in `TopicConfirmationDialog`. When `mode === 'both'`, display: "Luodaan N × Q tietovisa + N × Q muistikortti = X yhteensä" instead of a single total. This makes the multiplication visible and expected rather than surprising.

- **Adaptive formula removes the over-inflated AI recommendation but not all richness signal** — `calculateRecommendedPoolSize` reads `totalConcepts` from the AI's topic analysis. The adaptive formula retains this signal in a bounded form.
  - *Note:* This con is resolved by the adaptive formula. The formula uses `totalConcepts / topics.length` directly, so material density still drives per-topic depth. The only change is the cap at 15 — the old uncapped formula could produce 30–50 per topic from dense material, which was the source of repetition. The cap is intentional.

- **Extend-set inconsistency** — after Part B, topic-batch creation is count-free but extend-set still offers a manual question count slider (5–50). Two creation paths with different mental models in the same UI.
  - *Mitigation:* Out of scope for Part B but not acceptable long-term. File a follow-up issue: align extend-set to the same per-topic model — remove its slider and default to `QUESTIONS_PER_TOPIC_DEFAULT` (the median of the formula range, ~10) per added topic. Until then, document the inconsistency with an `// AIDEV-EXTEND-SET-INCONSISTENCY` comment in the extend-set code path.

#### Adaptive formula (replaces flat constant)

Rather than `QUESTIONS_PER_TOPIC = 10`, compute per-topic depth from the analysis data already available:

```ts
const QUESTIONS_PER_TOPIC_MIN = 6;
const QUESTIONS_PER_TOPIC_MAX = 15;

// concepts per topic, clamped to [MIN, MAX]
const questionsPerTopic = Math.min(
  QUESTIONS_PER_TOPIC_MAX,
  Math.max(QUESTIONS_PER_TOPIC_MIN, Math.round(totalConcepts / topics.length))
);
```

The `topicAnalysis.metadata.totalConcepts` field is already available in `TopicConfirmationDialog`. This formula:
- preserves the material-richness signal from the AI analysis
- keeps per-topic depth in [6, 15], which is always below the 20-per-batch cap (chunking remains dead code)
- self-calibrates: vocabulary topics get more cards, narrow grammar topics get fewer
- resolves the 2-topic thin-edge case for concept-rich material

**This formula replaces `QUESTIONS_PER_TOPIC = 10` in all Part B implementation steps below.**

---

### Overall verdict

**Part A is a clean, well-scoped improvement.** The main work is careful wiring and rigorous backward-compatibility testing. Ship it.

**Part B: implement with the adaptive formula, not the flat constant.** The adaptive formula `Math.min(15, Math.max(6, Math.round(totalConcepts / topics.length)))` addresses all material edges (vocabulary, dense textbooks, 2-topic sets) while keeping chunking dead code (max 15 ≤ 20 cap). The flat `QUESTIONS_PER_TOPIC = 10` is superseded. The formula's inputs (`totalConcepts`, `topics.length`) are already available in `TopicConfirmationDialog` from the topic analysis result. All references to `QUESTIONS_PER_TOPIC = 10` in the implementation steps below should be read as this formula.

---

## Background

Koekertaaja generates question sets in two modes:

**Whole-set mode (original):** One API call produces all questions for a set. The model receives the full topic list and is instructed to distribute questions evenly across topics. The prompt uses balancing language: *"divide N questions as evenly as possible across all topics."*

**Topic-batch mode (current runtime):** One API call produces questions for a single topic only. The set orchestrator calls `generate-single` once per topic, each time narrowing the scope to one topic. This is the mode used when a creator selects individual topics on the create page.

The prompt system was partially updated for topic-batch mode: the runtime correctly narrows `identifiedTopics` to a single element and passes a `focusTopic` object. But the prompt itself is still assembled as if it is producing a whole-set balanced output. The model receives:

- a JAKAUTUMINEN (distribution) block telling it to spread questions evenly across topics — but there is only one topic
- no instruction to stay within one topic boundary
- no anti-duplication rules for the narrower scope
- in flashcard mode, no guidance that all cards will be on the same concept space

This mismatch does not break generation, but it leaves quality on the table: topic drift, redundant question pairs, and wasted prompt space.

---

## Goal

When `generate-single` is called with a `focusTopic`, the assembled AI prompt must reflect a **focused-batch contract** instead of a whole-set balancing contract. Specifically:

- the topic-tagging section enforces topic boundary ("all questions must have topic = X")
- the cross-topic balancing language is suppressed
- anti-duplication and subtopic-spread instructions are added
- flashcard mode adds within-batch recall-target uniqueness rules

None of this must affect prompts assembled without `focusTopic`.

---

## Non-Goals

- Changes to the `generate-single` route schema or how `focusTopic` is extracted from the request body — already correct in the route.
- Changes to topic identification (`topicIdentifier.ts`) or distribution calculation (`questionDistribution.ts`).
- UI changes, database schema changes, quiz set orchestration.
- Multi-topic batching strategies (assigning N topics to M parallel calls).

---

## Architecture Findings (Verified)

### The `focusTopic` signal is dropped at the route boundary

The route correctly computes `topicForGeneration = payload.focusTopic?.name` and `identifiedTopicsForGeneration = [payload.focusTopic.name]`, but `focusTopic` as a named field is **never added to `baseRequest`** and therefore never reaches `generateQuestions()` or `assemblePromptWithMetadata()`. `BuildVariablesParams` has no `focusTopic` field.

The consequence: the prompt builder cannot distinguish a focused-batch call from a whole-set call with only one topic. It assembles the same prompt in both cases.

### `questionsPerTopic` is arithmetically correct but contextually misleading

`buildVariables()` computes `questionsPerTopic = Math.ceil(questionCount / effectiveTopicCount)`. When `identifiedTopics = ['Fotosynteesi']` (one topic), `effectiveTopicCount = 1`, so `questionsPerTopic = questionCount`. The number is right, but the JAKAUTUMINEN block still says *"spread questions across topics"* — which is nonsense when there is only one topic. The model gets conflicting signals: "you are generating for one topic" (from `identifiedTopics`) and "balance across topics" (from JAKAUTUMINEN).

### `distribution_section` is already unused in core templates

The `distribution_section` variable is computed in `buildVariables()` and placed in the substitution map, but `{{distribution_section}}` does not appear in the currently reviewed core templates (`topic-tagging.txt`, `format.txt`, `flashcard-rules.txt`). It may appear in a subject-type template. Suppressing it for focused calls is a defensive measure rather than a confirmed fix.

---

## The Two Prompt Contracts

It helps to think of this as two different contracts the model signs:

**Whole-set contract:** "You are generating a complete, balanced question set. There are N topics. Spread the questions evenly. Use only the topic names I have listed. Vary by subtopic and skill."

**Focused-batch contract:** "You are generating one topic's worth of questions. All questions must be tagged with exactly this one topic. Do not drift. Within this topic, vary by subtopic, skill, and difficulty. Do not repeat the same fact twice."

These are different jobs. The whole-set contract optimises for breadth. The focused-batch contract optimises for depth and internal consistency. The current prompt gives the model the whole-set contract regardless of which job it is actually doing.

---

## Implementation Steps

### Step 1 — Add `focusTopic` to `BuildVariablesParams`

**File:** `src/lib/prompts/PromptBuilder.ts` (lines 12–32)

```ts
focusTopic?: string; // name of the focused topic when in topic-batch mode
```

**Why:** `BuildVariablesParams` is the only input to `assemblePromptWithMetadata`. Without this field, no conditional logic downstream can know the call is in focus mode. The type is `string` (topic name only) — the builder does not need the full `EnhancedTopic` object.

---

### Step 2 — Add `focusTopic` to `GenerateQuestionsParams`

**File:** `src/lib/ai/questionGenerator.ts`

```ts
focusTopic?: string;
```

In `generateQuestions()`, destructure `focusTopic` from params and forward to `builder.assemblePrompt({..., focusTopic})`.

**Why:** `generateQuestions()` is the function that calls the prompt builder. It needs `focusTopic` in its own params to pass it through.

---

### Step 3 — Add `focusTopic` to `GenerationRequest` and forward through both generation functions

**File:** `src/lib/api/questionGeneration.ts`

```ts
focusTopic?: string;
```

In `generateQuizSets()`, add `focusTopic: request.focusTopic` to the `generateQuestions({...})` call.

In `generateFlashcardSet()`, add `focusTopic: request.focusTopic` to the `generateQuestions({...})` call.

**Why:** `GenerationRequest` is the shared shape passed from the route to the generation helpers. Both quiz and flashcard paths go through separate functions; both need the field.

---

### Step 4 — Forward `focusTopic` from the route into the request object

**File:** `src/app/api/generate-single/route.ts`

In the `baseRequest` object:

```ts
focusTopic: payload.focusTopic?.name,
```

**Why:** This is where the signal is currently dropped. The route already extracts `payload.focusTopic?.name` for other purposes (narrowing the topic list, filtering distribution). Adding it to `baseRequest` completes the chain from request payload → prompt template.

---

### Step 5 — Add focused-mode branching in `buildVariables()` and `assemblePromptWithMetadata()`

**File:** `src/lib/prompts/PromptBuilder.ts`

**In `buildVariables()`:** After the existing `questionsPerTopic` calculation, add the `isFocusedBatch` flag, override `questionsPerTopic` for single-topic calls, suppress `distributionSection`, and add `focus_topic` to the variables map:

```ts
const isFocusedBatch = Boolean(params.focusTopic);
const focusTopicName = params.focusTopic ?? '';

// All questions go to this one topic; per-topic division is not needed.
const questionsPerTopic = isFocusedBatch
  ? String(params.questionCount)
  : String(Math.ceil(params.questionCount / effectiveTopicCount));

// Suppress the cross-topic distribution table for focused calls — it frames the task
// as multi-topic balancing even when there is only one topic. // AIDEV-FOCUS-BATCH-CHAIN
const distributionSection = isFocusedBatch
  ? ''
  : (params.distribution ? this.formatDistributionSection(params.distribution) : '');

// Add to returned variables map:
focus_topic: focusTopicName,
```

**In `assemblePromptWithMetadata()`:** Add conditional loading of the mode-appropriate tagging file. The branching is over which file to load; content stays in the versioned templates.

```ts
// AIDEV-FOCUS-BATCH-CHAIN: load tagging contract based on focus mode
const taggingModeModule = params.focusTopic
  ? await this.loader.loadModule('core/focused-batch-tagging.txt')
  : await this.loader.loadModule('core/whole-set-tagging.txt');

const focusedBatchFlashcardRules =
  mode === 'flashcard' && Boolean(params.focusTopic)
    ? await this.loader.loadModule('core/focused-batch-flashcard.txt')
    : '';
```

**Why:** `isFocusedBatch` is the single mode switch. `buildVariables()` handles the variable-map consequences (suppressed distribution, correct per-topic number, `focus_topic` substitution value). `assemblePromptWithMetadata()` handles the module-assembly consequences (which tagging file, whether to include flashcard anti-duplication). The two concerns are kept in their natural homes — variables in `buildVariables`, module loading in `assemblePromptWithMetadata`.

The `distributionSection` suppression prevents a cross-topic distribution table being rendered for a single-topic call. Even if arithmetically correct (one topic, 100%), it frames the task as multi-topic balancing — the wrong contract.

---

### Step 6 — Extract the tagging contracts to versioned template files

**Why not TypeScript strings:** The original plan put the contract text in TypeScript methods. The review identified that `PromptLoader.getVersionMetadata()` only tracks loaded `.txt` files (line 149 of `PromptLoader.ts`). Text that lives in TypeScript is invisible to the version tracking pipeline — changing it would not update `prompt_version` in `prompt_metrics`, breaking A/B comparison and regression tracking in the metrics dashboard. The fix is to keep contract text in versioned `.txt` files and branch in TypeScript only over which file to load.

**New file:** `src/config/prompt-templates/core/whole-set-tagging.txt`

Extract the KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block verbatim from the current `topic-tagging.txt` and add a version header:

```
# Version: 1.0.0
# Last Updated: 2026-04-12
# Author: System
# Changes: Extracted from topic-tagging.txt — whole-set multi-topic balancing contract
# Breaking: false

KÄYTÄ NÄITÄ TUNNISTETTUJA AIHEITA ({{topic_count}} kpl):
{{topics_list}}

SÄÄNNÖT:
- Jokaisessa kysymyksessä/kortissa on topic.
- Topic-arvo on yksi yllä olevista nimistä täsmälleen samalla kirjoitusasulla.
- Älä keksi uusia topic-arvoja.
- subtopic on vapaaehtoinen tarkenne.

JAKAUTUMINEN:
- Tavoite: noin {{questions_per_topic}} kysymystä per topic.
- Jaa {{question_count}} kysymystä mahdollisimman tasaisesti.
- Sallittu vaihtelu: enintään noin 2-3 kysymystä per topic laatu edellä.
```

The placeholders `{{topic_count}}`, `{{topics_list}}`, `{{questions_per_topic}}`, `{{question_count}}` are already in the variables map from `buildVariables()`. No new variables are needed.

**New file:** `src/config/prompt-templates/core/focused-batch-tagging.txt`

```
# Version: 1.0.0
# Last Updated: 2026-04-12
# Author: System
# Changes: New — focused single-topic batch contract for topic-batch generation mode
# Breaking: false

TÄMÄ ERÄ KOSKEE VAIN AIHETTA: "{{focus_topic}}"

AIHEEN RAJAUS:
- Kaikkien {{question_count}} kysymyksen topic-kenttä on täsmälleen "{{focus_topic}}".
- Älä käytä muita topic-arvoja tässä erässä.
- Älä luo kysymyksiä muista aiheista, vaikka materiaali sivuaisi niitä.

MONIPUOLISUUS AIHEEN SISÄLLÄ:
- Vaihtele subtopic-kenttää: kata eri alateemoja ennen kuin palaat samaan.
- Vaihtele skill-kenttää: älä käytä samaa taitoa kaikkiin kysymyksiin.
- Vaihtele difficulty-kenttää: sisällytä helppo, normaali ja vaikea -tasoja.
- Jokainen kysymys/kortti testaa eri asiaa tai näkökulmaa saman aiheen sisällä.

TOISTON VÄLTTÄMINEN:
- Älä kysy samaa faktaa kahdesti eri sanoin.
- Jos subtopic on jo katettu, siirry seuraavaan ennen kuin palaat.

SÄÄNNÖT:
- Topic-arvo on täsmälleen "{{focus_topic}}" jokaisessa kysymyksessä/kortissa.
- subtopic on suositeltava tarkenne — käytä sitä erottamaan alateemoja.
```

Add `focus_topic` to the variables map in `buildVariables()`:
```ts
focus_topic: params.focusTopic ?? '',
```

**`PromptBuilder.ts` — conditional loading in `assemblePromptWithMetadata()`:**

Instead of private methods returning strings, load the appropriate file as a module:

```ts
const taggingModeModule = params.focusTopic
  ? await this.loader.loadModule('core/focused-batch-tagging.txt')
  : await this.loader.loadModule('core/whole-set-tagging.txt');
```

Add `taggingModeModule` to the `concatenateModules` array immediately after `topicTagging`.

**Why:** Both files are loaded through `PromptLoader.loadModule()`, which registers them in `moduleVersions`. When either file's version header is updated, `getVersionMetadata()` returns the new version string and it flows into `prompt_version` in `prompt_metrics`. Changing the focused-batch contract text → bump `focused-batch-tagging.txt` version → metrics dashboard shows the version change and allows before/after quality comparison.

The focused-batch section has three distinct responsibilities in the template:
- **AIHEEN RAJAUS** — topic boundary enforcement
- **MONIPUOLISUUS** — depth variety within the single topic
- **TOISTON VÄLTTÄMINEN** — anti-duplication for narrow scope

---

### Step 7 — Update `topic-tagging.txt` to preamble-only (bump to v2.0.0)

**File:** `src/config/prompt-templates/core/topic-tagging.txt`

Remove the KÄYTÄ / SÄÄNNÖT / JAKAUTUMINEN block — it now lives in `whole-set-tagging.txt`. The file retains the preamble that applies to both modes and bumps its version to signal the structural change:

```
# Version: 2.0.0
# Last Updated: 2026-04-12
# Author: System
# Changes: Extracted KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN to whole-set-tagging.txt; focused-batch contract in focused-batch-tagging.txt
# Breaking: false

TOPIC-TAGGING (PAKOLLINEN)
- Topic = sisältöalue (mistä kysymys kertoo).
- Skill = toiminto/taito (mitä oppilas tekee).
- Katso erotus-esimerkit tiedostosta topic-skill-guide.txt.

{{concept_dependency_section}}
```

**Assembly in `assemblePromptWithMetadata()`:** Insert `taggingModeModule` immediately after `topicRules` in the existing `concatenateModules` call (real variable names from `PromptBuilder.ts:187–199`):

```ts
const assembled = this.concatenateModules([
  format,                    // core/format.txt
  topicRules,                // core/topic-tagging.txt  (preamble only after v2.0.0)
  taggingModeModule,         // whole-set-tagging.txt OR focused-batch-tagging.txt  ← new
  skillTagging,              // core/skill-tagging.txt
  difficultyRubric,          // core/difficulty-rubric.txt
  skillTaxonomy,             // subject-specific skill taxonomy
  typeRules,                 // types/<subjectType>.txt
  curriculum,                // subject/grade curriculum
  distributions,             // subject/difficulty/mode distributions
  flashcardRules,            // core/flashcard-rules.txt (mode=flashcard only)
  focusedBatchFlashcardRules,// core/focused-batch-flashcard.txt (focused flashcard only) ← new
  languageFlashcardRules,    // core/language-flashcard-rules.txt (language flashcard only)
  ruleBasedEmphasis,         // inline string for rule-based subjects
]);
```

**Why:** `topic-tagging.txt` retains a version header so PromptLoader still tracks it. The version bump to 2.0.0 signals a structural change in the dashboard's "Breaking" badge. Both `whole-set-tagging.txt` and `focused-batch-tagging.txt` are also version-tracked. Together the three files give the metrics dashboard full visibility: changing the focused-batch contract text → bump `focused-batch-tagging.txt` to v1.1.0 → the Prompt Version table shows the new version with its own validation rate row for A/B comparison.

The `{{topics_list}}`, `{{topic_count}}`, and `{{questions_per_topic}}` placeholders move into `whole-set-tagging.txt`. Keep them in the variables map for any subject-type templates that might reference them directly.

---

### Step 8 — Add `focused-batch-flashcard.txt` for flashcard-specific anti-duplication

**Why a separate file is needed:** The existing `flashcard-rules.txt` covers format constraints (type must be `flashcard`, no fill-blank syntax, one concept per card). It was written for whole-set generation, where variety comes naturally from the breadth of topics. In a focused batch, every card is about the same topic. Without additional rules, the model tends to cluster: testing the same grammatical rule multiple times with slightly different wording, or returning nearly identical recall targets with surface-level rephrasing.

**File:** `src/config/prompt-templates/core/focused-batch-flashcard.txt` (new)

```
# Version: 1.0.0
# Last Updated: 2026-04-12
# Author: System
# Changes: New — focused-batch anti-duplication rules for flashcard mode
# Breaking: false

FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT:

Tämä erä kattaa vain yhden aiheen. Laadun kannalta on kriittistä, että kortit ovat keskenään erilaisia:

MUISTAMISEN KOHDE (recall target):
- Jokaisella kortilla on eri muistamisen kohde.
- "Muistamisen kohde" = se asia, jonka question-kenttä edellyttää oppilaan muistavan.
- Väärin: kaksi korttia, joissa molemmissa kysytään samaa termiä eri sanoin.
- Oikein: yksi kortti per termi, yksi kortti per sääntö, yksi kortti per kaava.

ALATEEMOJEN JÄRJESTYS:
- Käy alateemoja (subtopic) järjestyksessä läpi: kata ensin eri alateemoja
  ennen kuin palaat aiemmin käytettyyn alateemaan.
- Älä klusteroi kaikkia kortteja yhteen alateemaan.

TAITOJEN VAIHTELU:
- Älä käytä samaa skill-arvoa kaikissa korteissa.
- Vaihtele taitoarvoja: recall, define, explain, apply, compare jne.

VAIKEUDEN JAKAUMA:
- Sisällytä eri vaikeustasoja: helppo, normaali ja vaikea.
- Älä tee kaikkia kortteja samalla vaikeustasolla.
```

**File:** `src/lib/prompts/PromptBuilder.ts`

In `assemblePromptWithMetadata()`, after the `flashcardRules` loading block:

```ts
const focusedBatchFlashcardRules =
  mode === 'flashcard' && Boolean(params.focusTopic)
    ? await this.loader.loadModule('core/focused-batch-flashcard.txt')
    : '';
```

Add to `concatenateModules` array, after `flashcardRules`:

```ts
flashcardRules,
focusedBatchFlashcardRules,
languageFlashcardRules,
ruleBasedEmphasis,
```

---

## Backward Compatibility

The following must be unaffected for calls without `focusTopic`:

1. **`buildWholeSetTaggingSection()` must reproduce the current `topic-tagging.txt` text exactly.** The output string of this method (given the same inputs) must be character-for-character identical to the old KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block. Write a unit test before touching the old template so you can compare against a golden string.

2. **`distributionSection` is suppressed only when `isFocusedBatch === true`.** Non-focused calls with `params.distribution` set must still call `formatDistributionSection()` and render its output.

3. **`questionsPerTopic` formula is unchanged for non-focused calls.**

4. **`focused-batch-flashcard.txt` loads only when both `mode === 'flashcard'` AND `params.focusTopic` is truthy.** Whole-set flashcard calls must not receive it.

5. **`{{concept_dependency_section}}` continues to render in both modes.** It sits outside the mode-branched section and must not be accidentally dropped.

6. **`topics_list`, `topic_count`, `questions_per_topic` stay in the variables map** even if `topic-tagging.txt` no longer references them directly, to avoid breaking subject-type templates.

---

## Test / Benchmark Checklist

### Unit tests (run before and after)

All tests target the public `assemblePrompt()` output — not private methods or internal state. This avoids coupling tests to implementation details that may change.

**Backward compatibility — whole-set contract unchanged:**
- [ ] `assemblePrompt({ identifiedTopics: ['Fotosynteesi', 'Soluhengitys'], questionCount: 20, focusTopic: undefined })`: assembled text contains "KÄYTÄ NÄITÄ TUNNISTETTUJA AIHEITA (2 kpl)" and "JAKAUTUMINEN"; does NOT contain "TÄMÄ ERÄ KOSKEE".
- [ ] Same call without `focusTopic`: assembled text contains `distributionSection` output (non-empty table); does NOT contain "FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT".

**Focused-batch quiz contract:**
- [ ] `assemblePrompt({ focusTopic: 'Fotosynteesi', questionCount: 10, mode: 'quiz' })`: assembled text contains `topic-kenttä on täsmälleen "Fotosynteesi"` and "TOISTON VÄLTTÄMINEN"; does NOT contain "JAKAUTUMINEN".
- [ ] Same call: `distributionSection` is absent (not rendered) in the assembled text.

**Focused-batch flashcard contract:**
- [ ] `assemblePrompt({ focusTopic: 'Presens', questionCount: 10, mode: 'flashcard' })`: assembled text contains "FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT".
- [ ] `assemblePrompt({ focusTopic: undefined, questionCount: 20, mode: 'flashcard' })`: assembled text does NOT contain "FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT".

**Version observability:**
- [ ] After `assemblePrompt()` with `focusTopic` set, `loader.getVersionMetadata()` includes a key for `'core/focused-batch-tagging.txt'` with a non-empty version string.
- [ ] After `assemblePrompt()` without `focusTopic`, `loader.getVersionMetadata()` includes `'core/whole-set-tagging.txt'` but NOT `'core/focused-batch-tagging.txt'` (it was not loaded).

### Integration / quality benchmark (manual)

- [ ] **Topic boundary:** Focused batch of 5 quiz questions for "Fotosynteesi" from biology material that also contains "Soluhengitys". All 5 returned questions have `topic === "Fotosynteesi"`, none have `topic === "Soluhengitys"`.
- [ ] **Flashcard uniqueness:** Focused batch of 5 flashcards for "Presens" from Finnish grammar material. All 5 have `topic === "Presens"`. No two cards test the same grammatical feature. At least 2 distinct `subtopic` values. At least 2 distinct `difficulty` values.
- [ ] **Whole-set unchanged:** Whole-set quiz (no `focusTopic`) from the same biology material. Both "Fotosynteesi" and "Soluhengitys" appear in the output. The assembled prompt (debug log) contains the JAKAUTUMINEN block.
- [ ] **No bleed for whole-set flashcards:** Whole-set flashcard call without `focusTopic`. The assembled prompt does NOT contain "FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT".
- [ ] **Multi-topic orchestration:** 3 back-to-back focused batches for different topics from the same material. Each batch's `topic` field is 100% consistent with the requested topic. No cross-topic contamination across batches.

---

## Priority Order

1. **Steps 1–5** — wire `focusTopic` through the call chain and add branching in `buildVariables()`. This is the prerequisite for everything else and is purely additive with no risk to existing calls.
2. **Steps 6–7** — implement the two tagging section methods and update the template. This activates the focused-batch contract.
3. **Step 8** — flashcard anti-duplication. Incremental improvement on top of the topic boundary fix.
4. **Benchmark** — run the quality checklist, iterate on prompt text if needed. The technical structure should not need to change; tuning lives in the Finnish text of the prompt sections.

---

## Critical Files — Part A

| File | Change type |
|---|---|
| `src/lib/prompts/PromptBuilder.ts` | Modify — add `focusTopic` to interface and variables map, branching in `buildVariables()` and `assemblePromptWithMetadata()` to load mode-appropriate tagging file, load `focused-batch-flashcard.txt` conditionally |
| `src/lib/ai/questionGenerator.ts` | Modify — add `focusTopic` to params interface, forward to builder |
| `src/lib/api/questionGeneration.ts` | Modify — add `focusTopic` to `GenerationRequest`, forward in `generateQuizSets()` and `generateFlashcardSet()` |
| `src/app/api/generate-single/route.ts` | Modify — add `focusTopic: payload.focusTopic?.name` to `baseRequest` |
| `src/config/prompt-templates/core/topic-tagging.txt` | Modify (v2.0.0) — remove KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block (moved to `whole-set-tagging.txt`); retain preamble only |
| `src/config/prompt-templates/core/whole-set-tagging.txt` | **New file (v1.0.0)** — extracted KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block with version header |
| `src/config/prompt-templates/core/focused-batch-tagging.txt` | **New file (v1.0.0)** — focused single-topic batch contract with `{{focus_topic}}` placeholder |
| `src/config/prompt-templates/core/focused-batch-flashcard.txt` | **New file (v1.0.0)** — flashcard anti-duplication rules for focused batches |

---

---

# Part B — Per-Topic Question Count Model

## Background

The current model asks the admin to specify a total question count (default: 50, min: 20, max: 200). This total is then divided across identified topics by coverage-weighted distribution. The `TopicConfirmationDialog` lets the admin adjust per-topic counts manually before generation starts.

This model has two problems:

**Repetition risk scales with topic count, not total count.** An admin creating a set with 3 topics at 50 total gets ~17 questions per topic. The topic-batch prompt — especially before the Part A improvements — struggles to produce 17 non-repetitive questions for a narrow topic. With 5 topics at 50 total, it's 10 per topic, which is far more manageable.

**The total count slider is conceptually confusing.** Admins must reason about "how many questions across how many topics" — a two-variable problem. The play session (`examLength`) is already a separate slider capped at 20. Having a separate total-size slider with a range of 20–200 invites arbitrary choices that have no clear meaning to the creator.

**The natural model is per-topic depth, not total breadth.** With topic-batch generation, each topic is generated independently. The right question to ask is "how deeply should each topic be covered?" not "how large should the whole bank be?"

## Goal for Part B

Replace the fixed total-question-count model with `calcQuestionsPerTopic(totalConcepts, topicCount)`. Total questions become an output of topic analysis, not an input from the admin:

```
questionsPerTopic = calcQuestionsPerTopic(totalConcepts, topicCount)  // range [6, 15]
total = confirmedTopics.length × questionsPerTopic
```

The question amount slider is removed from the create form UI. The `TopicConfirmationDialog` is simplified to topic selection/confirmation only — no count adjustments.

## Per-Topic Depth Formula

```ts
// src/config/generationConfig.ts  (extract here so TopicConfirmationDialog and CreatePageClient share it)
export const QUESTIONS_PER_TOPIC_MIN = 6;
export const QUESTIONS_PER_TOPIC_MAX = 15;

export function calcQuestionsPerTopic(totalConcepts: number, topicCount: number): number {
  return Math.min(
    QUESTIONS_PER_TOPIC_MAX,
    Math.max(QUESTIONS_PER_TOPIC_MIN, Math.round(totalConcepts / topicCount))
  );
}
```

**Rationale:** The adaptive formula reads concept density from the AI's own analysis, keeps per-topic depth in [6, 15], and is always below the 20-per-batch cap — so chunking is never triggered. Representative outputs:

| Material | Topics | Total concepts | Per topic | Total questions |
|---|---|---|---|---|
| Thin vocabulary list | 2 | 10 | 6 (floor) | 12 |
| Typical grammar chapter | 3 | 18 | 6 | 18 |
| Standard exam material | 3 | 30 | 10 | 30 |
| Dense textbook section | 3 | 45 | 15 (cap) | 45 |
| Standard exam, 5 topics | 5 | 40 | 8 | 40 |
| Rich material, 5 topics | 5 | 75 | 15 (cap) | 75 |

For `mode = 'both'` (quiz + flashcard), each mode calls `calcQuestionsPerTopic` independently — a 3-topic standard set produces 30 quiz + 30 flashcard questions (60 total, shown as a breakdown in the dialog).

Place the function in `src/config/generationConfig.ts`. Both `TopicConfirmationDialog.tsx` (for the preview label) and `CreatePageClient.tsx` (for the actual count passed to generation) import it from this single location.

---

## Part B Implementation Steps

### B1 — Add `generationConfig.ts`, remove `defaultQuestionCounts` and `questionCount` state

**New file:** `src/config/generationConfig.ts`

```ts
export const QUESTIONS_PER_TOPIC_MIN = 6;
export const QUESTIONS_PER_TOPIC_MAX = 15;

/** Per-topic depth derived from material concept density, clamped to [MIN, MAX]. */
export function calcQuestionsPerTopic(totalConcepts: number, topicCount: number): number {
  return Math.min(
    QUESTIONS_PER_TOPIC_MAX,
    Math.max(QUESTIONS_PER_TOPIC_MIN, Math.round(totalConcepts / topicCount))
  );
}
```

**File:** `src/components/create/CreatePageClient.tsx`

Remove:
```ts
const defaultQuestionCounts = { min: 20, max: 200, default: 50 };
const [questionCount, setQuestionCount] = useState(defaultQuestionCounts.default);
```

Add import:
```ts
import { calcQuestionsPerTopic } from '@/config/generationConfig';
```

**Why:** `questionCount` is the total that was previously passed through the generation chain. With the new model, per-topic count is derived from the AI analysis result at generation time, not stored as state. Extracting to `generationConfig.ts` means `TopicConfirmationDialog` can import the same function to show the preview label without duplicating the formula.

---

### B2 — Pass per-topic depth as `questionCount`; do NOT pass pre-built `distribution`

**File:** `src/components/create/CreatePageClient.tsx`

In `handleSubmit`, compute the per-topic count from the analysis result and pass it as `questionCount` to each `generate-single` call:

```ts
// AIDEV-FOCUS-BATCH-CHAIN: questionsPerTopic is the requested upper-bound per call.
// The backend's calculateOptimalCounts() will cap against topic.questionCapacity /
// topic.flashcardCapacity if the material cannot support this many questions.
const questionsPerTopic = calcQuestionsPerTopic(
  topicAnalysis.metadata.totalConcepts,
  session.topics.length
);
```

When building the payload for each `generate-single` call, set `questionCount: questionsPerTopic` and **do NOT set `distribution`**:

```ts
// Good: let backend compute distribution and cap by capacity
{
  questionCount: questionsPerTopic,
  focusTopic: topic,
  // no `distribution` key — backend uses calculateOptimalCounts([singleTopic], questionsPerTopic)
}

// Bad (bypasses backend capacity safeguards):
{
  distribution: [{ topic: topic.name, targetCount: questionsPerTopic, ... }],
}
```

**Why — backend capacity safeguard:**
In `generateQuizSets` and `generateFlashcardSet` (`questionGeneration.ts:489`, `questionGeneration.ts:804`), when `request.distribution` is present the function uses it directly and skips `calculateOptimalCounts`. That function caps quiz counts using `topic.questionCapacity` and flashcard counts using `topic.flashcardCapacity` (`questionDistribution.ts:45`). Bypassing it means asking the model for more questions than the topic material can support without repetition.

By passing only `questionCount` (no `distribution`), the backend path enters the `else if (enhancedTopics)` branch, runs `calculateOptimalCounts([singleTopic], questionsPerTopic)`, and caps the count if `topic.questionCapacity < questionsPerTopic`. The resulting distribution is then passed into the prompt. The UI computed a good starting point; the backend enforces the material constraint.

**Why `mode = 'both'` is handled correctly:**
For `mode = 'both'`, the orchestrator makes separate quiz and flashcard `generate-single` calls. Each call passes the same `questionsPerTopic`. The backend computes `quizCount = Math.min(topic.questionCapacity, questionsPerTopic)` and `flashcardCount = Math.min(topic.flashcardCapacity, questionsPerTopic)` independently. Quiz and flashcard totals may differ if the topic's capacities differ — which is the correct behavior.

**Remove `buildResolvedTopicDistribution` from the topic-batch path entirely.** It was designed for whole-set calls and is no longer used in this path. Keep it for the extend-set flow if it uses it.

---

### B3 — Remove `questionCountOverride` from `handleTopicConfirmation`

**File:** `src/components/create/CreatePageClient.tsx`

`handleTopicConfirmation` currently calls:
```ts
setQuestionCount(totalQuestions);
void handleSubmit({ questionCountOverride: totalQuestions, ... });
```

With the new model, `totalQuestions` is no longer passed in from the dialog. The callback signature changes from:

```ts
onConfirm: (totalQuestions: number, topicDistribution: Array<{ topic: string; count: number }>) => void
```

to:

```ts
onConfirm: (confirmedTopics: string[], confirmedEnhancedTopics: EnhancedTopic[]) => void
```

`handleTopicConfirmation` just forwards the confirmed topics into `handleSubmit`. `effectiveQuestionCount` is derived inside `handleSubmit` from `session.topics.length × QUESTIONS_PER_TOPIC`.

---

### B4 — Simplify `TopicConfirmationDialog`

**File:** `src/components/create/TopicConfirmationDialog.tsx`

**Remove:**
- `totalQuestions` state and the total-questions slider
- `handleTotalChange` function
- Per-topic question count sliders (`handleTopicAdjust`, `adjustedQuestions`)
- `calculateRecommendedPoolSize()` function (which computed 3–5× concepts)
- `recommendedQuestions` field on `TopicWithQuestions`
- `initialQuestionCount` prop
- The total-mismatch warning (`totalMismatch`)

**Keep:**
- Topic list with name, importance badge, subtopics preview
- Ability to deselect/exclude individual topics (if this exists; add if not)
- Confirm / Cancel buttons

**Updated prop interface:**
```ts
interface TopicConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Receives only the confirmed (selected) EnhancedTopics, not question counts.
  onConfirm: (confirmedTopics: EnhancedTopic[]) => void;
  topicAnalysis: TopicAnalysisResult;
  mode: 'quiz' | 'flashcard' | 'both';
  examLength: number; // play session size, for session-count preview
}
```

**Topic exclusion — add `selected` state:**

The current dialog has no topic-exclusion capability (`TopicConfirmationDialog.tsx:40` initialises topics with no `selected` field). Add it:

```ts
interface TopicWithState extends EnhancedTopic {
  selected: boolean;
}

const [topics, setTopics] = useState<TopicWithState[]>([]);

// initialise: all topics selected
const topicsWithState = topicAnalysis.topics.map(t => ({ ...t, selected: true }));
```

Show each topic as a toggleable row (click or checkbox). Confirm button is disabled when zero topics are selected:

```ts
const selectedTopics = topics.filter(t => t.selected);
const canConfirm = selectedTopics.length >= 1;  // invariant: at least one topic required
```

`handleConfirm` passes only selected topics:
```ts
const handleConfirm = () => onConfirm(topics.filter(t => t.selected));
```

**Updated dialog description:** Change "Tarkista ja säädä kysymysmääriä ennen luontia" → "Tarkista tunnistetut aihealueet ennen luontia" (review identified topics before creation).

**Generation preview block** — recompute whenever selection changes:

```ts
const questionsPerTopic = calcQuestionsPerTopic(
  topicAnalysis.metadata.totalConcepts,
  selectedTopics.length   // use selected count, not total
);
const totalPerMode = selectedTopics.length * questionsPerTopic;
const estimatedSessions = Math.round((totalPerMode / examLength) * 10) / 10;
```

Display varies by mode:

- `mode === 'quiz'` or `mode === 'flashcard'`: "Luodaan **N** aihealuetta × **Q** kysymystä = **X kysymystä** (~**S** kierrosta)"
- `mode === 'both'`: "Luodaan **N** × **Q** tietovisa + **N** × **Q** muistikortti = **Y** yhteensä"

**Why:** Making the multiplication explicit removes the surprising emergent total. Showing session count lets the admin decide whether the bank is large enough before confirming. Using `selectedTopics.length` in `calcQuestionsPerTopic` means deselecting a topic immediately updates the preview. The at-least-one invariant prevents an empty confirmation and gives a clear UI constraint instead of a runtime error downstream.

---

### B5 — Remove `chunkQuestionCounts` or make it a no-op

**File:** `src/components/create/CreatePageClient.tsx`

`chunkQuestionCounts` splits a count > 20 into chunks of max 20. With `QUESTIONS_PER_TOPIC = 10`, this function will always return `[10]` — a single-element array. It can be removed and `runChunkedGenerateStep` can be simplified to a direct `callGenerateSingle` call without the chunking loop.

If the extend-set flow still allows requesting more than 20 questions to add (`questionsToAdd` slider goes up to 50 in the UI), `chunkQuestionCounts` is still needed there. In that case, keep the function but remove it from the main topic-batch generation path.

---

### B6 — Remove `CapacityWarningDialog` and related state

**File:** `src/components/create/CreatePageClient.tsx`

The capacity warning was a word-count-based check that warned when material might not support the requested question count. A comment at line 1204 already notes: *"Old word-based capacity check removed — now using intelligent topic-based confirmation."*

The `capacityWarning` state (line 274), `CapacityWarningDialog` import (line 59), and the dialog render at line 3623 are all vestigial. They can be removed.

Remove:
- `interface CapacityWarningState`
- `const [capacityWarning, setCapacityWarning] = useState<CapacityWarningState | null>(null)`
- `import { CapacityWarningDialog }` and the `{capacityWarning && <CapacityWarningDialog ... />}` block
- `setCapacityWarning(null)` calls
- `bypassCapacityCheck` option from `handleSubmit` options (if it was only used to skip the capacity dialog)

**Why:** With per-topic generation, material capacity is implicitly handled by the topic analysis. If a topic is identified, the material is assumed to support at least `QUESTIONS_PER_TOPIC` questions for it. There is no separate total-count gate to pass.

---

### B7 — Update progress display in `CreatePageClient` header

**File:** `src/components/create/CreatePageClient.tsx`

The progress counter in the creation header currently shows `completedSteps / totalSteps` (question counts). With the new model, a simpler label works:

- During generation: show topic progress — "Aihe 2 / 5" (topic 2 of 5)
- After completion: show "Luotiin `N` kysymystä `M` aihealueesta" (created N questions across M topics)

This is a display-only change; the underlying step tracking is unchanged.

---

## Part B — Backward Compatibility Notes

- **The `generate-single` route is unchanged.** It still accepts `questionCount` per call; it will simply always receive 10 (or `QUESTIONS_PER_TOPIC`).
- **The `extend-set` flow is unchanged.** It uses its own `questionsToAdd` state (separate slider, separate code path) and does not go through `handleTopicConfirmation`.
- **The prompt builder is unchanged by Part B.** Part A already handles the per-topic batch contract; Part B is purely a UI/orchestration change.
- **`exam_length` (sarjan pituus, play session size) is unchanged.** That slider controls how many questions are shown per play session, which is independent of how many are stored in the bank.

---

## Part B — Test Checklist

### Unit tests

- [ ] `calcQuestionsPerTopic(30, 3)` returns `10` (standard material).
- [ ] `calcQuestionsPerTopic(10, 3)` returns `6` (floor — thin material).
- [ ] `calcQuestionsPerTopic(90, 3)` returns `15` (cap — dense material).
- [ ] `calcQuestionsPerTopic(10, 2)` returns `6` (floor — 2-topic thin edge case).
- [ ] `calcQuestionsPerTopic(45, 3)` returns `15` (cap — dense 3-topic).

### Integration / creation flow

- [ ] Create a set with 3 topics from standard material (30 concepts): bank contains 30 questions (3 × 10).
- [ ] Create a set from dense material (45 concepts, 3 topics): bank contains 45 questions (3 × 15).
- [ ] Create a set with thin material (10 concepts, 2 topics): bank contains 12 questions (2 × 6).
- [ ] `mode = 'both'` with 3 topics, standard material: 30 quiz + 30 flashcard questions created.
- [ ] `chunkQuestionCounts` either removed from topic-batch path or returns a single-element array for all outputs of `calcQuestionsPerTopic` (max 15 ≤ 20 cap — never chunks).

### Dialog checks

- [ ] Topic confirmation dialog shows topics without any question-count sliders.
- [ ] Dialog description reads "Tarkista tunnistetut aihealueet" (not "säädä kysymysmääriä").
- [ ] Dialog shows computed preview: "N aihealuetta × Q kysymystä = X kysymystä (~S kierrosta)".
- [ ] `mode = 'both'` dialog shows: "N × Q tietovisa + N × Q muistikortti = Y yhteensä".
- [ ] No `CapacityWarningDialog` appears during creation.
- [ ] Extend-set flow still works (uses its own question count, unaffected).

---

## Combined Priority Order (Parts A + B)

1. **Part A, Steps 1–5** — wire `focusTopic` through the call chain. Low risk, purely additive.
2. **Part A, Steps 6–7** — activate the focused-batch prompt contract.
3. **Part B, Steps B1–B3** — introduce `QUESTIONS_PER_TOPIC`, remove `questionCount` state, update generation logic.
4. **Part B, Steps B4–B6** — simplify the dialog and remove vestigial capacity warning UI.
5. **Part A, Step 8** — flashcard anti-duplication (can land with B or after).
6. **Benchmark** — run both Part A and Part B quality checklists.

---

## Critical Files — Part B

| File | Change type |
|---|---|
| `src/config/generationConfig.ts` | **New file** — `QUESTIONS_PER_TOPIC_MIN/MAX`, `calcQuestionsPerTopic()` |
| `src/components/create/CreatePageClient.tsx` | Modify — remove `questionCount` state and `defaultQuestionCounts`, derive count via `calcQuestionsPerTopic`, update generation flow, remove `CapacityWarningDialog` |
| `src/components/create/TopicConfirmationDialog.tsx` | Modify — add `selected` boolean state per topic, remove count sliders, `onConfirm(confirmedTopics: EnhancedTopic[])`, show computed preview (N × Q = total, session estimate, mode breakdown), disable Confirm when zero topics selected |
| `src/components/create/CapacityWarningDialog.tsx` | **Delete** (or keep for extend-set if reused there) |
