# Plan 191 — Prompt Content: Focused-Batch Templates

**Date:** 2026-04-12
**Status:** Revised — two review findings resolved; templates updated
**Related plan:** plan-190-prompt-optimization-topic-batch.md (technical wiring)

---

## Purpose

This document proposes the Finnish-language content for three new prompt template files introduced in plan-190 Part A. The technical loading and wiring are handled by tasks 001–005; this plan focuses only on what the model is told and why.

Review goal: agree on the instruction text, tone, and scope before these files become live templates.

---

## File 1 — `whole-set-tagging.txt` (v1.0.0)

**Role:** Backward-compatibility file. Verbatim extraction of the KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block from the current `topic-tagging.txt`. No content changes.

**Draft content:**

```
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

**Decision:** No changes from existing behaviour. This file must match the current template exactly (golden-string test in task-003).

---

## File 2 — `focused-batch-tagging.txt` (v1.0.0)

**Role:** Replaces the whole-set balancing contract when a call has `focusTopic` set. Tells the model: you are generating for one topic only; enforce that boundary, vary within it, and do not repeat.

**Draft content:**

```
TÄMÄ ERÄ KOSKEE VAIN AIHETTA: "{{focus_topic}}"

AIHEEN RAJAUS:
- Kaikkien {{question_count}} kysymyksen topic-kenttä on täsmälleen "{{focus_topic}}".
- Älä käytä muita topic-arvoja tässä erässä.
- Älä luo kysymyksiä muista aiheista, vaikka materiaali sivuaisi niitä.

MONIPUOLISUUS AIHEEN SISÄLLÄ:
- Vaihtele subtopic-kenttää: kata eri alateemoja ennen kuin palaat samaan.
- Vaihtele skill-kenttää: älä käytä samaa taitoa kaikkiin kysymyksiin.
- Vaihtele vaikeutta pyydetyn difficulty-tason luontaisen vaihtelun sisällä — älä ylitä tai alita annettua tasoa.
- Jaa {{question_count}} kysymystä saman aiheen sisällä eri alateemoihin, taitoihin ja näkökulmiin.
- Jokainen kysymys testaa eri asiaa tai näkökulmaa saman aiheen sisällä.

TOISTON VÄLTTÄMINEN:
- Älä kysy samaa faktaa kahdesti eri sanoin.
- Jos subtopic on jo katettu, siirry seuraavaan ennen kuin palaat.
- Jos sama taito ja sisältöpari on jo käytetty, muuta näkökulmaa selvästi.

SÄÄNNÖT:
- Topic-arvo on täsmälleen "{{focus_topic}}" jokaisessa kysymyksessä.
- subtopic on suositeltava tarkenne — käytä sitä erottamaan alateemoja.
```

### Design decisions and open questions

**AIHEEN RAJAUS** — The core boundary rule. "Vaikka materiaali sivuaisi niitä" (even if the material touches them) is deliberate: biology material about photosynthesis will mention cell respiration; without this line the model sometimes drifts. Worth keeping.

**MONIPUOLISUUS** — Four variety axes: subtopic, skill, difficulty, perspective. This replaces cross-topic breadth with within-topic depth.

**TOISTON VÄLTTÄMINEN** — Currently two rules only. "Älä kysy samaa faktaa kahdesti eri sanoin" is the weakest instruction in this file — models interpret "eri sanoin" loosely. Alternatives to consider:
- Option A (current): "Älä kysy samaa faktaa kahdesti eri sanoin."
- Option B (stricter): "Jokainen kysymys testaa eri faktan, käsitteen tai taidon — ei saman asian uudelleenmuotoilua."
- Option C (example-based): Add one concrete wrong/right example pair.

**Open question:** Is three sections (RAJAUS / MONIPUOLISUUS / TOISTO) the right structure, or should TOISTO be merged into MONIPUOLISUUS? Merging would shorten the section and reduce the chance of model getting confused by multiple headings, but separates two conceptually distinct concerns.

---

## File 3 — `focused-batch-flashcard.txt` (v1.0.0)

**Role:** Loaded only for `mode='flashcard'` focused-batch calls. Adds card-level uniqueness rules on top of the tagging contract. The existing `flashcard-rules.txt` handles format (type, question/answer structure); this file handles variety within a narrow topic.

**Draft content:**

```
FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT:

Tämä erä kattaa vain yhden aiheen. Siksi korttien vaihtelu ei saa syntyä aiheen vaihdosta, vaan muistamisen kohteen, alateeman, taidon ja vaikeustason vaihtelusta.

MUISTAMISEN KOHDE (recall target):
- Jokainen kortti testaa eri muistamisen kohdetta.
- "Muistamisen kohde" = se tieto, sääntö, käsite, ero, menettely tai periaate, jonka question-kenttä vaatii oppilasta muistamaan.
- Väärin: kaksi korttia kysyy samaa termiä, samaa sääntöä tai samaa kaavaa vain hieman eri sanoin.
- Oikein: yksi kortti kysyy termin määritelmän, toinen säännön, kolmas poikkeuksen, neljäs käytön, viides vertailun.

ALATEEMOJEN JÄRJESTYS:
- Kierrätä alateemoja (subtopic) ennen kuin palaat samaan alateemaan uudelleen.
- Jos aiheessa on useita alateemoja, jaa kortit niiden välillä mahdollisimman tasaisesti.
- Älä klusteroi montaa peräkkäistä korttia samaan alateemaan, jos muita alateemoja on vielä kattamatta.

TAITOJEN VAIHTELU:
- Vaihtele skill-arvoja saman aiheen sisällä — käytä skill-tagging-ohjeiston mukaisia arvoja.
- Varmista, että eri kortit vaativat erilaista kognitiivista työtä: muistamista, ymmärtämistä, soveltamista tai vertailua.
- Älä rakenna koko erää yhden ainoan taidon varaan.

VAIKEUDEN VAIHTELU:
- Vaihtele vaikeutta pyydetyn difficulty-tason luontaisen vaihtelun sisällä — älä ylitä tai alita annettua tasoa.
- Vaihtelun pitää näkyä itse muistamisen kohteessa: yksinkertainen fakta vs. soveltava kysymys vs. poikkeuksen tunnistaminen.
- Älä anna koko erän kallistua pelkästään helpoimpaan tai vaikeimpaan päähän sallitun tason sisällä.
```

### Design decisions and open questions

**Wrong/correct example in MUISTAMISEN KOHDE** — This is the most important section. Models respond better to concrete examples than abstract rules. The "Väärin/Oikein" pair is kept intentionally brief — one negative and one positive.

**Section count** — Four sections (recall target, subtopic order, skill variation, difficulty spread). This mirrors the `focused-batch-tagging.txt` MONIPUOLISUUS axes but is card-specific. Could be simplified to two sections (recall uniqueness + variety) if the current four feel redundant.

**TAITOJEN VAIHTELU** — Uses cognitive-category framing (muistaminen, ymmärtäminen, soveltaminen, vertailu) instead of naming raw skill values. The actual snake_case values come from the skill taxonomy already in the prompt; this section only instructs the model to vary cognitive demand type.

**VAIKEUDEN VAIHTELU** — Defers to the given difficulty level ("pyydetyn difficulty-tason luontaisen vaihtelun sisällä"). Variation is anchored to "muistamisen kohde" — the complexity of what is being recalled — not to question phrasing.

**Open question:** ALATEEMOJEN JÄRJESTYS currently uses free cycling ("kierrätä ennen kuin palaat samaan"). A prescriptive version ("kaikki saman alateeman kortit peräkkäin") would make output more predictable but may conflict with difficulty variation across cards.

---

## What is NOT included

These files intentionally do not contain:
- Subject-specific rules (those belong in subject-type templates)
- Question format rules (those are in `format.txt` and `flashcard-rules.txt`)
- Skill taxonomy (that is in `skill-tagging.txt` and the skill taxonomy files)
- Difficulty rubric (that is in `difficulty-rubric.txt`)

Keeping each file's scope narrow makes iteration easier: changing the anti-duplication strategy means bumping only `focused-batch-tagging.txt`, not rebuilding the whole prompt.

---

## Review findings (resolved)

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | High | Difficulty spread required all three levels (helppo/normaali/vaikea) — conflicts with `difficulty-rubric.txt` line 37: "Vaikeus vastaa annettua difficulty-tasoa" | Both files updated: difficulty line now says "Vaihtele vaikeutta pyydetyn difficulty-tason luontaisen vaihtelun sisällä — älä ylitä tai alita annettua tasoa." |
| 2 | Medium | Flashcard TAITOJEN VAIHTELU listed raw skill examples (recall, define, apply, compare) not in snake_case taxonomy | Replaced with cognitive-variation framing: "varmista että eri kortit vaativat erilaista kognitiivista työtä: muistamista, ymmärtämistä, soveltamista tai vertailua" — taxonomy values come from skill-tagging contract, not this file |

## Open questions (tuning, not correctness)

- [ ] AIHEEN RAJAUS wording — benchmark harness prepared on 2026-04-12, but drift could not be measured in this sandbox because `ANTHROPIC_API_KEY` was missing; needs first real model run against the biology fixture (`Fotosynteesi` vs `Soluhengitys`)
- [ ] TOISTON VÄLTTÄMINEN — benchmark harness prepared on 2026-04-12, but duplicate-pair counts could not be measured in this sandbox because `ANTHROPIC_API_KEY` was missing; needs first real model run against the grammar fixture
- [ ] ALATEEMOJEN JÄRJESTYS in flashcard file — "kierrätä alateemoja ennen kuin palaat samaan" vs. prescriptive ordering
- [ ] Intro sentence in `focused-batch-flashcard.txt` — useful framing or unnecessary verbosity?

## Benchmark note (2026-04-12)

A local benchmark harness was added in `scripts/benchmark-focused-batch.ts` and executed in a sandbox without AI credentials. The run verified prompt-path wiring and whole-set backward compatibility locally, and wrote attempt artifacts to:

- `results/raw/benchmark-focused-batch-before.json`
- `results/raw/benchmark-focused-batch-after.json`

What was verified locally:

- old focused-path reconstruction still uses whole-set distribution guidance
- new focused quiz path loads `focused-batch-tagging.txt`
- new focused flashcard path loads both focused-batch templates
- whole-set prompt path remains backward-compatible

What remains unresolved until a credentialed run:

- biology topic drift counts
- quiz near-duplicate counts
- grammar subtopic spread counts
- flashcard skill spread counts
