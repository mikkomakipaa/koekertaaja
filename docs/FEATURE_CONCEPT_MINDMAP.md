# Feature Plan: Concept Mindmaps (Käsitekartta)

**Author**: Claude (AI)
**Date**: 2026-03-15
**Updated**: 2026-03-15 (feedback round 1)
**Status**: Proposal — awaiting final approval
**Branch**: `claude/plan-mindmap-feature-iaKGY`

### Feedback applied (round 1)
- Home screen integration: confirmed fine as planned.
- Node interaction upgraded: clicking a node opens a **flashcard-style self-learning panel** (not just a brief popover). Content can be longer than 1–2 sentences — full explanation, examples, key facts.
- **Teachers do not use the app.** All teacher personas, teacher flows, and teacher-specific copy removed. The app is student-driven throughout.

### Feedback applied (round 2)
- Design system audit complete. Shared components and design tokens mapped throughout. See §5 (Shared Components) for the full breakdown.
- **Map mode color corrected to violet** — the design system already defines `mode="map"` as violet (`colors.map.*`) in `src/lib/design-tokens/colors.ts` and `Button`. The earlier "sky" suggestion was wrong and removed.
- Component list trimmed: `ConceptMapShareButton` and `ConceptMapLegend` are not standalone components — they use `Button mode="map"` and `Badge` inline.

---

## 1. Feature Summary

Add a new **Käsitekartta** (Concept Map) mode to Koekertaaja. The map is AI-generated for a chosen subject and grade. Students get a visual overview of how topics and sub-concepts relate to each other. Clicking any node opens a **flashcard-style learning panel** with the full explanation of that concept — turning the map into an interactive self-study tool, not just a diagram.

### How it differs from the existing achievements mind map

| | Achievements Map (`/play/achievements`) | Concept Map (new) |
|---|---|---|
| **Purpose** | Show which topics you have already mastered | Show what topics exist and how they connect |
| **Data source** | Player history stored in localStorage | AI-generated from curriculum |
| **When used** | After playing quizzes | Before / during studying |
| **Persistence** | Local only | Stored in DB, shareable code |
| **Depth** | Root → Topic (2 levels) | Root → Topic → Subtopic → Concept (up to 4 levels) |
| **Mode color** | indigo (quiz) | **violet** (`colors.map.*`) |
| **Node interaction** | None | Click → full flashcard-style learning panel |

---

## 2. Open Questions (Validated)

### Q1: Is this a standalone mode or part of the create flow?
**Decision**: Standalone mode. Home screen gets a third tile: **"Tutki"** (Explore). Entry points:
- Home screen tile → subject/grade picker → generated map
- Results screen after a quiz → "Näytä käsitekartta" button (same subject+grade)

### Q2: What triggers generation?
**Decision**: Curriculum-based (Phase 1). Student selects subject + grade. AI uses the built-in curriculum JSON files in `/src/config/prompt-templates/curricula/` to generate the concept tree. Material-based upload is Phase 2.

### Q3: How many levels deep?
**Decision**: Max 4 levels:
```
Root (subject name)
  └── Topic          e.g. "Geometria"
        └── Subtopic e.g. "Kolmiot"
              └── Concept  e.g. "Pythagoraan lause"
```
Most subjects fit in 3 levels. Level 4 is only generated when the curriculum data supports it.

### Q4: What content does each node carry?
**Decision**: Each node carries enough content to serve as a self-contained study card:
- `label` — short display name shown on the map node
- `emoji` — optional visual anchor
- `explanation` — full explanation of the concept (several sentences, can include examples). This is the main body of the learning panel.
- `keyFacts` — optional bullet list of the 2–5 most important things to remember
- `example` — optional concrete example (a worked example for math, a real-world scenario for biology, etc.)
- `relatedConcepts` — optional list of sibling/related concept labels to help the student see connections

### Q5: Should the map be shareable?
**Decision**: Yes — a 6-character code (e.g. `MAP4K2`) lets students share a map with classmates. Since teachers do not use the app, sharing is peer-to-peer: a student who finds a useful map can share its code with a friend. No auth required to view a map by code.

### Q6: Should maps be cached?
**Decision**: Cache by `(subject, grade, topic | null)`. First generation stores the result. Subsequent requests return the cached tree instantly. Admins can force-regenerate when curriculum updates.

### Q7: Mobile experience?
**Decision**:
- **Mobile (< md)**: Scrollable accordion list, one card per top-level topic. Tapping a concept name opens the full flashcard panel as a bottom sheet.
- **Desktop (≥ md)**: Radial SVG canvas with pinch-zoom and pan. Clicking a node opens the flashcard panel as a side drawer or centred modal.

### Q8: Auth required?
**Decision**: Generating a map requires auth (abuse prevention). Viewing any map by code is fully public, no login needed.

### Q9: AI model?
**Decision**: Claude Sonnet — needed for rich multi-field node content (explanation + keyFacts + example per concept). Reuse existing provider router with `allowFallback: true`.

---

## 3. User Stories (students only — teachers do not use the app)

- As a student, I can pick a subject and grade and get an instant concept map so I know what to study.
- As a student, I can click any concept on the map and read a full explanation with examples, so I can learn directly from the map.
- As a student, I can scroll through accordion cards on my phone to browse concepts without struggling with a tiny SVG.
- As a student, I can share the map's code with a classmate so we study the same overview.
- As a student, I can open a map shared by a classmate without logging in.

---

## 4. Node Content Detail

The node content model is the heart of the interactive learning experience. Every **leaf concept** node carries:

```typescript
interface ConceptMapNode {
  id: string;
  label: string;           // Short name shown on the map (e.g. "Pythagoraan lause")
  emoji?: string;          // e.g. "📐"
  explanation?: string;    // Full explanation — several sentences, student-friendly Finnish
  keyFacts?: string[];     // Bullet list of 2–5 must-know facts
  example?: string;        // Worked example or real-world context
  relatedConcepts?: string[]; // Labels of related nodes (shown as chips in the panel)
  children: ConceptMapNode[];
}
```

**Topic and subtopic nodes** carry `label`, `emoji`, and a brief `explanation` (1–3 sentences overview of the branch). The deep content lives at leaf level.

### Flashcard panel layout (clicking a node)

```
┌─────────────────────────────────────────┐
│  📐  Pythagoraan lause          [×]     │
├─────────────────────────────────────────┤
│  Selitys                                │
│  Pythagoraan lause kertoo, että         │
│  suorakulmaisessa kolmiossa...          │
│  [full paragraph, as many lines        │
│   as needed]                            │
├─────────────────────────────────────────┤
│  Tärkeää muistaa                        │
│  • a² + b² = c²                        │
│  • Toimii vain suorakulmaisissa...     │
│  • Hypotenuusa on pisin sivu           │
├─────────────────────────────────────────┤
│  Esimerkki                              │
│  Jos kateetti a = 3 ja b = 4,          │
│  niin c = √(9+16) = 5                  │
├─────────────────────────────────────────┤
│  Liittyvät käsitteet                    │
│  [Kolmiot] [Neliöjuuri] [Kulmiot]     │
└─────────────────────────────────────────┘
```

On mobile this panel appears as a **bottom sheet** that slides up. On desktop it appears as a **right-side drawer** or centred modal. It is scrollable if content is long.

---

## 5. Shared Components & Design System

### 5.1 Mode Color — Violet

The design system already defines the **map** mode. Use these tokens everywhere — do not invent custom colors:

```ts
// src/lib/design-tokens/colors.ts — already exists
colors.map.primary  // bg-gradient-to-r from-violet-600 to-violet-500
colors.map.hover    // hover:from-violet-700 hover:to-violet-600
colors.map.light    // bg-violet-50 dark:bg-violet-900/20
colors.map.text     // text-violet-600 dark:text-violet-400
colors.map.ring     // ring-violet-500 dark:ring-violet-400
```

SVG node fill colors (Tailwind classes cannot be used inside SVG `fill=` props — use raw values):

| Depth | Role | Hex (light) | Hex (dark) |
|---|---|---|---|
| 0 | Root | `#7c3aed` violet-700 | `#8b5cf6` violet-500 |
| 1 | Topic | `#8b5cf6` violet-500 | `#a78bfa` violet-400 |
| 2 | Subtopic | `#a78bfa` violet-400 | `#c4b5fd` violet-300 |
| 3 | Concept (leaf) | `#ede9fe` violet-100 | `#2e1065` violet-950 |

---

### 5.2 Shared UI Components — Usage Map

#### Page shell

| Surface | Component | Props / notes |
|---|---|---|
| Page header | `AppShellHeader` | `icon=<TreeStructure>`, `title="Tutki"`, `tone="default"`, `trailingAction=<share button>` |
| Page container | `patterns.pageContainer` (`max-w-4xl mx-auto` + spacing) | Wrap all page content |
| Error state | `Alert` + `AlertTitle` + `AlertDescription` | For generation failures |

#### Generator form (`ConceptMapGenerator`)

| Element | Component | Props |
|---|---|---|
| Subject picker | Radix `Select` (already in codebase) | Standard `Input`-styled trigger |
| Grade picker | Radix `Select` or `RadioGroup` | 3 options: 4/5/6 |
| Generate button | `Button` | `mode="map"` `size="lg"` |
| Loading skeleton | `Skeleton` | Multiple rows mimicking accordion cards |

#### SVG canvas (desktop)

| Element | Notes |
|---|---|
| Canvas wrapper | Plain `div` with `overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700` (matches `Card variant="standard"`) |
| Node hit areas | SVG `<circle>` + `<text>` — use hex values from §5.1 depth table |
| Edge lines | SVG `<line>` with `stroke={colors.border.standard}` equivalent (`#e5e7eb` light / `#374151` dark) |

#### Mobile accordion (`ConceptMapAccordion`)

| Element | Component | Props |
|---|---|---|
| Topic row (collapsed) | `Card` | `variant="interactive"` `padding="compact"` |
| Topic title | `CardTitle` | `typography.h4` size |
| Concept list item | plain `button` | `min-h-11` touch target, `typography.body`, `w-full text-left` |

#### Learning panel (`ConceptMapLearningPanel`)

The panel is a **Radix `Dialog`** on all screen sizes — positioned as a bottom sheet on mobile (`fixed bottom-0 inset-x-0 rounded-t-2xl`) and a centred modal on desktop (existing `Dialog.Content` pattern from the design quick reference).

| Element | Component | Props / classes |
|---|---|---|
| Container | Radix `Dialog.Content` | Mobile: `fixed bottom-0 inset-x-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-5 shadow-xl` · Desktop: standard modal pattern (`w-[92vw] max-w-md`) |
| Concept title | `typography.h3` | With emoji prefix |
| Explanation body | `typography.body` | Multi-paragraph prose |
| "Tärkeää muistaa" heading | `typography.h4` | |
| Key facts list | `typography.bodySmall` | `<ul>` with bullet items |
| "Esimerkki" block | `Card` | `variant="elevated"` `padding="compact"` inset within the panel |
| Example text | `typography.bodySmall` | |
| Related concepts heading | `typography.caption` | |
| Related concept chips | `Badge` | `variant="outline"` `size="sm"` — one per related concept label |
| Close button | `Button` | `variant="ghost"` `size="icon"` absolute top-right |

#### Share / copy code

Not a separate component — render inline using:
```tsx
<Button mode="map" variant="secondary" size="sm">
  <Share weight="duotone" size={16} />
  Kopioi koodi
</Button>
```

#### Depth legend

Not a separate component — render three `Badge` elements inline:
```tsx
<Badge variant="default" className="bg-violet-100 text-violet-700">Aihe</Badge>
<Badge variant="default" className="bg-violet-50 text-violet-500">Alaihe</Badge>
<Badge variant="outline" className="border-violet-200 text-violet-400">Käsite</Badge>
```

---

### 5.3 Design Token Usage Summary

| Token | Where used |
|---|---|
| `colors.map.primary` | Generate button background, root node fill |
| `colors.map.text` | Active/selected node label, section headings |
| `colors.map.light` | `AppShellHeader` icon badge background, hover state on accordion rows |
| `colors.map.ring` | Focus ring on interactive nodes and buttons |
| `colors.border.standard` | SVG edge lines, card borders |
| `colors.bg.base` | Page background |
| `colors.bg.elevated` | Learning panel background |
| `typography.h1` | `/map` page title |
| `typography.h3` | Learning panel concept title |
| `typography.h4` | Accordion topic titles, panel section headings |
| `typography.body` | Explanation prose |
| `typography.bodySmall` | Key facts, example text |
| `typography.caption` | Related concepts label |
| `spacing.touchTarget` (`min-h-11`) | All clickable concept items |
| `patterns.pageContainer` | Outer page wrapper on `/map` and `/map/[code]` |
| `patterns.transition.all` | Accordion expand/collapse |
| `patterns.transition.shadow` | Canvas card hover |

---

## 6. Architecture

### 6.1 New Database Table: `concept_maps`


```sql
CREATE TABLE public.concept_maps (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           varchar(6)  UNIQUE NOT NULL,
  subject        varchar     NOT NULL,
  grade          int4        CHECK (grade BETWEEN 1 AND 13),
  topic          text,
  tree           jsonb       NOT NULL,   -- Full ConceptMapNode tree
  model          text        NOT NULL,
  provider       text        NOT NULL,
  user_id        uuid        REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX concept_maps_cache_idx
  ON public.concept_maps (subject, grade, COALESCE(topic, ''));

ALTER TABLE public.concept_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all"    ON public.concept_maps FOR SELECT USING (true);
CREATE POLICY "insert_auth" ON public.concept_maps FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

Migration: `supabase/migrations/YYYYMMDD_concept_maps.sql`

### 6.2 AI Generation

**Prompt template: `src/config/prompt-templates/concept-map.md`**

The prompt instructs the AI to return a full `ConceptMapNode` JSON tree where:
- Labels are short (≤5 words), in Finnish
- `explanation` is student-friendly prose (grades 4–6 reading level)
- `keyFacts` are concise bullet strings
- `example` uses concrete numbers or scenarios appropriate for the grade
- Depth ≤ 4 levels, breadth ≤ 8 children per node, total nodes ≤ 80

**Generation function**: `src/lib/conceptMap/generateConceptMap.ts`
- Uses existing `providerRouter`
- Zod schema validates the full tree recursively
- One retry with stricter prompt on validation failure

**Cache-or-create action**: `src/lib/conceptMap/createOrFetchConceptMap.ts`
1. SELECT from `concept_maps` by `(subject, grade, topic)`
2. If found → return immediately
3. If not → generate, insert, return

### 6.3 New Routes

| Route | Description |
|---|---|
| `/map` | Subject/grade picker — generates or retrieves map |
| `/map/[code]` | View a specific map by code (public, no auth) |

### 6.4 New Components

**Reused from existing mindmap (unchanged):**
- `src/lib/mindMap/layoutTree.ts`
- `src/lib/mindMap/fitScale.ts`
- `src/components/mindMap/MindMapCanvas.tsx` — extended with generic `renderNode` prop

**New components (all use shared UI components from §5):**
```
src/components/conceptMap/
  ConceptMapSession.tsx       Main wrapper: state + desktop SVG / mobile accordion split
  ConceptMapNode.tsx          SVG node — violet depth-coded fill, click → learning panel
  ConceptMapLearningPanel.tsx Radix Dialog as bottom sheet (mobile) / modal (desktop)
  ConceptMapAccordion.tsx     Mobile list: Card + CardContent + concept buttons
  ConceptMapGenerator.tsx     Subject + grade form with Button mode="map"

src/app/map/
  page.tsx                    Generator page
  [code]/page.tsx             Server component — fetches map by code
  [code]/ConceptMapView.tsx   Client component — canvas + panel state
```

**Not new standalone components** (use shared primitives inline):
- Share/copy button → `<Button mode="map" variant="secondary">`
- Depth legend → three `<Badge>` elements with violet tints
- Loading state → `<Skeleton>` rows

### 6.5 Home Screen Integration

Third mode tile added to `/`:
```tsx
<ModeCard
  icon={<TreeStructure weight="duotone" />}
  title="Tutki"
  description="Tutustu aihealueen käsitteisiin kartalla"
  href="/map"
  color="map"  // violet — uses colors.map.* tokens
/>
```

---

## 7. Implementation Steps

### Phase 1 — Core

1. [ ] DB migration: `concept_maps` table
2. [ ] TypeScript types: `src/types/conceptMap.ts`
3. [ ] AI prompt template: `concept-map.md`
4. [ ] Generation function: `generateConceptMap.ts` (with Zod validation)
5. [ ] Cache-or-create action: `createOrFetchConceptMap.ts`
6. [ ] API route: `src/app/api/concept-map/route.ts`
7. [ ] `ConceptMapGenerator.tsx` — `Button mode="map" size="lg"` + Radix Select for subject/grade
8. [ ] Extend `MindMapCanvas` with generic `renderNode` prop
9. [ ] `ConceptMapNode.tsx` — SVG node with violet depth fills (§5.1), click triggers panel
10. [ ] `ConceptMapLearningPanel.tsx` — Radix Dialog, Card/Badge/typography tokens (§5.2)
11. [ ] `ConceptMapAccordion.tsx` — `Card variant="interactive"` + concept `button` rows
12. [ ] `ConceptMapSession.tsx` — wires canvas/accordion + panel state + share button inline
13. [ ] `/map/page.tsx` — `AppShellHeader` + `patterns.pageContainer`
14. [ ] `/map/[code]/page.tsx` + `ConceptMapView.tsx` — shared view
15. [ ] Home screen "Tutki" tile with `color="map"` (violet)

### Phase 2 — Polish

- Results screen → "Näytä käsitekartta" shortcut
- Material-based generation (upload PDF → AI derives map)
- "Harjoittele tätä aihetta" chip in learning panel → filtered question set
- Web Share API / print export

---

## 8. Key Design Decisions

### Node click → full learning panel (not a tooltip)
The panel is not a small popover — it is a proper content area that can be as long as needed. For a leaf concept like "Pythagoraan lause" the AI may generate 2–3 paragraphs of explanation, a worked example, and a key-facts list. The panel is scrollable and takes up ~40% of the screen width on desktop (right drawer), or 60% of screen height on mobile (bottom sheet).

### Student-driven, no teacher role
Maps are generated by students for themselves or shared peer-to-peer. The code is a lightweight sharing mechanism (same as question sets), not a teacher-curated resource.

### Caching ensures peer sharing works
When student A generates "Matematiikka 5. luokka" and shares code `MAP4K2`, student B opening that code sees the identical map. This only holds because maps are cached. Without caching, the same subject+grade would produce a different map each time and the code would lose its meaning.

### Mobile accordion is the primary phone experience
The SVG canvas is not shown on phones. The accordion gives a clean, thumb-friendly way to drill down: topic → subtopics → concepts → learning panel (bottom sheet). This matches how students actually use the app on phones.

---

## 9. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI generates shallow or inconsistent content | Rich prompt with per-field instructions; Zod validation; retry once |
| Too many nodes → unreadable SVG | Hard cap 80 nodes; AI instructed to merge if over limit |
| High cost for popular subjects | Cache by `(subject, grade, topic)` — generated once, served forever |
| Learning panel content too long on mobile | Bottom sheet is scrollable; content truncated with "Näytä lisää" if > 400 chars |
| SVG unreadable on small tablets | Pinch-zoom supported; auto-fit on load |

---

## 10. Out of Scope (Phase 1)

- Cross-subject or cross-grade concept maps
- Student progress tracking within the map (mastery per node)
- Concept dependency arrows (non-tree graph edges)
- Animated node reveals
- Material-based generation
- Print/PDF export

---

## 11. Acceptance Criteria

- [ ] Student can pick subject + grade and receive a concept map within 10 seconds
- [ ] Same subject+grade returns instantly on subsequent requests (cached)
- [ ] Clicking any node opens a learning panel with explanation, key facts, and example
- [ ] Learning panel is scrollable and handles long content gracefully
- [ ] Share code opens the identical map for another user without login
- [ ] Desktop: radial SVG canvas with pinch-zoom and pan
- [ ] Mobile: accordion list with bottom-sheet learning panel
- [ ] Home screen shows "Tutki" tile
- [ ] Works for all 17 subjects
- [ ] No teacher-specific UI, copy, or flows anywhere in the feature
