OpenAI Codex v0.89.0 (research preview)
--------
workdir: /Users/mikko.makipaa/koekertaaja
model: gpt-5.2-codex
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: auto
session id: 019bf978-7aac-71b1-a141-6393edf0a4a5
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

# Task 02: Create Two Modes Section with Visual Comparison

**Status:** 🔴 Not Started
**Priority:** P0 (MVP - Essential)
**Estimate:** 3 points

## Goal
Visually explain the two study modes (Quiz vs Flashcards) with clear differentiation and color coding.

## Requirements

### Section Structure
- **Section title:** "Kaksi tapaa harjoitella"
- Two side-by-side cards (stack on mobile)
- Cards have distinct visual identity with color coding

### Tietovisat (Quiz Mode) Card
- **Icon:** GameController (indigo color - #4f46e5)
- **Title:** "Tietovisat"
- **Description:** "Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!"
- **Features list:**
  - Pisteet
  - Putket
  - Saavutukset

### Kortit (Flashcard Mode) Card
- **Icon:** Cards (teal color - #14b8a6)
- **Title:** "Kortit"
- **Description:** "Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin."
- **Features list:**
  - Toista niin monta kertaa kuin haluat
  - Oma tahti
  - Ei painetta

### Visual Design
- Cards use rounded-xl borders
- Subtle shadows on hover
- Icons should be duotone weight, size 32px
- Grid layout: 1 column (mobile), 2 columns (tablet+)
- Proper spacing between cards (gap-4 or gap-6)

## Current Status
- ❌ Basic features list exists but not visually separated by mode
- ❌ Missing clear visual distinction between quiz and flashcard
- ❌ No color coding by mode type

## Acceptance Criteria
- [ ] Section clearly separates Quiz and Flashcard modes
- [ ] Each mode has distinct color (indigo vs teal)
- [ ] Cards are side-by-side on tablet/desktop
- [ ] Cards stack vertically on mobile
- [ ] Icons are properly sized and colored
- [ ] Descriptions are clear and concise
- [ ] Features listed with proper formatting
- [ ] Dark mode styling works
- [ ] Hover effects are subtle and smooth

## Files to Modify
- `src/app/page.tsx` (lines 44-91 - refactor features section)

## Implementation Notes
- Replace current flat features list with two distinct cards
- Use Card component from `@/components/ui/card` if available
- Keep existing icons (GameController, Cards) from Phosphor
- Consider extracting to separate component if complex
- Maintain mobile-first approach

mcp: supabase starting
2026-01-26T08:43:02.111650Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when Auth(TokenRefreshFailed("Failed to parse server response"))
mcp: supabase failed: MCP client for `supabase` failed to start: MCP startup failed: handshaking with MCP server failed: Send message error Transport [rmcp::transport::worker::WorkerTransport<rmcp::transport::streamable_http_client::StreamableHttpClientWorker<rmcp::transport::auth::AuthClient<reqwest::async_impl::client::Client>>>] error: Auth error: OAuth token refresh failed: Failed to parse server response, when send initialize request
mcp startup: failed: supabase

thinking
**Planning task check**

I'm preparing to read the task or todo files using shell commands to list and assess what needs execution next.
exec
/bin/zsh -lc ls in /Users/mikko.makipaa/koekertaaja succeeded in 124ms:
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

thinking
**Listing task files**
exec
/bin/zsh -lc 'ls todo' in /Users/mikko.makipaa/koekertaaja succeeded in 117ms:
ARCHIVED-task-009-migrate-claude-to-openai.md
PANDA_REBRAND_SUMMARY.md
TASKS_INDEX.md
TEMPLATE.md
icon-design-proposal.md
landing-page-redesign-proposal.md
task-001-create-prompt-loader.md
task-002-create-prompt-builder.md
task-003-refactor-question-generator.md
task-004-test-and-cleanup-old-prompts.md
task-005-subject-type-routing.md
task-005-timeline-visualization-component.md
task-006-modular-prompt-system.md
task-006-year-indicator-support.md
task-007-skill-level-tagging.md
task-007-update-prompts-timeline-examples.md
task-008-integrate-timeline-mode.md
task-01-hero-section.md
task-010-fix-middleware-location.md
task-011-add-question-set-ownership-and-authz.md

thinking
**Opening task documentation**
exec
/bin/zsh -lc 'cat todo/task-02-two-modes-section.md' in /Users/mikko.makipaa/koekertaaja succeeded in 134ms:
# Task 02: Create Two Modes Section with Visual Comparison

**Status:** 🔴 Not Started
**Priority:** P0 (MVP - Essential)
**Estimate:** 3 points

## Goal
Visually explain the two study modes (Quiz vs Flashcards) with clear differentiation and color coding.

## Requirements

### Section Structure
- **Section title:** "Kaksi tapaa harjoitella"
- Two side-by-side cards (stack on mobile)
- Cards have distinct visual identity with color coding

### Tietovisat (Quiz Mode) Card
- **Icon:** GameController (indigo color - #4f46e5)
- **Title:** "Tietovisat"
- **Description:** "Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!"

thinking
**Opening main page file**
exec
/bin/zsh -lc 'rg -n "features|Kaksi|Tietovisat|Kortit|mode" src/app/page.tsx' in /Users/mikko.makipaa/koekertaaja succeeded in 139ms:
84:              <span>Kaksi harjoittelutapaa: Tietovisat &amp; Kortit</span>
95:                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tietovisat</h3>
104:                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kortit</h3>
exec
/bin/zsh -lc "sed -n '60,130p' src/app/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 142ms:
                onClick={() => scrollToSection('oppilaille')}
                className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Oppilaille
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                type="button"
                onClick={() => scrollToSection('huoltajille')}
                className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                Huoltajille
              </button>
            </div>
          </div>

          {/* Quick Facts */}
          <div className="mt-8 space-y-3 text-center">
            <div className="inline-flex items-center justify-center gap-2 text-base text-gray-700 dark:text-gray-300">
              <CheckCircle size={20} weight="duotone" className="text-emerald-500" />
exec
/bin/zsh -lc "sed -n '130,210p' src/app/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 132ms:
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Avaa saavutuksia</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Täydelliset pisteet ja pitkät putket ansaitsevat merkkejä</p>
              </div>
            </div>
          </div>

          <section id="oppilaille" className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Pelaa lyhyitä, hauskoja harjoituksia ja kerää pisteitä omassa tahdissa.
            </p>
          </section>

          <section id="huoltajille" className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Huoltajille</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tue kotona oppimista helposti ja seuraa edistystä ilman kilpailua.
            </p>
          </section>

thinking
**Reviewing file imports for Card component**

I'm checking the top of the file to see if the Card component is already imported for replacing the features section with two new cards.
exec
/bin/zsh -lc "sed -n '1,60p' src/app/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 138ms:
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/shared/Footer';
import {
  DiamondsFour,
  Fire,
  Trophy,
  BookOpenText,
  GameController,
  Cards,
  CheckCircle
} from '@phosphor-icons/react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const scrollToSection = (id: string) => {


thinking
**Replacing features with new card section**

Planning to remove the old features list and add a new section titled "Kaksi tapaa harjoitella" featuring cards with 32-size duotone icons in exact indigo-600 (#4f46e5) and teal-500 (#14b8a6), styled with rounded-xl borders, subtle shadows on hover, and a responsive two-column grid on tablets.
thinking
**Refining new cards and cleaning imports**

Updating cards with exact description text, duotone 32 icons, and small bullet dots for proper formatting while preserving dark mode styling. Planning to remove old features list and clean unused icon imports like DiamondsFour, Fire, and Trophy after confirming they aren't used elsewhere in the file.
file update
M /Users/mikko.makipaa/koekertaaja/src/app/page.tsx
@@ -6,11 +6,3 @@
 import { Footer } from '@/components/shared/Footer';
-import {
-  DiamondsFour,
-  Fire,
-  Trophy,
-  BookOpenText,
-  GameController,
-  Cards,
-  CheckCircle
-} from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
 import Image from 'next/image';
@@ -87,50 +79,71 @@
 
-          {/* Features */}
-          <div className="mt-12 space-y-4">
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <GameController size={28} weight="duotone" className="text-blue-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tietovisat</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Testaa tietosi monivalintatehtävillä ja muilla kysymystyypeillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Cards size={28} weight="duotone" className="text-green-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kortit</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Harjoittele aktiivista muistamista täydennystehtävillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <DiamondsFour size={28} weight="duotone" className="text-amber-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kerää pisteitä</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Saat 10 pistettä per oikea vastaus, +5 putkesta</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Fire size={28} weight="duotone" className="text-orange-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rakenna putkia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Vastaa 3+ oikein peräkkäin bonuspisteisiin</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Trophy size={28} weight="duotone" className="text-yellow-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Avaa saavutuksia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Täydelliset pisteet ja pitkät putket ansaitsevat merkkejä</p>
-              </div>
+          {/* Two Modes */}
+          <section className="mt-12">
+            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kaksi tapaa harjoitella</h2>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <Card className="rounded-xl border border-indigo-100/70 dark:border-indigo-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
+                      <GameController size={32} weight="duotone" className="text-indigo-600" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Tietovisat</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Pisteet</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Putket</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Saavutukset</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-teal-100/70 dark:border-teal-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/10">
+                      <Cards size={32} weight="duotone" className="text-teal-500" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Kortit</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Toista niin monta kertaa kuin haluat</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Oma tahti</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Ei painetta</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
             </div>
-          </div>
+          </section>
 
apply_patch(auto_approved=true) exited 0 in 820ms:
Success. Updated the following files:
M src/app/page.tsx
file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 0f1b2d251d0451e4b59b1693050729fd489c256e..1408f6d2cdfbcbc9b57698d6e58d4c55d5855d6e
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -4,15 +4,7 @@
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Footer } from '@/components/shared/Footer';
-import {
-  DiamondsFour,
-  Fire,
-  Trophy,
-  BookOpenText,
-  GameController,
-  Cards,
-  CheckCircle
-} from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
 import Image from 'next/image';
 
 export default function HomePage() {
@@ -85,54 +77,75 @@
             </div>
           </div>
 
-          {/* Features */}
-          <div className="mt-12 space-y-4">
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <GameController size={28} weight="duotone" className="text-blue-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tietovisat</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Testaa tietosi monivalintatehtävillä ja muilla kysymystyypeillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Cards size={28} weight="duotone" className="text-green-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kortit</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Harjoittele aktiivista muistamista täydennystehtävillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <DiamondsFour size={28} weight="duotone" className="text-amber-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kerää pisteitä</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Saat 10 pistettä per oikea vastaus, +5 putkesta</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Fire size={28} weight="duotone" className="text-orange-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rakenna putkia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Vastaa 3+ oikein peräkkäin bonuspisteisiin</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Trophy size={28} weight="duotone" className="text-yellow-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Avaa saavutuksia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Täydelliset pisteet ja pitkät putket ansaitsevat merkkejä</p>
-              </div>
+          {/* Two Modes */}
+          <section className="mt-12">
+            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kaksi tapaa harjoitella</h2>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <Card className="rounded-xl border border-indigo-100/70 dark:border-indigo-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
+                      <GameController size={32} weight="duotone" className="text-indigo-600" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Tietovisat</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Pisteet</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Putket</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Saavutukset</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-teal-100/70 dark:border-teal-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/10">
+                      <Cards size={32} weight="duotone" className="text-teal-500" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Kortit</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Toista niin monta kertaa kuin haluat</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Oma tahti</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Ei painetta</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
             </div>
-          </div>
+          </section>
 
           <section id="oppilaille" className="mt-12">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>

file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 0f1b2d251d0451e4b59b1693050729fd489c256e..1408f6d2cdfbcbc9b57698d6e58d4c55d5855d6e
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -4,15 +4,7 @@
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Footer } from '@/components/shared/Footer';
-import {
-  DiamondsFour,
-  Fire,
-  Trophy,
-  BookOpenText,
-  GameController,
-  Cards,
-  CheckCircle
-} from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
 import Image from 'next/image';
 
 export default function HomePage() {
@@ -85,54 +77,75 @@
             </div>
           </div>
 
-          {/* Features */}
-          <div className="mt-12 space-y-4">
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <GameController size={28} weight="duotone" className="text-blue-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tietovisat</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Testaa tietosi monivalintatehtävillä ja muilla kysymystyypeillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Cards size={28} weight="duotone" className="text-green-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kortit</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Harjoittele aktiivista muistamista täydennystehtävillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <DiamondsFour size={28} weight="duotone" className="text-amber-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kerää pisteitä</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Saat 10 pistettä per oikea vastaus, +5 putkesta</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Fire size={28} weight="duotone" className="text-orange-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rakenna putkia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Vastaa 3+ oikein peräkkäin bonuspisteisiin</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Trophy size={28} weight="duotone" className="text-yellow-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Avaa saavutuksia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Täydelliset pisteet ja pitkät putket ansaitsevat merkkejä</p>
-              </div>
+          {/* Two Modes */}
+          <section className="mt-12">
+            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kaksi tapaa harjoitella</h2>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <Card className="rounded-xl border border-indigo-100/70 dark:border-indigo-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
+                      <GameController size={32} weight="duotone" className="text-indigo-600" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Tietovisat</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Pisteet</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Putket</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Saavutukset</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-teal-100/70 dark:border-teal-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/10">
+                      <Cards size={32} weight="duotone" className="text-teal-500" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Kortit</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Toista niin monta kertaa kuin haluat</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Oma tahti</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Ei painetta</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
             </div>
-          </div>
+          </section>
 
           <section id="oppilaille" className="mt-12">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>


thinking
**Finalizing card section update**

Implemented two-mode section with card grid layout and responsive stacking in `src/app/page.tsx`, incorporating dark mode colors and smooth hover shadows; no tests run or new tasks needed.
codex
Implemented the two-mode comparison section as a grid of distinct cards with indigo/teal styling, duotone 32px icons, hover shadows, and feature lists, replacing the old flat features list in `src/app/page.tsx`.

STATUS: success
SUMMARY: Replaced the features list with a “Kaksi tapaa harjoitella” section featuring two color-coded cards for Tietovisat and Kortit, including updated descriptions and bullet feature lists.
CHANGED FILES:
- src/app/page.tsx
TESTS:
- NOT RUN (not requested)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 0f1b2d251d0451e4b59b1693050729fd489c256e..1408f6d2cdfbcbc9b57698d6e58d4c55d5855d6e
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -4,15 +4,7 @@
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Footer } from '@/components/shared/Footer';
-import {
-  DiamondsFour,
-  Fire,
-  Trophy,
-  BookOpenText,
-  GameController,
-  Cards,
-  CheckCircle
-} from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
 import Image from 'next/image';
 
 export default function HomePage() {
@@ -85,54 +77,75 @@
             </div>
           </div>
 
-          {/* Features */}
-          <div className="mt-12 space-y-4">
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <GameController size={28} weight="duotone" className="text-blue-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tietovisat</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Testaa tietosi monivalintatehtävillä ja muilla kysymystyypeillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Cards size={28} weight="duotone" className="text-green-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kortit</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Harjoittele aktiivista muistamista täydennystehtävillä</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <DiamondsFour size={28} weight="duotone" className="text-amber-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kerää pisteitä</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Saat 10 pistettä per oikea vastaus, +5 putkesta</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Fire size={28} weight="duotone" className="text-orange-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rakenna putkia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Vastaa 3+ oikein peräkkäin bonuspisteisiin</p>
-              </div>
-            </div>
-            <div className="flex items-start gap-3">
-              <div className="flex-shrink-0">
-                <Trophy size={28} weight="duotone" className="text-yellow-500" />
-              </div>
-              <div>
-                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Avaa saavutuksia</h3>
-                <p className="text-gray-600 dark:text-gray-400 text-sm">Täydelliset pisteet ja pitkät putket ansaitsevat merkkejä</p>
-              </div>
+          {/* Two Modes */}
+          <section className="mt-12">
+            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kaksi tapaa harjoitella</h2>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <Card className="rounded-xl border border-indigo-100/70 dark:border-indigo-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
+                      <GameController size={32} weight="duotone" className="text-indigo-600" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Tietovisat</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Pisteet</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Putket</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
+                      <span>Saavutukset</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-teal-100/70 dark:border-teal-500/30 shadow-sm hover:shadow-md transition-shadow">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/10">
+                      <Cards size={32} weight="duotone" className="text-teal-500" />
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Kortit</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Toista niin monta kertaa kuin haluat</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Oma tahti</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-teal-500" aria-hidden="true" />
+                      <span>Ei painetta</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
             </div>
-          </div>
+          </section>
 
           <section id="oppilaille" className="mt-12">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>

tokens used
14 847
Implemented the two-mode comparison section as a grid of distinct cards with indigo/teal styling, duotone 32px icons, hover shadows, and feature lists, replacing the old flat features list in `src/app/page.tsx`.

STATUS: success
SUMMARY: Replaced the features list with a “Kaksi tapaa harjoitella” section featuring two color-coded cards for Tietovisat and Kortit, including updated descriptions and bullet feature lists.
CHANGED FILES:
- src/app/page.tsx
TESTS:
- NOT RUN (not requested)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
