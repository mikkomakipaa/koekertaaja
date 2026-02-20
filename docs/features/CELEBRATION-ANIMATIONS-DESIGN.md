# Celebration Animations Design

## Overview

Enhanced celebrations on ResultsScreen for two special achievements:
1. **Perfect Score** (100%) - First time per question set only
2. **All Badges Unlocked** - Once when completing badge collection

## Design Decisions

- ✅ **Perfect Score**: Confetti Rain animation
- ✅ **All Badges**: Trophy Reveal animation
- ✅ **No sound effects** for v1 (visual-only)
- ✅ **Perfect score**: Only first time per question set (tracked in localStorage)

## 1. Perfect Score Celebration (100%)

### Trigger Conditions
- Score: 100% (all questions correct, no skipped)
- First time achieving perfect score on this specific question set
- Tracked in localStorage: `perfect_scores_${questionSetCode}`

### Visual Design

```
┌─────────────────────────────────────────┐
│                                         │
│  🎉 🎊 ⭐ 🎉 🎊 ⭐ (Confetti falling)  │
│                                         │
│         💯 TÄYDELLINEN SUORITUS! 💯     │
│                                         │
│    Sait kaikki kysymykset oikein!       │
│                                         │
│         [Jatka harjoittelua]            │
│                                         │
│  🎉 ⭐ 🎊 🎉 ⭐ 🎊                       │
└─────────────────────────────────────────┘
```

**Animation Sequence:**
1. **Fade in overlay** (300ms) - Semi-transparent dark background
2. **Confetti burst** - Particles fall from top
3. **Title appears** - "TÄYDELLINEN SUORITUS!" scales up (scale 0.8 → 1.0)
4. **Subtitle fades in** - "Sait kaikki kysymykset oikein!"
5. **Button appears** - Bounce animation
6. **Confetti continues** - Falls for 3 seconds total

**Confetti Specifications:**
- **Colors**: Emerald-500, Amber-500, Blue-500, Purple-500, Pink-500 (random mix)
- **Count**: 60-80 pieces
- **Fall duration**: 3 seconds
- **Physics**: Slight rotation, varying speeds, gentle side drift
- **Size**: Mix of 8px, 12px, 16px squares/circles

### Text Content (Finnish)
- **Title**: "TÄYDELLINEN SUORITUS!" or "100% OIKEIN!"
- **Subtitle**: "Sait kaikki kysymykset oikein!"
- **Badge unlocked**: "🏆 Täydellinen-merkki avattu!" (if first perfect score ever)
- **Button**: "Jatka harjoittelua" or "Mahtavaa!"

### Colors
- Background overlay: `bg-black/50 dark:bg-black/70`
- Title: `text-emerald-600 dark:text-emerald-400` (gradient optional)
- Subtitle: `text-slate-900 dark:text-slate-100`
- Card background: `bg-white dark:bg-slate-900`

---

## 2. All Badges Unlocked Celebration

### Trigger Conditions
- All 12 badges unlocked (check `badges.every(b => b.unlocked)`)
- First time achieving this (tracked in localStorage: `all_badges_unlocked`)
- Triggered AFTER results are displayed (separate from perfect score)

### Visual Design

```
┌─────────────────────────────────────────┐
│                                         │
│              ✨ ✨ ✨ ✨                │
│                                         │
│                  🏆                     │
│             (Trophy grows)              │
│                                         │
│         MESTARI SUORITTAJA!             │
│                                         │
│   Olet avannut kaikki 12 merkkiä!       │
│                                         │
│  🌟 🔥 💪 🎯 ⭐ 🚀 ⚡ 🎪 🔥 🔥 🔥      │
│  (All badge emojis displayed)           │
│                                         │
│         [Upeaa työtä!]                  │
│                                         │
│              ✨ ✨ ✨ ✨                │
└─────────────────────────────────────────┘
```

**Animation Sequence:**
1. **Fade in overlay** (300ms) - Darker than perfect score
2. **Trophy entrance** - Scales from 0 to 1.2 to 1.0 (elastic bounce)
3. **Sparkles appear** - Around trophy, pulsing
4. **Title appears** - Slide up from bottom with fade
5. **Subtitle fades in** - "Olet avannut kaikki 12 merkkiä!"
6. **Badge carousel** - All badge emojis slide in from left, arrange in arc
7. **Continuous sparkle** - Gentle pulsing around trophy
8. **Button appears** - Fade in with slight bounce

**Trophy Specifications:**
- **Icon**: 🏆 (emoji) or Trophy SVG from Phosphor Icons
- **Size**: 120px (large, prominent)
- **Color**: Gold gradient (`from-amber-400 to-yellow-500`)
- **Glow effect**: `shadow-2xl shadow-amber-500/50`
- **Animation**: Subtle float (up/down 10px, 2s duration, infinite)

**Sparkle Specifications:**
- **Count**: 20-30 sparkles
- **Position**: Circular pattern around trophy
- **Animation**: Fade in/out (1s duration, staggered start times)
- **Colors**: White, yellow, gold
- **Size**: 4px stars

### Text Content (Finnish)
- **Title**: "MESTARI SUORITTAJA!" or "KAIKKI MERKIT AVATTU!"
- **Subtitle**: "Olet avannut kaikki 12 merkkiä!"
- **Flavor text** (optional): "Olet todellinen oppimisen mestari!"
- **Button**: "Upeaa työtä!" or "Kiitos!"

### Colors
- Background overlay: `bg-black/60 dark:bg-black/80` (darker than perfect score)
- Trophy: `text-amber-400` with glow
- Title: `text-amber-600 dark:text-amber-400` (gold theme)
- Subtitle: `text-slate-900 dark:text-slate-100`
- Card background: `bg-white dark:bg-slate-900`

---

## Technical Implementation

### Component Structure

```typescript
// New file: src/components/celebrations/CelebrationModal.tsx

interface CelebrationModalProps {
  type: 'perfect-score' | 'all-badges';
  onClose: () => void;
  questionSetName?: string; // For perfect score context
}

export function CelebrationModal({ type, onClose, questionSetName }: CelebrationModalProps) {
  // Render appropriate celebration
}
```

### Animation Library

**Option 1: CSS Animations (Recommended)**
- Pure CSS keyframes
- Lightweight, performant
- Full control over timing
- No external dependencies

**Option 2: Framer Motion**
- React animation library
- Easier complex sequences
- Better physics simulation
- ~50kb bundle size

**Recommendation**: Start with CSS animations (simpler, lighter), upgrade to Framer Motion if needed.

### Confetti Implementation

```typescript
// src/components/celebrations/Confetti.tsx

interface ConfettiPiece {
  id: number;
  x: number; // Start position (0-100%)
  delay: number; // Start delay (0-300ms)
  duration: number; // Fall duration (2000-3000ms)
  rotation: number; // Initial rotation (0-360deg)
  color: string; // Random from palette
  size: number; // 8, 12, or 16px
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 300,
    duration: 2000 + Math.random() * 1000,
    rotation: Math.random() * 360,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: [8, 12, 16][Math.floor(Math.random() * 3)],
  }));
}
```

### Trophy Animation

```css
@keyframes trophy-entrance {
  0% {
    transform: scale(0) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes trophy-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.trophy {
  animation: trophy-entrance 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55),
             trophy-float 2s ease-in-out 0.8s infinite;
}
```

### LocalStorage Tracking

```typescript
// Track perfect scores per question set
const PERFECT_SCORES_KEY = 'koekertaaja_perfect_scores';

function hasCelebratedPerfectScore(questionSetCode: string): boolean {
  try {
    const stored = localStorage.getItem(PERFECT_SCORES_KEY);
    const celebrated: string[] = stored ? JSON.parse(stored) : [];
    return celebrated.includes(questionSetCode);
  } catch {
    return false;
  }
}

function markPerfectScoreCelebrated(questionSetCode: string): void {
  try {
    const stored = localStorage.getItem(PERFECT_SCORES_KEY);
    const celebrated: string[] = stored ? JSON.parse(stored) : [];
    if (!celebrated.includes(questionSetCode)) {
      celebrated.push(questionSetCode);
      localStorage.setItem(PERFECT_SCORES_KEY, JSON.stringify(celebrated));
    }
  } catch (error) {
    console.error('Failed to mark perfect score celebrated:', error);
  }
}

// Track all badges unlocked celebration
const ALL_BADGES_KEY = 'koekertaaja_all_badges_celebrated';

function hasCelebratedAllBadges(): boolean {
  return localStorage.getItem(ALL_BADGES_KEY) === 'true';
}

function markAllBadgesCelebrated(): void {
  localStorage.setItem(ALL_BADGES_KEY, 'true');
}
```

### Integration with ResultsScreen

```typescript
// In ResultsScreen.tsx

const { badges, recordSession } = useBadges(questionSetCode);
const [showCelebration, setShowCelebration] = useState<'perfect-score' | 'all-badges' | null>(null);

useEffect(() => {
  // Record session (triggers badge checks)
  recordSession({ score, totalQuestions, bestStreak, totalPoints, durationSeconds, difficulty });

  // Check for perfect score celebration (first time only)
  if (score === total && questionSetCode) {
    if (!hasCelebratedPerfectScore(questionSetCode)) {
      setShowCelebration('perfect-score');
      markPerfectScoreCelebrated(questionSetCode);
    }
  }

  // Check for all badges unlocked celebration
  const allBadgesUnlocked = badges.every(b => b.unlocked);
  if (allBadgesUnlocked && !hasCelebratedAllBadges()) {
    // Delay to show after perfect score celebration (if both triggered)
    setTimeout(() => {
      setShowCelebration('all-badges');
      markAllBadgesCelebrated();
    }, showCelebration === 'perfect-score' ? 4000 : 500);
  }
}, []);

return (
  <>
    {/* Existing results screen */}
    <div>...</div>

    {/* Celebration modals */}
    {showCelebration === 'perfect-score' && (
      <CelebrationModal
        type="perfect-score"
        questionSetName={questionSetName}
        onClose={() => setShowCelebration(null)}
      />
    )}

    {showCelebration === 'all-badges' && (
      <CelebrationModal
        type="all-badges"
        onClose={() => setShowCelebration(null)}
      />
    )}
  </>
);
```

---

## Accessibility

### Screen Reader Support
- Announce celebration title and subtitle
- Skip animation option (instant display)
- Keyboard-accessible close button

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="celebration-title"
  aria-describedby="celebration-description"
>
  <h2 id="celebration-title">TÄYDELLINEN SUORITUS!</h2>
  <p id="celebration-description">Sait kaikki kysymykset oikein!</p>
</div>
```

### Motion Sensitivity
- Respect `prefers-reduced-motion`
- Disable confetti/sparkles
- Show static celebration instead

```css
@media (prefers-reduced-motion: reduce) {
  .confetti,
  .sparkle,
  .trophy-float {
    animation: none !important;
  }
}
```

---

## Performance Considerations

### Confetti Optimization
- Use CSS transforms (GPU-accelerated)
- Limit particle count on mobile (40 instead of 80)
- Remove particles from DOM after animation completes
- Use `will-change: transform` sparingly

### Trophy Animation
- Single SVG or emoji (no complex rendering)
- CSS animations only (no JS loop)
- Opacity transitions for sparkles (not position)

### Bundle Size
- Keep celebration code in separate component (code-split)
- Lazy load on first celebration trigger
- ~5-10kb additional bundle

---

## Testing Scenarios

### Perfect Score Celebration
- [ ] Shows on first perfect score for a question set
- [ ] Does NOT show on second perfect score for same set
- [ ] Shows again for different question set
- [ ] Works with Aikahaaste mode
- [ ] Works with skipped questions (should NOT trigger if any skipped)
- [ ] Tracks correctly across page refreshes
- [ ] Works in light and dark mode

### All Badges Celebration
- [ ] Shows ONLY when all 12 badges unlocked
- [ ] Shows ONLY once (tracked in localStorage)
- [ ] Does not show again after refresh
- [ ] If perfect score AND all badges triggered together, shows both (sequentially)
- [ ] Works in light and dark mode
- [ ] Badge emojis all visible and correct

### Accessibility
- [ ] Screen reader announces celebration
- [ ] Can close with Escape key
- [ ] Can close with Enter on button
- [ ] Animations disabled with `prefers-reduced-motion`
- [ ] Focus trapped in modal
- [ ] Focus returns to results after close

### Performance
- [ ] Confetti animates smoothly (60fps)
- [ ] No jank on low-end devices
- [ ] Modal closes cleanly (no memory leaks)
- [ ] Works on mobile (tested on real device)

---

## Future Enhancements (v2)

- 🔊 **Sound effects** - Optional celebration sounds
- 🎨 **Custom confetti colors** - Match subject/theme
- ⏱️ **Speed record celebrations** - Beat personal best time
- 📊 **Streak milestone celebrations** - 5, 10, 20 day streaks
- 🎭 **Themed celebrations** - Holiday/seasonal variants
- 🏅 **Shareable achievements** - Export celebration as image
- 🎯 **Challenge completions** - Custom challenge celebrations
- 🌈 **Rainbow confetti** - For all-badges (more special than perfect score)
- 🎪 **Full-screen takeover** - More dramatic for all-badges
- 💾 **Replay celebration** - View past celebrations from profile

---

## Summary

**Two celebration types:**
1. ✨ **Perfect Score** - Confetti rain, first time per question set only
2. 🏆 **All Badges Unlocked** - Trophy reveal, once ever

**Implementation approach:**
- CSS animations (lightweight, performant)
- LocalStorage tracking (no backend needed)
- Accessible (ARIA labels, keyboard support, reduced motion)
- Mobile-optimized (fewer particles, touch-friendly)

**Estimated effort:** 1-2 days
**Bundle impact:** ~5-10kb
**UX impact:** High (motivational, rewarding, memorable)
