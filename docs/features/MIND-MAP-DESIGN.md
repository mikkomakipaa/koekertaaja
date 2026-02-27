# Mind Map Mode — Feature Design

> **Status:** Design / Pre-implementation
> **Branch:** `claude/design-mind-map-feature-1JGCN`
> **Target users:** Learners (student-facing play experience)

---

## 1. Overview

**Aihekartta** ("Mind Map") is a new visual study mode for learners in Koekertaaja.
It renders the topics and subtopics of a question set as an interactive node graph,
giving students a spatial "big picture" view of what they are about to study — and a
mastery heatmap of which areas they have already covered.

### What it is

- An SVG/CSS-rendered radial tree centred on the question-set subject
- Branches = `topic` values found in the question set's questions (topic level only; subtopics not rendered in v1)
- Each topic node shows question count and mastery colour
- Node colour codes mastery based on stored quiz scores (localStorage)
- Accessible from the **Achievements page** via a set dropdown — positioned as a reflection tool, not a browse mode
- Tapping/clicking a node is read-only in v1 (focus + inspect only; no session launch)

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
| **Reduced exam anxiety** | Knowing the scope explicitly ("this set has 3 topics, 60 questions") is less overwhelming than a raw question list |
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
// none     → 0–49 % correct
// partial  → 50–79 % correct
// mastered → ≥ 80 % correct
```

### Mastery data source

Mastery is derived from existing topic mastery localStorage stats
(`useTopicMastery` via `topic_mastery_{code}`), written during quiz sessions.
No new storage mechanism is needed.

Scope decision for v1:
- Mastery is tracked and displayed at **topic level** only.
- **Subtopic nodes are not rendered** in v1. Topic nodes act as leaf nodes in the visual tree; `MindMapNode.children` is always empty in the rendered graph.

---

## 4. Architecture

### 4.1 Integration point

Aihekartta is embedded as a **new section on the Achievements page** (`/play/achievements`),
positioned below the badges grid. This placement anchors the feature in the learner's
reflection and progress context — the natural moment to review mastery after a session
— rather than as a pre-study browse mode.

A set dropdown lists all question sets for which the learner has stored mastery data
(at least one practiced session). Selecting a set renders the topic-level mind map
inline below the dropdown. No navigation or dedicated route is required.

```
/play/achievements
  └─ [existing: stats section]
  └─ [existing: badges grid]
  └─ [NEW] Aihekartta section
        set dropdown → <MindMapCanvas /> rendered inline
```

Design decision: **inline in Achievements, no new route**. This eliminates the need
for a third browse-mode tab, a dedicated route, and any changes to `StudyMode`,
`ModeClassBar`, or `mode-grade-query`. The surface area of the change is significantly
smaller, and the map sits where it is most meaningful: next to the learner's progress.

### 4.2 Component tree

```
/play/achievements/page.tsx
  └─ <AchievementsMapSection />     — new section below badges grid
       ├── set dropdown              — <select> or existing Select primitive; lists practiced sets
       └── [when set selected]:
             ├── <MindMapCanvas />   — SVG radial tree (topic level only)
             │     ├── <MindMapNode variant="root" />    — subject / grade
             │     └── <MindMapNode variant="branch" />  — per topic (leaf in v1)
             └── <MindMapLegend />   — mastery colour key
```

### 4.3 New files

```
src/
├── components/
│   └── mindMap/
│       ├── AchievementsMapSection.tsx — Set dropdown + map wrapper for Achievements page
│       ├── MindMapCanvas.tsx          — SVG layout engine + node rendering
│       ├── MindMapLegend.tsx          — Mastery colour legend
│       ├── MindMapNode.tsx            — Generic node (root / branch variants only)
│       └── index.ts
├── lib/
│   └── mindMap/
│       ├── buildMindMapTree.ts        — Aggregates questions → flat topic-level tree
│       ├── layoutTree.ts              — Radial coordinate assignment (two depths: root + topics)
│       └── masteryAggregator.ts       — Reads localStorage via pure helper extracted from useTopicMastery (not the hook) → per-topic mastery
└── types/
    └── mindMap.ts                     — MindMapNode, MasteryLevel, LayoutNode
```

### 4.4 Modified files

| File | Change |
|---|---|
| `src/lib/design-tokens/colors.ts` | Add `map` color token (violet palette) |
| `src/app/play/achievements/page.tsx` | Add `<AchievementsMapSection />` below badges grid |

No changes to `StudyMode`, `ModeClassBar`, `ModeToggle`, browse page, or routing.

### 4.5 Layout algorithm

The layout uses a **single-level radial tree** (two depths only: root + topics):

```
         [Root: Subject]
        /        |        \
  [Topic A]  [Topic B]  [Topic C]
```

Eliminating the subtopic level removes one ring of nodes, making the graph significantly
less cluttered. The layout algorithm reduces to a simple angular partition of 360°
among N topic nodes.

On **desktop** (`≥ 768 px`): Full radial SVG, zoomable via scroll-wheel and pinch
gesture. Zoom is implemented with a `scale` state in `MindMapCanvas`, applied as a
CSS `transform: scale()` on the SVG element. Initial scale and reset behavior use
fit-to-screen scale (computed from map bounds and container size), not a fixed 1x.
Min scale 0.5x, max 2x.
On **mobile** (`< 768 px`): Vertical flat topic list (no accordion) — same data,
tree-list layout instead of radial. No zoom needed in this layout.

### 4.6 Reusable Components and Design Guidelines

Implementation must prioritize existing reusable building blocks and design tokens:
- Use existing primitives from `src/components/ui/` (`Button`, `Card`, `Badge`, `Skeleton`, `Alert`) before creating custom wrappers.
- Reuse existing card layout patterns and the Achievements page shell for interaction consistency.
- Kartta has its own mode color (separate from quiz indigo and study teal), implemented via shared design tokens.
- Keep touch targets >= 48 px and preserve existing dark-mode and focus-ring behavior.

### 4.7 Map mode color token

The `aihekartta` mode uses **violet** as its accent color, added as a `map` entry in
`src/lib/design-tokens/colors.ts`:

```typescript
map: {
  primary: 'bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-500 dark:to-violet-400',
  hover: 'hover:from-violet-700 hover:to-violet-600 dark:hover:from-violet-600 dark:hover:to-violet-500',
  light: 'bg-violet-50 dark:bg-violet-900/20',
  text: 'text-violet-600 dark:text-violet-400',
  ring: 'ring-violet-500 dark:ring-violet-400',
},
```

**Rationale:** Violet is distinct from all existing mode colors (indigo for `pelaa`,
teal for `opettele`) and does not conflict with the mastery state colors (grey / amber /
green). It is used for the Osaaminen section heading and accent elements on the
Achievements page. Violet carries a spatial and reflective quality fitting for a
mastery-review feature, and maintains sufficient contrast in both light and dark themes.

---

## 5. Open Questions — Validation

The following open questions were identified during design. Each is resolved below.

Validation outcome (2026-02-27):
- All open questions (OQ-1 ... OQ-8) are resolved.
- Unresolved blockers: none.
- Execution status: clear to proceed when launch gates in §11 are met.

### 5.3 Minor UI Change Freeze (2026-02-27)

The following UX updates are frozen and override older wording examples:

- Achievements section heading copy: `Osaaminen` (replaces `Aihekartta`).
- Remove explanatory paragraph under the section heading.
- Set selector label: `Valitse koe` (replaces `Valitse kokoelma`).
- Legend heading: `Osaaminen` (replaces `Hallinta`).
- Selector item format: `subject • exam date • class grade` (include non-empty parts only).
- Legend layout: one horizontal row, no per-item background blocks.
- Fit-to-screen zoom:
  - Initial desktop scale uses fit scale derived from container/map bounds.
  - Reset zoom returns to latest fit scale for current set/container.
  - Fit scale is clamped to zoom bounds and capped at 1.0 when map already fits.

### 5.1 v1 Source of Truth (Scope Freeze)

The following constraints are the v1 source of truth and are non-negotiable for
implementation tasks unless this document is explicitly revised:

- Node interaction is read-only in v1 (focus/highlight/inspect only).
- No topic-filtered launch CTA or direct navigation from node to quiz/flashcard.
- Mastery is computed and displayed at **topic level only**; subtopic nodes are not rendered.
- Aihekartta lives inline on `/play/achievements` — no dedicated route, no third browse tab.
- The set dropdown lists only sets with stored mastery data (at least one practiced session).
- If topic data is missing for a selected set, UI degrades gracefully with fallback messaging.

### 5.2 Section-Level Consistency Check

The design is internally consistent across data model, architecture, and phases:

- §3 topic-only mastery constraints align with §4.5 single-level layout and §7 Phase 1 data tasks.
- §4.1 inline-in-Achievements decision aligns with §7 Phase 4 integration tasks (achievements page only).
- §5 read-only decision aligns with §8 out-of-scope (topic-filtered deep links deferred).
- §4.5 responsive rendering (desktop SVG, mobile list) aligns with §5 a11y decision and §7 Phase 3 deliverables.

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

### OQ-2: Browse mode tab vs Achievements page section?

**Question:** Should `aihekartta` be a third study mode tab in `ModeClassBar` (browse
page) or a section on the Achievements page?

**Validation:**
- A third browse tab requires changes to `StudyMode`, `ModeClassBar`, `ModeToggle`,
  `mode-grade-query`, and adds a dedicated route — significant surface area.
- The map's primary value is mastery *reflection*, not pre-study preparation; placing
  it in browse-mode misrepresents its purpose.
- Achievements page already surfaces per-learner progress and requires no routing changes.
- A set dropdown on the Achievements page is a natural pattern: the learner already
  has context for "which sets have I practiced?" from the badges + stats visible above.

**Decision: Inline section on the Achievements page with a set dropdown.**

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
`AchievementsMapSection` checks `tree.children.length === 0` and renders the notice
instead of `MindMapCanvas`.

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
`masteryAggregator.ts` reads localStorage directly via a pure `readTopicMasteryFromStorage(code)` helper extracted from `useTopicMastery` — not the hook itself — so it remains usable outside React component trees.

---

### OQ-5: Should tapping a node navigate to a filtered quiz/flashcard session?

**Question:** Making nodes interactive (tap → drill into topic-filtered study) would
increase utility but adds routing and API complexity.

**Validation:**
- Any launch-to-session behavior expands scope into routing/session logic and increases regression risk.
- v1 goal is visual orientation and mastery overview, not a new execution path.

**Decision: v1 is strictly read-only.**
- Tap/click behavior may only focus/highlight and reveal metadata.
- No "practice this topic" CTA in v1.
- Topic-filtered launch is deferred to v2.

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
- The end-user UI copy for this Achievements section uses **"Osaaminen"** rather than
  "mielikartta", because the section communicates learner mastery state, not only map
  structure terminology.

**Decision:**
- Feature internal name: **Aihekartta**
- Achievements section heading (UI copy): **Osaaminen**
- Section dropdown label (UI copy): **Valitse koe**
- No browse-mode tab or card CTA — entry point is the Achievements page only

---

## 6. UI Wireframe

### 6.1 Achievements page — Osaaminen section

```
┌─────────────────────────────────────────────────────────────┐
│  🗺 OSAAMINEN                                               │
│                                                             │
│  Valitse koe: [ Englanti • 12.02.2026 • 7. lk  ▼ ]         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │            ●  Sanasto (18)   Hallittu                 │  │
│  │           /                                           │  │
│  │  ●  Englanti──●  Kielioppi (22)   Osittain           │  │
│  │  (60 kys.)   \                                        │  │
│  │           ●  Luetun ymmärtäminen (10)   Ei harjoiteltu│  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Osaaminen: ○ Ei harjoiteltu  ◑ Osittain (50–79 %)  ● Hallittu (≥80 %) │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Mobile view (topic list)

```
  🗺 Osaaminen

  Valitse koe: [ Englanti • 12.02.2026 • 7. lk ▼ ]

  ─────────────────────────────────────────
  Sanasto                18 kys.   ● Hallittu
  Kielioppi              22 kys.   ◑ Osittain
  Luetun ymmärtäminen    10 kys.   ○ Ei harj.
  ─────────────────────────────────────────
```

On mobile the SVG is replaced with a flat topic list (no accordion, no subtopics).

Colours: grey (none) → amber (partial) → teal/green (mastered).
These re-use existing design tokens from `src/lib/design-tokens/colors.ts`.

---

## 7. Implementation Plan

### Phase 1 — Data layer (1 day)

- [ ] Add `map` color token to `src/lib/design-tokens/colors.ts` (violet palette; required before Phase 3 UI work)
- [ ] Extract `readTopicMasteryFromStorage(code)` pure helper from `useTopicMastery`
- [ ] Implement `buildMindMapTree.ts` (aggregates questions → tree)
- [ ] Implement `masteryAggregator.ts` (calls `readTopicMasteryFromStorage`; bins: 0–49 / 50–79 / 80+)
- [ ] Unit tests for both utilities

### Phase 2 — Layout engine (1 day)

- [ ] Implement `layoutTree.ts` (radial coordinate assignment)
- [ ] Manual visual inspection with mock data (3, 10, 50 node scenarios)

### Phase 3 — UI components (2 days)

- [ ] `MindMapNode.tsx` — circle, label, question count badge (`root` + `branch` variants only)
- [ ] `MindMapCanvas.tsx` — SVG container, edge lines, node placement, scroll-wheel + pinch zoom (CSS transform scale, min 0.5x, max 2x, default/reset = fit-to-screen)
- [ ] `MindMapLegend.tsx` — mastery key (`Osaaminen` heading, single row, no per-item background cards)
- [ ] `AchievementsMapSection.tsx` — set dropdown, data loading, tree build, fallback notice
- [ ] Mobile flat topic list variant (responsive split in `AchievementsMapSection`)
- [ ] Accessible `<ul>` topic list (visually hidden on desktop; primary on mobile)

### Phase 4 — Integration (0.5 day)

- [ ] Add `<AchievementsMapSection />` to `src/app/play/achievements/page.tsx` below badges grid
- [ ] Implement set dropdown: enumerate `topic_mastery_*` localStorage keys; resolve set name from stored metadata
- [ ] Render `<MindMapCanvas />` inline on set selection; show fallback if no sets practiced

### Phase 5 — Polish & QA (1 day)

- [ ] Apply `map` token and mastery state tokens (none/partial/mastered) across components; verify dark-mode variants
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Smoke tests: no-topic fallback, single-topic set, large set (10+ topics), no practiced sets (empty dropdown)
- [ ] Finnish copy review
- [ ] Regression suite for existing journeys:
  - `/play` browse in Pelaa/Opettele unchanged
  - quiz start → play → results unchanged
  - flashcard start → play unchanged
  - Achievements page stats + badges unchanged; map section appended below

**Total estimated effort: ~4 developer-days** (reduced from 6 by eliminating route, browse mode, ModeClassBar, and subtopic layout)

---

## 8. Out of Scope (v1)

The following are explicitly deferred to avoid scope creep:

| Feature | Rationale for deferral |
|---|---|
| Subtopic nodes rendered in map | Visual clarity; mastery is topic-level only; deferred to v2 |
| Topic-filtered quiz/flashcard deep links | Explicitly deferred; v1 is read-only by design |
| Third browse-mode tab (ModeClassBar) | Replaced by Achievements page entry point |
| Dedicated route `/play/[code]/aihekartta` | Not needed; map is inline in achievements |
| Shareable mind map image export | PNG/SVG export tooling not yet in stack |
| Teacher-editable node labels | Needs admin UI + schema changes |
| Dependency edges between nodes (`concept_id`) | Needs directed graph layout (more complex) |
| Animated node reveal on first load | Nice-to-have; not a pedagogical requirement |

---

## 9. Success Metrics

| Metric | Target (30 days post-launch) |
|---|---|
| Mind-map sessions started (unique users) | ≥ 15 % of active learners |
| Median time spent in mind map per visit | ≥ 45 s (indicates genuine exploration) |
| Return to study action after mind map view (open quiz/flashcard from Achievements flow) | ≥ 40 % of map visitors |
| Reported a11y issues (via flag system) | 0 critical, < 3 minor |


---

## 10. Summary

| Dimension | Assessment |
|---|---|
| **Effort** | Low-medium — ~4 dev-days, no new dependencies, no schema changes |
| **Risk** | Low — inline in Achievements, zero changes to browse/quiz/flashcard flows |
| **Learner impact** | High — addresses metacognition & visual learner needs in the right context (post-practice reflection) |
| **Technical debt** | Minimal — reuses existing data, design tokens, and localStorage patterns |
| **Reversibility** | Easy — one new section on Achievements page + isolated component tree; remove one import to revert |

The mind map mode is a high-value, low-risk addition that leverages data the platform
already collects (topic/subtopic tags) and aligns with evidence-based learning science.

---

## 11. Launch Gates (Go/No-Go)

Execution and rollout are blocked until every gate below is green.
Execution task chain note (2026-02-27): legacy tasks `192–199` are superseded and must
not be used for implementation. Use the `200+` task chain as the execution source of
truth.

| Gate | Go Criteria | No-Go Trigger | Downstream task anchor |
|---|---|---|---|
| G0 — Design freeze | §5 open questions resolved; §5.1 scope constraints unchanged | Any unresolved design question or scope contradiction | `task-200+` |
| G1 — Achievements integration contract | `<AchievementsMapSection />` renders on `/play/achievements`; set dropdown populates from localStorage; map renders for practiced sets | Section missing, dropdown empty with practiced sets, or map fails to render | `task-200+` |
| G2 — Data and mastery contract | Tree builds from topic/subtopic; topic-level mastery bins match spec; fallback works with missing topic data | Incorrect aggregation/mastery mapping or crash on empty topics | `task-200+` |
| G3 — Layout and component contract | SVG/list rendering works across expected node counts; no external graph dependency introduced | Layout instability, unreadable map, or unplanned dependency addition | `task-200+` |
| G4 — Visual and a11y contract | Map token applied; legend text present; keyboard/AT path available per §5 OQ-6 | Colour-only signaling or inaccessible primary interaction path | `task-200+` |
| G5 — Regression contract | Existing quiz + flashcard flows unchanged; Achievements map section isolated | Any regression in `/play`, quiz sessions, or flashcard sessions | `task-200+` |
| G6 — Documentation handoff | Final terminology and architecture docs updated to shipped behavior | Docs drift from implementation | `task-200+` |

Go/No-Go rule:
- GO: all gates G0 ... G6 pass.
- NO-GO: any single gate fails.
