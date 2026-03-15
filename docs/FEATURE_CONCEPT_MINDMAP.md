# Feature Plan: Concept Mindmaps (Käsitekartta)

**Author**: Claude (AI)
**Date**: 2026-03-15
**Status**: Proposal — awaiting validation
**Branch**: `claude/plan-mindmap-feature-iaKGY`

---

## 1. Feature Summary

Add a new **Käsitekartta** (Concept Map) mode to Koekertaaja. Unlike the existing achievements mind map (which visualises mastery of a played question set), this feature lets AI generate a **hierarchical concept map for any subject area**. Students get a visual overview of how topics and sub-concepts relate to each other, making it easier to study before attempting quizzes.

### How it differs from the existing achievements mind map

| | Achievements Map (`/play/achievements`) | Concept Map (new) |
|---|---|---|
| **Purpose** | Show which topics you have already mastered | Show what topics exist and how they connect |
| **Data source** | Player history stored in localStorage | AI-generated from curriculum/material |
| **When used** | After playing quizzes | Before / during studying |
| **Persistence** | Local only | Stored in DB, shareable code |
| **Depth** | Root → Topic (2 levels) | Root → Topic → Subtopic → Concept (up to 4 levels) |
| **Node interaction** | None | Tap to reveal definition/description |

---

## 2. Open Questions (Validated Below)

### Q1: Is this a standalone mode or part of the create flow?
**Decision**: Standalone mode. The home screen (`/`) already has Quiz and Flashcard. Concept Map becomes a third tile: **"Tutki"** (Explore). Entry points:
- Home screen tile → subject/grade picker → generated map
- `/play/[code]` results screen → "Näytä käsitekartta" button (leads to the map for that subject+grade)

### Q2: What triggers generation — curriculum only, or uploaded material?
**Decision**: Both paths:
1. **Curriculum-based** (default): Select subject + grade. AI uses built-in curriculum JSON files already in `/src/config/prompt-templates/curricula/` to generate the concept tree.
2. **Material-based** (optional, v2): Upload a document like the existing create flow. The AI derives a concept map from the material rather than the curriculum.
Phase 1 (this plan) covers curriculum-based only.

### Q3: How many levels deep?
**Decision**: Max 4 levels:
```
Root (subject name)
  └── Topic (e.g., "Geometria")
        └── Subtopic (e.g., "Kolmiot")
              └── Concept (e.g., "Pythagoraan lause")
```
Most subjects fit in 3 levels. Level 4 (leaf concepts) is optional and only included when the curriculum data supports it. The existing `layoutTree.ts` algorithm already handles arbitrary depth.

### Q4: What content does each node carry?
**Decision**: Each node carries:
- `label` (required) — display text
- `description` (optional) — 1–2 sentence definition shown on tap
- `emoji` (optional) — visual hint, helps young students

### Q5: Should the map be shareable?
**Decision**: Yes. Like question sets, a concept map gets a 6-character uppercase code (e.g., `MAP123`). Teachers can share maps with students. Shared maps are viewable without auth.

### Q6: Should maps be cached / regenerated?
**Decision**: Cache by `(subject, grade, topic | null)` key in the database. First generation stores the result. Subsequent requests return the cached tree. Admins can force-regenerate. This avoids repeated AI costs and ensures consistency within a classroom.

### Q7: Where does the mobile experience land?
**Decision**: Same pattern as the existing achievements mind map:
- **Mobile (< md)**: Expandable accordion cards, one per top-level topic.
- **Desktop (≥ md)**: Radial SVG canvas with pinch-zoom and pan.

### Q8: Is auth required to generate/view maps?
**Decision**: Generation requires auth (to prevent abuse). Viewing a map via code is unauthenticated (same as playing a question set).

### Q9: What prompt model to use?
**Decision**: Claude 3.5 Sonnet for generation (complex structured output). Haiku is insufficient for consistent deep hierarchy. Reuse existing provider router with `allowFallback: true`.

---

## 3. User Stories

### Student
- As a student, I can browse concept maps by subject and grade so I understand what the exam might cover.
- As a student, I can tap any node to see a short description of that concept.
- As a student, I can pinch-zoom and pan the map on my phone.
- As a student, I can receive a share code from my teacher and open the exact map they want me to study.

### Teacher
- As a teacher, I can generate a concept map for my class's subject and grade.
- As a teacher, I can copy the map's share code and paste it into a message to students.

---

## 4. Architecture

### 4.1 New Database Table: `concept_maps`

```sql
CREATE TABLE public.concept_maps (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           varchar(6)  UNIQUE NOT NULL,
  subject        varchar     NOT NULL,
  grade          int4        CHECK (grade BETWEEN 1 AND 13),
  topic          text,                          -- Optional focus topic
  tree           jsonb       NOT NULL,          -- Full concept tree
  model          text        NOT NULL,          -- AI model used
  provider       text        NOT NULL,
  user_id        uuid        REFERENCES auth.users(id),
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT NOW() NOT NULL
);

-- Cache lookup index
CREATE UNIQUE INDEX concept_maps_cache_idx
  ON public.concept_maps (subject, grade, COALESCE(topic, ''));

-- RLS: anyone can read, only auth users can insert
ALTER TABLE public.concept_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all"   ON public.concept_maps FOR SELECT USING (true);
CREATE POLICY "insert_auth" ON public.concept_maps FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

Migration file: `supabase/migrations/YYYYMMDD_concept_maps.sql`

### 4.2 New TypeScript Types

**`src/types/conceptMap.ts`**
```typescript
export interface ConceptMapNode {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
  children: ConceptMapNode[];
}

export interface ConceptMapRecord {
  id: string;
  code: string;
  subject: string;
  grade: number | null;
  topic: string | null;
  tree: ConceptMapNode;
  model: string;
  provider: string;
  createdAt: string;
}
```

### 4.3 AI Generation

**`src/lib/conceptMap/generateConceptMap.ts`**

```typescript
interface GenerateConceptMapOptions {
  subject: string;        // subject id
  subjectName: string;    // display name
  subjectType: SubjectType;
  grade: number;
  topic?: string;
}

async function generateConceptMap(options: GenerateConceptMapOptions): Promise<ConceptMapNode>
```

Uses the existing `providerRouter` with a new prompt template. Returns a structured `ConceptMapNode` tree validated against a Zod schema.

**Prompt template: `src/config/prompt-templates/concept-map.md`**

The prompt instructs the AI to:
1. Read the subject curriculum (injected from existing JSON curriculum files).
2. Return a JSON object matching the `ConceptMapNode` schema.
3. Include Finnish labels only.
4. Limit depth to 4 levels, breadth to 8 children per node.
5. Add brief descriptions (max 40 words) for leaf-level concepts.

**Validation**:
- Zod schema validates `ConceptMapNode` recursively
- Max depth check (error if > 4)
- Max total nodes check (cap at 80 to prevent rendering issues)
- Fallback: if validation fails, retry once with stricter prompt

### 4.4 Server Action

**`src/lib/conceptMap/createOrFetchConceptMap.ts`**

```
1. Check cache: SELECT * FROM concept_maps WHERE subject=? AND grade=? AND topic=?
2. If found → return cached record
3. If not found:
   a. Generate tree via AI
   b. Generate 6-char code (same logic as question sets)
   c. INSERT into concept_maps
   d. Return new record
```

### 4.5 New Routes

| Route | Description |
|---|---|
| `/map` | Generator: select subject + grade → create or open existing map |
| `/map/[code]` | View a specific concept map (unauthenticated) |

### 4.6 New UI Components

**Reused from existing mindmap:**
- `src/lib/mindMap/layoutTree.ts` — radial layout, unchanged
- `src/lib/mindMap/fitScale.ts` — auto-fit, unchanged
- `src/components/mindMap/MindMapCanvas.tsx` — SVG canvas, minor extension to support `ConceptMapNode`

**New components:**

```
src/components/conceptMap/
  ConceptMapSession.tsx     Main wrapper (generator state + canvas/mobile)
  ConceptMapNode.tsx        Node renderer — tap to reveal description
  ConceptMapGenerator.tsx   Subject/grade selector form
  ConceptMapLegend.tsx      Depth-level legend
  ConceptMapShareButton.tsx Copy share code button

src/app/map/
  page.tsx                  Generator + browser
  [code]/page.tsx           Shared view
  [code]/ConceptMapView.tsx Client-side component
```

**`ConceptMapNode.tsx`** differs from the achievements `MindMapNode`:
- Tap/click opens an inline popover with the `description`
- Visual depth-based coloring (topic=violet, subtopic=indigo, concept=sky)
- Emoji prefix when present
- No mastery indicator (not applicable here)

### 4.7 Home Screen Integration

Add a third mode tile to `/` alongside "Pelaa" and "Opettele":

```tsx
<ModeCard
  icon={<TreeStructure weight="duotone" />}
  title="Tutki"
  description="Tutustu aihealueen käsitteisiin kartalla"
  href="/map"
  color="sky"
/>
```

---

## 5. Implementation Steps

### Phase 1 — Core generation + basic view

1. [ ] Database migration: create `concept_maps` table
2. [ ] Types: `src/types/conceptMap.ts`
3. [ ] Prompt template: `src/config/prompt-templates/concept-map.md`
4. [ ] AI generation: `src/lib/conceptMap/generateConceptMap.ts`
5. [ ] Server action: `src/lib/conceptMap/createOrFetchConceptMap.ts`
6. [ ] API route: `src/app/api/concept-map/route.ts` (POST generates, GET fetches by code)
7. [ ] Generator component: `ConceptMapGenerator.tsx`
8. [ ] Extend `MindMapCanvas` to accept generic node renderer prop
9. [ ] `ConceptMapNode.tsx` with tap-to-describe popover
10. [ ] `ConceptMapSession.tsx` — desktop SVG + mobile accordion
11. [ ] Route: `/map/page.tsx` — subject/grade picker
12. [ ] Route: `/map/[code]/page.tsx` — shared view
13. [ ] Home screen tile "Tutki"
14. [ ] `ConceptMapShareButton.tsx`

### Phase 2 — Polish & discoverability (v2)

- Link from results screen: "Aihe käsitekartalla" button after finishing a quiz
- Material-based generation (upload a PDF → AI derives concept map)
- "Harjoittele tätä aihetta" → jumps to question set filtered by that topic node
- Print/export to PNG (web share API)

---

## 6. Key Design Decisions

### Rendering strategy
The existing `layoutTree.ts` produces a radial layout from any tree. The same algorithm works for concept maps. The canvas component needs one small extension: a generic `renderNode` prop so that `ConceptMapNode` can render differently from the achievements `MindMapNode` without forking the canvas logic.

### Caching vs always-generating
Caching is important because:
1. Curriculum rarely changes — regenerating identical maps wastes API cost.
2. Teachers expect the same map when sharing a code.
3. AI output is non-deterministic — students should not see different maps on refresh.

Cache invalidation: admin-only `force_regenerate` flag in the generation endpoint.

### Mobile-first accordion vs SVG
The existing achievements map already hides the SVG on mobile and shows accordion cards instead. The same pattern applies here. The accordion is the **primary** mobile experience and should be fully functional without the SVG.

### Max nodes
Cap at 80 total nodes to prevent layout overcrowding on a 580px-tall SVG. The layout algorithm already handles fewer nodes well. If a subject+grade combination produces more than 80 nodes, the AI is instructed to merge smaller leaf concepts into their parent.

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI generates inconsistent tree structure | Zod validation + retry on fail; strict JSON schema in prompt |
| Too many nodes → unreadable SVG | Hard cap at 80 nodes; prune deepest level if exceeded |
| High API cost for popular subjects | Aggressive caching by `(subject, grade, topic)` |
| Mobile SVG too small to read | Mobile shows accordion cards; SVG is desktop-only |
| Teachers share stale cached maps | Add `updated_at` display; admin UI to force-regenerate |

---

## 8. Out of Scope (Phase 1)

- Student-specific personalisation (e.g., highlight concepts they got wrong)
- Cross-subject concept maps
- Concept dependency edges (non-tree graph)
- Animated node reveal
- Material-based generation
- Print/PDF export

---

## 9. Acceptance Criteria

- [ ] Authenticated user can select subject + grade and receive a concept map within 10 seconds
- [ ] Map is cached — same subject+grade returns instantly on subsequent requests
- [ ] Shareable code navigates to the same map without auth
- [ ] Desktop: radial SVG canvas renders with pinch-zoom support
- [ ] Mobile: accordion card list renders all top-level topics
- [ ] Tapping a leaf node shows a description popover (desktop and mobile)
- [ ] Home screen shows "Tutki" tile
- [ ] Works for all 17 existing subjects
- [ ] Passes existing linter and type checks
