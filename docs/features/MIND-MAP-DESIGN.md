# Mind Map Mode — Feature Design

> **Status:** Design / Pre-implementation
> **Branch:** `claude/design-mind-map-feature-1JGCN`
> **Target users:** Learners (student-facing play experience)

---

## 1. Overview

**Mielikartta** ("Mind Map") is a new visual study mode for learners in Koekertaaja.
It renders the topics and subtopics of a question set as an interactive node graph,
giving students a spatial "big picture" view of what they are about to study — and a
mastery heatmap of which areas they have already covered.

### What it is

- An SVG/CSS-rendered tree centred on the question-set subject
- Top-level branches = `topic` values found in the question set's questions
- Second-level branches = `subtopic` values (where present)
- Leaf badges show question count per node
- Node colour codes mastery based on stored quiz scores (localStorage)
- Tapping/clicking a node → filters into a drill-down quiz or flashcard session for
  that topic only (v2)

### What it is NOT

- Not a free-hand drawing tool
- Not a collaboration/sharing feature (v1 is read-only exploration)
- Not a replacement for flashcards or quizzes — it is complementary

---

## 2. Learner Benefits

### 2.1 Cognitive / Pedagogical

| Benefit | Rationale |
|---|---|
| **Schema activation** | Seeing the full topic tree before studying primes working memory and improves encoding (Ausubel's advance-organiser theory) |
| **Spatial memory engagement** | Mind maps engage visuospatial processing pathways, providing a second encoding route alongside rote/sequential reading |
| **Metacognitive awareness** | Colour-coded mastery lets learners self-assess at a glance and direct effort toward weak nodes rather than re-reading everything |
| **Reduced exam anxiety** | Knowing the scope explicitly ("this set has 3 topics, 8 subtopics") is less overwhelming than a raw question list |
| **Dependency visibility** | The existing `concept_id` / dependency graph data can later be exposed as directional edges, showing prerequisite chains (e.g., "learn fractions before percentages") |

### 2.2 Product / Engagement

| Benefit | Details |
|---|---|
| **Differentiator** | Quiz + flashcard modes are table stakes; mind map is a distinctive, shareable visual |
| **Re-engagement hook** | Returning learners see their green/yellow/red nodes instantly — a motivating progress reminder without requiring a new quiz session |
| **Teacher visibility** | Teachers can share the mind map view when introducing a new set, giving a syllabus-at-a-glance |
| **Low-friction entry** | Browsing the mind map is zero-stakes — no wrong answers possible — making it ideal for anxious or new students |

---

## 3. Data Model

The feature requires **no new database schema**. All necessary data already exists:

```
Question
  ├── topic?       — High-level branch  (e.g. "Grammar", "Vocabulary")
  ├── subtopic?    — Second-level branch (e.g. "Past Tense", "Food")
  └── concept_id?  — Curriculum node for dependency edges (v2)

QuestionSet
  ├── subject      — Root node label
  ├── topic?       — Set-level topic (used when all questions share one topic)
  └── grade?       — Displayed in root node
```

A client-side aggregation function produces the tree:

```typescript
interface MindMapNode {
  id: string;           // topic or `${topic}__${subtopic}`
  label: string;        // display text
  questionCount: number;
  questionIds: string[];
  children: MindMapNode[];
  mastery: MasteryLevel; // 'none' | 'partial' | 'mastered'
}

type MasteryLevel = 'none' | 'partial' | 'mastered';

// Mastery thresholds (same bins used by TopicMasteryDisplay)
// none     → 0 % correct across all questions in node
// partial  → 1–79 % correct
// mastered → ≥ 80 % correct
```

### Mastery data source

Mastery is derived from **localStorage quiz answers** (already stored by
`useGameSession` / `useReviewMistakes`). No new storage mechanism is needed. The
aggregation reads per-question correctness from `localStorage` and rolls it up to the
topic/subtopic level.

---

## 4. Architecture

### 4.1 Integration point

Mind map is exposed as a **third primary study mode** alongside `pelaa` and `opettele`.

```
StudyMode = 'pelaa' | 'opettele' | 'mielikartta'   // types/questions.ts
```

On the browse page (`/play`), the `ModeClassBar` gains a third tab:

```
[ ⚔ Pelaa ]  [ 📖 Opettele ]  [ 🗺 Mielikartta ]
```

When `mielikartta` is active, question-set cards show a single "Avaa kartta" ("Open
map") button. This navigates to:

```
/play/[code]?mode=mielikartta
```

The existing `/play/[code]/page.tsx` already switches on the `mode` URL parameter to
render flashcards vs quiz. Adding a `mielikartta` branch is consistent with that
pattern.

### 4.2 Component tree

```
/play/[code]/page.tsx
  └─ (mode === 'mielikartta') → <MindMapSession />
       ├── <MindMapHeader />          — breadcrumb + exit button
       ├── <MindMapCanvas />          — SVG tree renderer
       │     ├── <MindMapRootNode />  — subject / grade
       │     ├── <MindMapBranchNode /> (per topic)
       │     └── <MindMapLeafNode />  (per subtopic)
       └── <MindMapLegend />          — mastery colour key
```

### 4.3 New files

```
src/
├── components/
│   └── mindMap/
│       ├── MindMapSession.tsx      — Outer session wrapper + data loading
│       ├── MindMapCanvas.tsx       — SVG layout engine + node rendering
│       ├── MindMapHeader.tsx       — Title bar, exit, legend toggle
│       ├── MindMapLegend.tsx       — Mastery colour legend
│       ├── MindMapNode.tsx         — Generic node (root / branch / leaf)
│       └── index.ts
├── lib/
│   └── mindMap/
│       ├── buildMindMapTree.ts     — Aggregates questions → MindMapNode tree
│       ├── layoutTree.ts           — Reingold-Tilford-style radial layout
│       └── masteryAggregator.ts    — Reads localStorage → per-node mastery
└── types/
    └── mindMap.ts                  — MindMapNode, MasteryLevel, LayoutNode
```

### 4.4 Modified files

| File | Change |
|---|---|
| `src/types/questions.ts` | Add `'mielikartta'` to `StudyMode` union |
| `src/components/play/ModeClassBar.tsx` | Add third mode option to `MODE_OPTIONS` |
| `src/components/play/ModeToggle.tsx` | Add third mode button |
| `src/app/play/page.tsx` | Filter & card button logic for `mielikartta` mode |
| `src/app/play/[code]/page.tsx` | Add `mode === 'mielikartta'` branch → `<MindMapSession />` |
| `src/lib/play/mode-grade-query.ts` | Accept `'mielikartta'` in `parseStudyModeParam` |

### 4.5 Layout algorithm

The layout uses a **radial tree** (Reingold-Tilford adapted for polar coordinates):

```
              [Root: Subject]
            /        |        \
      [Topic A]  [Topic B]  [Topic C]
       /   \         |
  [Sub A1][Sub A2] [Sub B1]
```

On **desktop** (`≥ 768 px`): Full radial SVG, zoomable via CSS `transform`.
On **mobile** (`< 768 px`): Vertical accordion list with expand/collapse per topic —
same data, tree-list layout instead of radial. This avoids pan/zoom complexity on
touch.

---

## 5. Open Questions — Validation

The following open questions were identified during design. Each is resolved below.

---

### OQ-1: External charting library vs custom SVG?

**Question:** Should we pull in a library like `react-flow`, `d3`, or `vis-network`
to render the graph?

**Validation:**
- `react-flow` is 70 kB gzipped and adds significant complexity for a read-only tree.
- `d3` is powerful but pulls in a large DSL; only the layout math is needed here.
- The question sets rarely exceed 10 topics × 8 subtopics = ~80 nodes. A bespoke
  radial layout is < 100 LOC of geometry and avoids any new dependency.

**Decision: Custom SVG, no new runtime dependency.**

The `layoutTree.ts` utility computes `(x, y)` for each node using a polar coordinate
pass. The SVG canvas then renders `<circle>`, `<line>`, and `<text>` elements. No
animation library is needed — CSS transitions on `opacity` and `transform` suffice.

---

### OQ-2: Third `StudyMode` vs sub-view under `opettele`?

**Question:** Should `mielikartta` be a top-level `StudyMode` (third tab in
`ModeClassBar`) or a sub-view within the existing `opettele` tab?

**Validation:**
- Sub-view would require new UI within `ModeClassBar` (nested tabs or a dropdown) and
  would obscure the feature from learners who never leave the default `pelaa` tab.
- A third `StudyMode` is consistent with how `opettele` was introduced: it is a
  distinct intent (explore vs memorise vs quiz).
- `StudyMode` is already a union type; adding a third value is a two-character change
  with cascading TypeScript enforcement.
- The browse-page filter logic for `mielikartta` is simple: show all sets (both quiz
  and flashcard), because the mind map works for any set with topic-tagged questions.

**Decision: Third `StudyMode` value `'mielikartta'`.**

---

### OQ-3: What if a question set has no `topic` or `subtopic` data?

**Question:** Some older sets may have `topic: undefined` on all questions. How should
the mind map handle this gracefully?

**Validation:**
- Inspecting the data: all current sets with `mode: 'flashcard'` appear to have topic
  tags from the AI generation pipeline. Quiz sets use topic tagging in prompts as well.
- Edge cases: if all questions lack topics, the tree degenerates to a single root with
  a flat list of `N questions` leaves.
- A fallback UI ("Tähän kokoelmaan ei ole tallennettu aihealueita") should appear with
  a prompt to switch to quiz or flashcard mode.

**Decision: Graceful degradation — show root-only tree with a fallback notice.**
`MindMapSession` checks `tree.children.length === 0` and renders the notice instead of
`MindMapCanvas`.

---

### OQ-4: Mastery data — should it be real-time or computed once on mount?

**Question:** Quiz sessions write answers to localStorage during play. Should the mind
map re-read mastery on every render, or compute once when the map loads?

**Validation:**
- Mind map is a separate page visit from a quiz session. A learner finishes a quiz,
  returns to browse, then opens the mind map — there is no concurrent mutation.
- Re-computing on every render adds unnecessary `localStorage` reads.
- A single `useMemo` / `useEffect` on mount is sufficient, with a manual "refresh"
  button for the rare case of wanting to re-check after reviewing mistakes within the
  same page session.

**Decision: Compute once on mount; offer a refresh icon button in the header.**

---

### OQ-5: Should tapping a node navigate to a filtered quiz/flashcard session?

**Question:** Making nodes interactive (tap → drill into topic-filtered study) would
increase utility but adds routing and API complexity.

**Validation:**
- In v1 this creates scope creep: the API (`/api/question-sets/play`) does not support
  server-side topic filtering, so a client-side filter of already-loaded questions is
  needed.
- The question set is already fully loaded when the mind map renders (fetched by
  `getQuestionSetByCode` in `/play/[code]/page.tsx`).
- A practical v1 interaction: clicking a node highlights it and opens a side panel
  listing the questions in that topic, with a "Harjoittele tätä" ("Practice this")
  button that launches a filtered `FlashcardSession` or quiz with only those question
  IDs.
- Full deep-link navigation to filtered sessions is deferred to v2.

**Decision: v1 — tap node → highlight + side panel with question list + "practice
this topic" shortcut. v2 — dedicated URL route `/play/[code]/topic/[topicSlug]`.**

---

### OQ-6: How is the mind map made accessible (a11y)?

**Question:** SVG-based graphs are notoriously hard to navigate with screen readers
and keyboard-only navigation.

**Validation:**
- The SVG must not be the only representation. An accessible tree structure using
  `<ul>` / `<li>` with `role="tree"` / `role="treeitem"` must be present in the DOM
  — either as the primary render on mobile (accordion list, see §4.5) or as a visually
  hidden duplicate on desktop.
- Each `<circle>` node gets `aria-label="{topic}: {N} kysymystä, hallinta: {mastery}"`.
- Keyboard navigation: `Tab` moves between topic nodes; `Enter`/`Space` expands
  subtopics; `Escape` closes side panel.
- The `MindMapLegend` uses standard text, not colour alone, to convey mastery.

**Decision: Dual rendering — SVG for sighted users, accessible `<ul>` tree in the
same DOM for AT users (visually hidden on desktop, primary on mobile).**

---

### OQ-7: Performance ceiling — how many nodes is "too many"?

**Question:** A question set could have 10 topics × 10 subtopics = 100 nodes. Is SVG
rendering acceptable at this scale?

**Validation:**
- At 100 nodes the SVG has ~100 circles, ~100 lines, ~100 text labels = ~300 DOM
  elements. This is well within browser SVG performance limits (typical ceiling is
  10 000+ for simple shapes).
- The layout algorithm is O(N) after an initial sort. For N = 100 this runs in < 1 ms.
- Canvas (`<canvas>`) would be faster but loses a11y and CSS styling integration.
- No virtualisation needed for v1. If future sets exceed 200+ nodes, the radial layout
  would be switched to a collapsed tree with expand-on-click.

**Decision: SVG is sufficient for all foreseeable set sizes. No virtualisation in v1.**

---

### OQ-8: Localisation — is "mielikartta" the right Finnish term?

**Question:** The UI must be in Finnish. Is "mielikartta" the standard Finnish term
for mind map?

**Validation:**
- "Mielikartta" is used in Finnish primary and secondary school curricula (OPS 2016)
  for Tony Buzan-style radial mind maps.
- "Käsitekartta" (concept map) is a related but distinct term (Novak-style, with
  labelled arrows); it is less appropriate here since v1 has no labelled edge types.
- The button label on the question set card will read **"Aihekartta"** ("topic map")
  rather than "mielikartta", as it is more descriptive of what the learner sees
  (a map of topics, not a map of their mind). The mode tab label stays **"Kartta"**
  for brevity.

**Decision: Mode tab = "Kartta"; card button = "Avaa aihekartta"; page title =
"Aihekartta".**

---

## 6. UI Wireframe

### 6.1 Browse page — card in `mielikartta` mode

```
┌─────────────────────────────────────────────────────────┐
│  [📚] Englanti  •  15.3.2025            Luokka: 7  │
│                                                         │
│  [ 🗺 Avaa aihekartta          ↗ ]                      │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Mind map canvas (desktop)

```
 ← Takaisin    Englanti 7. luokka — Kappale 3    [⟳ Päivitä]

          ┌──────────────────────────────────┐
          │                                  │
          │       ●  Sanasto (18)            │
          │      ╱   ├── Ruoka (6)           │
          │  ●──┤    ├── Värit (5)           │
          │ subj ╲   └── Koulu (7)           │
          │      ●  Kielioppi (22)           │
          │      │   ├── Preesens (8)        │
          │      │   ├── Imperfekti (9)      │
          │      │   └── Modaaliverbit (5)   │
          │      ●  Luetun ymmärtäminen (10) │
          │          └── Tekstinymmärrys (10)│
          │                                  │
          └──────────────────────────────────┘

  ● Ei harjoiteltu   ◑ Osittain (< 80 %)   ● Hallittu (≥ 80 %)
```

Colours: grey (none) → amber (partial) → teal/green (mastered).
These re-use existing design tokens from `src/lib/design-tokens/colors.ts`.

### 6.3 Mobile view (accordion list)

```
 ← Takaisin    Englanti 7. luokka

  ▾  Sanasto                   18 kys.   ◑
       • Ruoka                  6 kys.   ●
       • Värit                  5 kys.   ●
       • Koulu                  7 kys.   ○

  ▾  Kielioppi                 22 kys.   ○
       • Preesens               8 kys.   ○
       ...
```

---

## 7. Implementation Plan

### Phase 1 — Data layer (1 day)

- [ ] Add `'mielikartta'` to `StudyMode` in `types/questions.ts`
- [ ] Implement `buildMindMapTree.ts` (aggregates questions → tree)
- [ ] Implement `masteryAggregator.ts` (reads localStorage → mastery per node)
- [ ] Unit tests for both utilities

### Phase 2 — Layout engine (1 day)

- [ ] Implement `layoutTree.ts` (radial coordinate assignment)
- [ ] Visual regression test with mock data (3, 10, 50 node scenarios)

### Phase 3 — UI components (2 days)

- [ ] `MindMapNode.tsx` — circle, label, question count badge
- [ ] `MindMapCanvas.tsx` — SVG container, edge lines, node placement
- [ ] `MindMapLegend.tsx` — mastery colour key
- [ ] `MindMapHeader.tsx` — back nav, set name, refresh button
- [ ] `MindMapSession.tsx` — data loading, tree build, fallback notice
- [ ] Mobile accordion list variant (responsive split in `MindMapSession`)
- [ ] Accessible `<ul>` tree (visually hidden on desktop)

### Phase 4 — Integration (1 day)

- [ ] Update `ModeClassBar` + `ModeToggle` for third mode
- [ ] Update `mode-grade-query.ts` to accept `'mielikartta'`
- [ ] Update browse page card — "Avaa aihekartta" button
- [ ] Update `/play/[code]/page.tsx` — `mode === 'mielikartta'` branch

### Phase 5 — Polish & QA (1 day)

- [ ] Dark mode colour tokens for mastery states
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Smoke tests: no-topic fallback, single-topic set, large set (50+ subtopics)
- [ ] Finnish copy review

**Total estimated effort: 6 developer-days**

---

## 8. Out of Scope (v1)

The following are explicitly deferred to avoid scope creep:

| Feature | Rationale for deferral |
|---|---|
| Topic-filtered quiz/flashcard deep links | Requires route changes + API filter |
| Shareable mind map image export | PNG/SVG export tooling not yet in stack |
| Teacher-editable node labels | Needs admin UI + schema changes |
| Dependency edges between nodes (`concept_id`) | Needs directed graph layout (more complex) |
| Leaderboard / social features on nodes | Separate feature domain |
| Animated node reveal on first load | Nice-to-have; not a pedagogical requirement |

---

## 9. Success Metrics

| Metric | Target (30 days post-launch) |
|---|---|
| Mind-map sessions started (unique users) | ≥ 15 % of active learners |
| Median time spent in mind map per visit | ≥ 45 s (indicates genuine exploration) |
| Quiz session initiated after mind map view | ≥ 40 % of map visits (funnel conversion) |
| Reported a11y issues (via flag system) | 0 critical, < 3 minor |

---

## 10. Summary

| Dimension | Assessment |
|---|---|
| **Effort** | Medium — 6 dev-days, no new dependencies, no schema changes |
| **Risk** | Low — additive feature, no modifications to quiz/flashcard paths |
| **Learner impact** | High — addresses metacognition & visual learner needs |
| **Technical debt** | Minimal — reuses existing data, design tokens, and localStorage patterns |
| **Reversibility** | Easy — a single `StudyMode` value and isolated component tree |

The mind map mode is a high-value, low-risk addition that leverages data the platform
already collects (topic/subtopic tags) and aligns with evidence-based learning science.
