OpenAI Codex v0.89.0 (research preview)
--------
workdir: /Users/mikko.makipaa/koekertaaja
model: gpt-5.2-codex
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: auto
session id: 019bf97f-b43f-70d3-ae0e-2680dd0966be
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

# Task 059: Align Quiz and Flashcard Mode Headers

## Status
- **Status**: Pending
- **Created**: 2026-01-25
- **Priority**: P1 (Visual consistency)
- **Estimated Effort**: 2 points (1-2 hours)

## Overview
Align the Quiz mode header to match the Flashcard mode header structure and layout, while maintaining the Quiz mode's indigo color scheme. This creates visual consistency between modes and improves the information architecture.

## Problem Statement
Current headers are inconsistent:

**Quiz Mode Header** (current):
- Simple single-line layout
- Shows: Icon + "Quiz Mode" + "Kysymys X/Y"
- Not sticky
- No exit button in header
- No question set name displayed
- Progress bar is separate below

**Flashcard Mode Header** (benchmark):
- Multi-section sticky header
- Shows: Icon + Question set name + "Kortti X/Y" + Exit button
- Includes shuffle toggle + progress percentage
- Progress bar integrated in header
- Better use of vertical space

## User Requirements
- ✅ **Visual consistency** between Quiz and Flashcard modes
- ✅ **Show question set name** in Quiz header (like Flashcard)
- ✅ **Sticky header** for better navigation
- ✅ **Exit button** accessible from header
- ✅ **Progress information** integrated in header
- ✅ **Maintain indigo color** for Quiz mode identity
- ✅ **Mobile-optimized layout** with progress bar and percentage on same row
- ✅ **Remove shuffle button** from Flashcard mode for cleaner UI

## Acceptance Criteria

### Quiz Mode
- [ ] Quiz header uses same structure as Flashcard header
- [ ] Quiz header is sticky (top-0 z-10)
- [ ] Question set name displayed in Quiz header
- [ ] Exit button available in Quiz header
- [ ] Progress percentage shown in Quiz header
- [ ] Progress bar integrated in Quiz header
- [ ] **Progress bar and percentage on same row** (mobile & desktop)
- [ ] **Mode label hidden on mobile** (sm:flex)
- [ ] Indigo color scheme maintained (not teal)
- [ ] Stats bar (points, streak) remains below header

### Flashcard Mode
- [ ] **Shuffle button removed** from header
- [ ] Progress bar and percentage on same row (consistent with Quiz)
- [ ] Header remains cleaner and more focused

### Both Modes
- [ ] Mobile responsive (all breakpoints)
- [ ] Dark mode fully supported
- [ ] No breaking changes to existing functionality

---

## Technical Implementation

### File to Modify
`src/app/play/[code]/page.tsx`

### Step 0: Add Missing Import

**Add to imports** (around line 22-41):
```tsx
import {
  CircleNotch,
  ListBullets,
  DiamondsFour,
  Fire,
  Book,
  ArrowCounterClockwise,
  GameController,
  ArrowRight,
  TextT,
  ListChecks,
  CheckCircle,
  Shuffle,
  ChatText,
  ListNumbers,
  MapPin,
  Article,
  Smiley,
  Target,
  X, // ADD THIS
} from '@phosphor-icons/react';
```

### Current Quiz Header (lines 722-732)

**BEFORE**:
```tsx
{!isFlashcardMode && (
  <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 text-white px-4 py-3 mb-4 rounded-lg shadow-sm">
    <div className="flex items-center gap-2 max-w-4xl mx-auto">
      <GameController size={20} weight="fill" />
      <span className="font-semibold text-sm">Quiz Mode</span>
      <span className="text-indigo-200 dark:text-indigo-300 text-sm ml-auto">
        Kysymys {currentQuestionIndex + 1}/{selectedQuestions.length}
      </span>
    </div>
  </div>
)}
```

### New Quiz Header (aligned with Flashcard, Mobile-Optimized)

**AFTER**:
```tsx
{!isFlashcardMode && (
  <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 text-white sticky top-0 z-10">
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Top section: Question set name + Exit button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GameController size={20} weight="fill" className="text-indigo-100" />
          <div>
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="text-sm text-indigo-100">
              Kysymys {currentQuestionIndex + 1} / {selectedQuestions.length}
            </p>
          </div>
        </div>
        <Button
          onClick={handleBrowseQuestionSets}
          variant="ghost"
          size="sm"
          aria-label="Lopeta harjoitus"
          className="text-white/90 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5 mr-1" />
          Lopeta
        </Button>
      </div>

      {/* Bottom section: Mode label (desktop only) */}
      <div className="hidden sm:flex items-center mb-3">
        <span className="text-sm text-indigo-100">
          {isReviewMode ? 'Kertaat virheitä' : 'Quiz Mode'}
        </span>
      </div>

      {/* Progress bar + Percentage (same row for mobile) */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentQuestionIndex / selectedQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-indigo-100 font-medium whitespace-nowrap">
          {Math.round((currentQuestionIndex / selectedQuestions.length) * 100)}% valmis
        </span>
      </div>
    </div>
  </div>
)}
```

**Key Mobile Improvements**:
- Progress bar and "X% valmis" on **same row** using flexbox
- Mode label ("Quiz Mode") hidden on mobile (`hidden sm:flex`)
- Progress percentage uses `whitespace-nowrap` to prevent wrapping
- More compact layout on small screens

---

### Additional Changes

#### 1. Remove old ProgressBar component call (lines 756-761)

**BEFORE**:
```tsx
{/* Progress Bar */}
<ProgressBar
  current={currentQuestionIndex + 1}
  total={selectedQuestions.length}
  score={score}
  mode="quiz"
/>
```

**AFTER**:
```tsx
{/* Progress bar now integrated in header */}
```

#### 2. Update handleBrowseQuestionSets usage

Currently the function exists but is only used in a button below. We'll reuse it for the exit button in the header.

**No code changes needed** - function already exists and works correctly.

#### 3. Adjust spacing after header

Since the header is now sticky and taller, adjust the top margin/padding of the content below:

**BEFORE**:
```tsx
<div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8 pb-safe transition-colors">
  <div ref={topRef} className="max-w-2xl mx-auto pt-2">
```

**AFTER**:
```tsx
<div className="min-h-screen bg-white dark:bg-gray-900 pb-safe transition-colors">
  <div ref={topRef} className="max-w-2xl mx-auto p-4 md:p-8 pt-6">
```

#### 4. Remove Shuffle Button from Flashcard Mode

**File**: `src/components/play/FlashcardSession.tsx`

**Location**: Around lines 408-422

**Reasoning**: Simplifies header, reduces cognitive load, shuffle functionality not essential for learning

**BEFORE**:
```tsx
<div className="flex items-center justify-between mb-3">
  <button
    onClick={toggleShuffle}
    type="button"
    aria-pressed={isShuffled}
    className={[
      'flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all',
      isShuffled
        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
        : 'bg-white/15 text-white hover:bg-white/25',
    ].join(' ')}
  >
    <Shuffle size={18} weight={isShuffled ? 'fill' : 'regular'} />
    <span>{isShuffled ? 'Sekoitettu' : 'Järjestyksessä'}</span>
  </button>
  <span className="text-sm text-teal-100">
    {Math.round(progress)}% valmis
  </span>
</div>
```

**AFTER**:
```tsx
{/* Shuffle button removed - cleaner header */}
<div className="flex items-center justify-end mb-3">
  <span className="text-sm text-teal-100 font-medium">
    {Math.round(progress)}% valmis
  </span>
</div>
```

**Optional**: Also update the progress bar + percentage to be on same row like Quiz mode:

```tsx
{/* Progress bar + Percentage (same row, matches Quiz mode) */}
<div className="flex items-center gap-3">
  <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
    <div
      className="bg-white h-2 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
  <span className="text-sm text-teal-100 font-medium whitespace-nowrap">
    {Math.round(progress)}% valmis
  </span>
</div>
```

**Impact**:
- ✅ Cleaner, more focused header
- ✅ Consistent with Quiz mode layout
- ✅ Less UI clutter on mobile
- ⚠️ Users lose shuffle functionality (acceptable - cards are already topic-organized)

---

## Visual Comparison

### Before (Current)

```
┌─────────────────────────────────────────┐
│ 🎮 Quiz Mode        Kysymys 1/15        │ ← Small, not sticky
└─────────────────────────────────────────┘

💎 120    🔥 Putki 5                        ← Stats bar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 20%          ← Progress bar (separate)
```

### After (Aligned - Desktop)

```
┌─────────────────────────────────────────┐ ← Sticky header
│ 🎮 Sanakoe 14.1: Englanti         ✕ Lopeta │
│    Kysymys 1 / 15                       │
│                                         │
│ Quiz Mode                               │ ← Mode label
│ ━━━━━━━━━━━━━━━━━━━━━━━━━  20% valmis  │ ← Bar + % on same row
└─────────────────────────────────────────┘

💎 120    🔥 Putki 5                        ← Stats bar (stays below)
```

### After (Aligned - Mobile)

```
┌─────────────────────────────────────────┐ ← Sticky header
│ 🎮 Sanakoe 14.1              ✕ Lopeta   │
│    Kysymys 1 / 15                       │
│                                         │
│ ━━━━━━━━━━━━━━━━━━━  20% valmis        │ ← Bar + % (mode label hidden)
└─────────────────────────────────────────┘

💎 120    🔥 Putki 5                        ← Stats bar
```

**Mobile Optimizations**:
- "Quiz Mode" label hidden on mobile (saves space)
- Progress bar and percentage on same row
- More compact, cleaner layout

---

## UI/UX Specifications

### Header Layout Structure

```tsx
Sticky Header (z-10, top-0)
├── Section 1: Title Row
│   ├── Left: Icon + Question Set Name + Count
│   └── Right: Exit Button
│
├── Section 2: Info Row
│   ├── Left: Mode Label
│   └── Right: Progress Percentage
│
└── Section 3: Progress Bar
    └── Full-width bar with % fill
```

### Color System (Indigo for Quiz)

**Background Gradient**:
- Light mode: `from-indigo-600 to-indigo-500`
- Dark mode: `from-indigo-700 to-indigo-600`

**Text Colors**:
- Primary text: `text-white`
- Secondary text: `text-indigo-100`
- Icon: `text-indigo-100`

**Interactive Elements**:
- Exit button: `text-white/90 hover:text-white hover:bg-white/10`
- Progress bar track: `bg-white/30`
- Progress bar fill: `bg-white`

### Spacing & Layout

**Padding**:
- Horizontal: `px-4` (16px)
- Vertical: `py-4` (16px)
- Section gaps: `mb-3` (12px)

**Typography**:
- Question set name: `text-lg font-semibold` (18px, 600 weight)
- Question count: `text-sm` (14px)
- Progress percentage: `text-sm` (14px)

**Progress Bar**:
- Height: `h-2` (8px)
- Border radius: `rounded-full`
- Transition: `transition-all duration-300`

---

## Mobile Responsiveness

### Breakpoints

**Mobile (< 640px)**:
- Exit button shows only X icon (hide "Lopeta" text on very small screens if needed)
- Question set name truncates with ellipsis if too long
- All sections stack vertically with full width

**Tablet (640px - 1024px)**:
- Show full exit button text
- Question set name shows full text

**Desktop (1024px+)**:
- Same as tablet with max-width constraint

### Touch Targets

- Exit button: ≥44px height (touch-friendly)
- All interactive elements meet iOS HIG requirements

---

## Dark Mode Support

### Color Adjustments

**Header Background**:
- `dark:from-indigo-700 dark:to-indigo-600` (slightly lighter than light mode)

**Text**:
- Primary: `text-white` (same as light mode)
- Secondary: `text-indigo-100` (consistent across modes)

**Progress Bar**:
- Track: `bg-white/30` (works in both modes)
- Fill: `bg-white` (high contrast in both modes)

**Exit Button**:
- `text-white/90 hover:text-white` (consistent)
- `hover:bg-white/10` (subtle hover in both modes)

---

## Testing Checklist

### Visual Testing
- [ ] Quiz header matches Flashcard header structure
- [ ] Question set name displays correctly
- [ ] Question count shows "X / Y" format with space
- [ ] Exit button positioned in top-right
- [ ] Progress percentage calculates correctly (0-100%)
- [ ] Progress bar fills proportionally
- [ ] Indigo gradient renders correctly
- [ ] Stats bar (points, streak) remains below header
- [ ] No layout shift when header becomes sticky

### Functional Testing
- [ ] Header sticks to top when scrolling
- [ ] Exit button navigates to browse page
- [ ] Progress updates on each question
- [ ] Header displays in review mode
- [ ] Header hides in flashcard mode
- [ ] Question count increments correctly

### Responsive Testing
- [ ] Mobile (320px - 640px): Layout stacks properly
- [ ] Tablet (640px - 1024px): Full layout works
- [ ] Desktop (1024px+): Max-width constraint applied
- [ ] Exit button touch target ≥44px on mobile
- [ ] Question set name truncates on small screens

### Dark Mode Testing
- [ ] Indigo gradient visible in dark mode
- [ ] Text readable (white on indigo)
- [ ] Progress bar visible
- [ ] Exit button hover state works
- [ ] No contrast issues

### Cross-Browser Testing
- [ ] Chrome (Mac/Windows/Android)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (Mac/Windows)
- [ ] Edge (Windows)

### Accessibility Testing
- [ ] Exit button has aria-label
- [ ] Header semantic structure correct
- [ ] Color contrast meets WCAG AAA (white on indigo-600)
- [ ] Keyboard navigation works
- [ ] Screen reader announces header content

---

## Edge Cases & Error Handling

1. **Long question set names**:
   - Truncate with ellipsis on mobile: `truncate`
   - Or wrap to second line: `line-clamp-2`
   - Decision: Truncate for consistency with Flashcard mode

2. **Review mode**:
   - Show "Kertaat virheitä" instead of "Quiz Mode"
   - Question count shows mistakes remaining
   - Works correctly already

3. **First/last question**:
   - Progress bar: 0% at start, 100% at last
   - No edge case issues expected

4. **Sticky header z-index conflicts**:
   - Header: `z-10`
   - Modals/dialogs: `z-50`
   - No conflicts expected

5. **No question set data**:
   - Fallback: `displayName` defaults to 'Kysymyssarja'
   - Already handled in code (line 620)

---

## Implementation Order

### ✅ Phase 1: Quiz Header Structure (30 min) - HIGH PRIORITY
1. Add X icon to imports (`src/app/play/[code]/page.tsx`)
2. Replace simple header with multi-section structure
3. Add sticky positioning (top-0 z-10)
4. Add question set name display
5. Add exit button
6. Test layout on desktop

### ✅ Phase 2: Progress Integration with Mobile Optimization (25 min) - HIGH PRIORITY
1. Add progress percentage calculation
2. Add progress bar to header on same row as percentage
3. Add `hidden sm:flex` to mode label (hide on mobile)
4. Add `whitespace-nowrap` to percentage text
5. Remove old ProgressBar component call
6. Test progress updates on mobile and desktop

### ✅ Phase 3: Flashcard Shuffle Removal (10 min) - MEDIUM PRIORITY
1. Open `src/components/play/FlashcardSession.tsx`
2. Remove shuffle button section (lines 408-422)
3. Update progress bar + percentage to same row (optional consistency)
4. Test Flashcard header looks clean

### ✅ Phase 4: Styling & Polish (20 min) - MEDIUM PRIORITY
1. Ensure indigo colors match exactly
2. Adjust spacing and padding
3. Fix container padding after header
4. Test dark mode on both modes

### ✅ Phase 5: Testing & Refinement (25 min) - MEDIUM PRIORITY
1. Mobile responsive testing (320px, 375px, 768px)
2. Verify mode label hidden on mobile
3. Verify progress bar + percentage on same row
4. Dark mode testing
5. Cross-browser testing
6. Accessibility audit

---

## Rollback Plan

If header changes cause issues:

1. **Immediate rollback** (revert section):
   - Revert Quiz header (lines 722-732)
   - Restore ProgressBar component call (lines 756-761)
   - Keep other changes intact

2. **Partial rollback**:
   - Keep structure, revert sticky positioning
   - Keep question set name, revert exit button
   - Mix and match as needed

3. **No data migration needed** - purely UI changes

---

## Success Metrics

Track these to validate effectiveness:
- **Visual consistency**: Do both modes feel cohesive?
- **User confusion**: Reduced questions about "how to exit quiz"
- **Navigation efficiency**: Faster access to exit button
- **Mobile usability**: Easier navigation on small screens
- **Perceived polish**: Professional, consistent experience

---

## Future Enhancements (Out of Scope)

- **Quiz-specific controls in header**: Add skip button to header
- **Difficulty indicator in header**: Show current difficulty badge
- **Timer in header**: Optional countdown timer for timed quizzes
- **Bookmarks**: Save progress and resume later
- **Share progress**: Share results via link

---

## Dependencies

**NPM Packages**: None (all components exist)

**Icons**:
- `GameController` (already imported and used)
- `X` (need to add to imports from @phosphor-icons/react)

**Components**: Already available
- `Button` (already imported)

**Functions**: Already exist
- `handleBrowseQuestionSets` (line 355)
- `displayName` (line 620)

**Files to Modify**:
- `src/app/play/[code]/page.tsx` (Quiz mode header - align with Flashcard)
- `src/components/play/FlashcardSession.tsx` (Remove shuffle button)

**Files NOT to Modify**:
- `src/components/play/ProgressBar.tsx` (not deleted, just not used in Quiz anymore)

---

## Definition of Done

### Quiz Mode
- [ ] All acceptance criteria met
- [ ] Quiz header structure matches Flashcard header
- [ ] Question set name displayed
- [ ] Exit button in header works
- [ ] Progress percentage and bar integrated
- [ ] **Progress bar and percentage on same row (mobile & desktop)**
- [ ] **Mode label hidden on mobile (sm:flex)**
- [ ] Indigo color scheme maintained
- [ ] Sticky header works on scroll

### Flashcard Mode
- [ ] **Shuffle button completely removed**
- [ ] Progress bar and percentage on same row (consistent with Quiz)
- [ ] Header cleaner and more focused

### Both Modes
- [ ] Mobile responsive (all breakpoints)
- [ ] Dark mode fully supported
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Cross-browser testing completed
- [ ] Accessibility audit passed (WCAG AAA)
- [ ] Visual regression testing completed
- [ ] No breaking changes to existing functionality

---

## Notes

- **Why align to Flashcard header?**: Flashcard header is more feature-rich and better organized
- **Why keep indigo color?**: Maintains mode identity (Quiz = Indigo, Flashcard = Teal)
- **Why sticky header?**: Improves navigation, especially on mobile
- **Why exit in header?**: Faster access, consistent with Flashcard mode
- **Why integrate progress bar?**: Cleaner layout, all nav info in one place
- **Why stats bar stays below?**: Points and streak are real-time game stats, not navigation
- **Why progress bar + percentage on same row?**: Mobile optimization - saves vertical space, cleaner layout
- **Why hide mode label on mobile?**: Users already know they're in Quiz mode from context (question format, points, etc.)
- **Why remove shuffle button from Flashcard?**: Simplifies header, reduces cognitive load, shuffle not essential for topic-organized cards
- **Why keep consistency between modes?**: Both modes should feel like the same app, just different learning styles

---

## Related Tasks

- **Task 055**: Design System Refresh (established indigo/teal color scheme)
- **Task 057**: Mode-Specific UX Improvements (both modes already have features)
- **Task 058**: Button Design System (header uses button components)

---

**Last Updated**: 2026-01-25
**Estimated Completion**: 2026-01-25 (1.5-2 hours total - includes mobile optimization and shuffle removal)
**Priority**: High (visual consistency and UX improvement)

mcp: supabase starting
2026-01-26T08:50:55.536036Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when Auth(TokenRefreshFailed("Failed to parse server response"))
mcp: supabase failed: MCP client for `supabase` failed to start: MCP startup failed: handshaking with MCP server failed: Send message error Transport [rmcp::transport::worker::WorkerTransport<rmcp::transport::streamable_http_client::StreamableHttpClientWorker<rmcp::transport::auth::AuthClient<reqwest::async_impl::client::Client>>>] error: Auth error: OAuth token refresh failed: Failed to parse server response, when send initialize request
mcp startup: failed: supabase

thinking
**Preparing to inspect files**
exec
/bin/zsh -lc ls in /Users/mikko.makipaa/koekertaaja succeeded in 122ms:
AGENTS.md
CLAUDE.md
CONTRIBUTING.md
DESIGN_IMPROVEMENTS.md
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
tokens used
9 603
