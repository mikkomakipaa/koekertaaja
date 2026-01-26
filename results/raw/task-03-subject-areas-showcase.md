OpenAI Codex v0.89.0 (research preview)
--------
workdir: /Users/mikko.makipaa/koekertaaja
model: gpt-5.2-codex
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: auto
session id: 019bf979-9a70-7ec1-835b-b11757698511
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

# Task 03: Add Subject Areas Showcase Section

**Status:** 🔴 Not Started
**Priority:** P0 (MVP - Essential)
**Estimate:** 3 points

## Goal
Show what subjects and topics can be practiced with clear visual hierarchy and appealing layout.

## Requirements

### Section Structure
- **Section title:** "Mitä voit harjoitella?"
- Visual grid/list of subjects with icons and topics

### Subjects & Topics

**📐 Matematiikka (Blue)**
- Laskutoimitukset
- Geometria
- Ongelmanratkaisu

**✏️ Äidinkieli (Rose/Pink)**
- Kielioppi
- Luetun ymmärtäminen
- Sanaluokat

**🌍 Ympäristöoppi (Green)**
- Suomen maantiede
- Historia
- Yhteiskuntaoppi

### Additional Elements
- "... ja paljon muuta!" teaser text
- Optional: Link to browse all question sets

### Visual Design
- Grid layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each subject is a card or bordered section
- Large emoji or icon for each subject
- Topic bullets or list below subject name
- Rounded corners (rounded-xl)
- Subtle background color variations per subject

## Current Status
- ❌ Not implemented yet
- Note: Subjects are mentioned in proposal but not on current landing page

## Acceptance Criteria
- [ ] Section title is clear and prominent
- [ ] All three subjects displayed with icons
- [ ] 3-4 example topics per subject
- [ ] Grid layout responsive (1/2/3 columns)
- [ ] Color coding per subject (blue/rose/green)
- [ ] "... ja paljon muuta!" teaser included
- [ ] Dark mode styling works well
- [ ] Proper spacing and visual hierarchy
- [ ] Accessible (semantic HTML, proper contrast)

## Files to Modify
- `src/app/page.tsx` (add new section after "Two Modes" section)

## Implementation Notes
- Use emojis for subject icons or Phosphor Icons alternatives
- Color scheme:
  - Matematiikka: text-blue-600 dark:text-blue-400
  - Äidinkieli: text-rose-600 dark:text-rose-400
  - Ympäristöoppi: text-green-600 dark:text-green-400
- Keep consistent with existing card styling
- Consider using grid with gap-6 for spacing
- Optional: Add hover effects on cards

mcp: supabase starting
2026-01-26T08:44:15.817902Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when Auth(TokenRefreshFailed("Failed to parse server response"))
mcp: supabase failed: MCP client for `supabase` failed to start: MCP startup failed: handshaking with MCP server failed: Send message error Transport [rmcp::transport::worker::WorkerTransport<rmcp::transport::streamable_http_client::StreamableHttpClientWorker<rmcp::transport::auth::AuthClient<reqwest::async_impl::client::Client>>>] error: Auth error: OAuth token refresh failed: Failed to parse server response, when send initialize request
mcp startup: failed: supabase

thinking
**Checking for task in agents**
exec
/bin/zsh -lc ls in /Users/mikko.makipaa/koekertaaja succeeded in 127ms:
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
**Requesting page access**
exec
/bin/zsh -lc "sed -n '1,240p' src/app/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 133ms:
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/shared/Footer';
import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors">

thinking
**Planning new themed card grid section**

Planning to add a new section after Two Modes with a grid of subject-themed cards using colored backgrounds and subtle borders for dark mode support, plus an inline button link to browse all question sets labeled "Selaa kaikki harjoitukset."
file update
M /Users/mikko.makipaa/koekertaaja/src/app/page.tsx
@@ -149,2 +149,124 @@
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mitä voit harjoitella?</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">
+                Selkeät aiheet auttavat löytämään harjoittelun joka tuntuu sopivalta.
+              </p>
+            </div>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+              <Card className="rounded-xl border border-blue-100/80 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-blue-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        📐
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Matematiikka</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele perusteet ja opi ratkaisemaan ongelmia.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Laskutoimitukset</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Geometria</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Ongelmanratkaisu</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-rose-100/80 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-rose-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        ✏️
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-rose-600 dark:text-rose-400">Äidinkieli</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Kehitä lukutaitoa ja kirjoittamisen varmuutta.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Kielioppi</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Luetun ymmärtäminen</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Sanaluokat</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-green-100/80 dark:border-green-500/30 bg-green-50/70 dark:bg-green-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-green-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        🌍
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-green-600 dark:text-green-400">Ympäristöoppi</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Tutki luontoa, historiaa ja yhteiskuntaa.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Suomen maantiede</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Historia</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Yhteiskuntaoppi</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+            </div>
+            <div className="mt-4 flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
+              <span className="font-medium text-gray-700 dark:text-gray-300">... ja paljon muuta!</span>
+              <button
+                type="button"
+                onClick={() => router.push('/play')}
+                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
+              >
+                Selaa kaikki harjoitukset
+              </button>
+            </div>
+          </section>
+
           <section id="oppilaille" className="mt-12">
apply_patch(auto_approved=true) exited 0 in 828ms:
Success. Updated the following files:
M src/app/page.tsx
file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 1408f6d2cdfbcbc9b57698d6e58d4c55d5855d6e..f6c2c1210041b5af29b00947af4757c6dbc14bad
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -147,6 +147,128 @@
             </div>
           </section>
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mitä voit harjoitella?</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">
+                Selkeät aiheet auttavat löytämään harjoittelun joka tuntuu sopivalta.
+              </p>
+            </div>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+              <Card className="rounded-xl border border-blue-100/80 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-blue-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        📐
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Matematiikka</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele perusteet ja opi ratkaisemaan ongelmia.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Laskutoimitukset</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Geometria</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Ongelmanratkaisu</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-rose-100/80 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-rose-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        ✏️
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-rose-600 dark:text-rose-400">Äidinkieli</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Kehitä lukutaitoa ja kirjoittamisen varmuutta.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Kielioppi</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Luetun ymmärtäminen</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Sanaluokat</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-green-100/80 dark:border-green-500/30 bg-green-50/70 dark:bg-green-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-green-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        🌍
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-green-600 dark:text-green-400">Ympäristöoppi</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Tutki luontoa, historiaa ja yhteiskuntaa.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Suomen maantiede</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Historia</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Yhteiskuntaoppi</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+            </div>
+            <div className="mt-4 flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
+              <span className="font-medium text-gray-700 dark:text-gray-300">... ja paljon muuta!</span>
+              <button
+                type="button"
+                onClick={() => router.push('/play')}
+                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
+              >
+                Selaa kaikki harjoitukset
+              </button>
+            </div>
+          </section>
+
           <section id="oppilaille" className="mt-12">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">

file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 1408f6d2cdfbcbc9b57698d6e58d4c55d5855d6e..f6c2c1210041b5af29b00947af4757c6dbc14bad
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -147,6 +147,128 @@
             </div>
           </section>
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mitä voit harjoitella?</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">
+                Selkeät aiheet auttavat löytämään harjoittelun joka tuntuu sopivalta.
+              </p>
+            </div>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+              <Card className="rounded-xl border border-blue-100/80 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-blue-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        📐
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Matematiikka</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele perusteet ja opi ratkaisemaan ongelmia.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Laskutoimitukset</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Geometria</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Ongelmanratkaisu</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-rose-100/80 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-rose-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        ✏️
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-rose-600 dark:text-rose-400">Äidinkieli</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Kehitä lukutaitoa ja kirjoittamisen varmuutta.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Kielioppi</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Luetun ymmärtäminen</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Sanaluokat</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-green-100/80 dark:border-green-500/30 bg-green-50/70 dark:bg-green-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-green-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        🌍
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-green-600 dark:text-green-400">Ympäristöoppi</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Tutki luontoa, historiaa ja yhteiskuntaa.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Suomen maantiede</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Historia</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Yhteiskuntaoppi</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+            </div>
+            <div className="mt-4 flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
+              <span className="font-medium text-gray-700 dark:text-gray-300">... ja paljon muuta!</span>
+              <button
+                type="button"
+                onClick={() => router.push('/play')}
+                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
+              >
+                Selaa kaikki harjoitukset
+              </button>
+            </div>
+          </section>
+
           <section id="oppilaille" className="mt-12">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">


thinking
**Confirming emoji use is acceptable**

The requirement allows emoji usage if clearly justified, so using large emoji icons meets this condition despite default ASCII preference. I'll provide the final response with summaries and changed file list accordingly.
codex
Added the “Mitä voit harjoitella?” section with a responsive 1/2/3-column subject grid, color-coded cards, topic lists, teaser, and a browse link in `src/app/page.tsx`. Styled for dark mode and aligned with existing card patterns.

STATUS: success
SUMMARY: Added the subject showcase section with three color-coded cards, topic lists, teaser text, and a browse link, placed after the Two Modes section with responsive grid and dark mode styling.
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
index 1408f6d2cdfbcbc9b57698d6e58d4c55d5855d6e..f6c2c1210041b5af29b00947af4757c6dbc14bad
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -147,6 +147,128 @@
             </div>
           </section>
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mitä voit harjoitella?</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">
+                Selkeät aiheet auttavat löytämään harjoittelun joka tuntuu sopivalta.
+              </p>
+            </div>
+            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
+              <Card className="rounded-xl border border-blue-100/80 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-blue-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        📐
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-blue-600 dark:text-blue-400">Matematiikka</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Harjoittele perusteet ja opi ratkaisemaan ongelmia.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Laskutoimitukset</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Geometria</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
+                      <span>Ongelmanratkaisu</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-rose-100/80 dark:border-rose-500/30 bg-rose-50/70 dark:bg-rose-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-rose-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        ✏️
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-rose-600 dark:text-rose-400">Äidinkieli</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Kehitä lukutaitoa ja kirjoittamisen varmuutta.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Kielioppi</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Luetun ymmärtäminen</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
+                      <span>Sanaluokat</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+
+              <Card className="rounded-xl border border-green-100/80 dark:border-green-500/30 bg-green-50/70 dark:bg-green-500/10 shadow-sm">
+                <CardHeader className="space-y-3">
+                  <div className="flex items-start gap-3">
+                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-green-950/30">
+                      <span className="text-2xl" aria-hidden="true">
+                        🌍
+                      </span>
+                    </div>
+                    <div className="space-y-1">
+                      <CardTitle className="text-lg text-green-600 dark:text-green-400">Ympäristöoppi</CardTitle>
+                      <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
+                        Tutki luontoa, historiaa ja yhteiskuntaa.
+                      </CardDescription>
+                    </div>
+                  </div>
+                </CardHeader>
+                <CardContent>
+                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Suomen maantiede</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Historia</span>
+                    </li>
+                    <li className="flex items-center gap-2">
+                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
+                      <span>Yhteiskuntaoppi</span>
+                    </li>
+                  </ul>
+                </CardContent>
+              </Card>
+            </div>
+            <div className="mt-4 flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
+              <span className="font-medium text-gray-700 dark:text-gray-300">... ja paljon muuta!</span>
+              <button
+                type="button"
+                onClick={() => router.push('/play')}
+                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
+              >
+                Selaa kaikki harjoitukset
+              </button>
+            </div>
+          </section>
+
           <section id="oppilaille" className="mt-12">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Oppilaille</h2>
             <p className="text-gray-600 dark:text-gray-400 text-sm">

tokens used
18 393
Added the “Mitä voit harjoitella?” section with a responsive 1/2/3-column subject grid, color-coded cards, topic lists, teaser, and a browse link in `src/app/page.tsx`. Styled for dark mode and aligned with existing card patterns.

STATUS: success
SUMMARY: Added the subject showcase section with three color-coded cards, topic lists, teaser text, and a browse link, placed after the Two Modes section with responsive grid and dark mode styling.
CHANGED FILES:
- src/app/page.tsx
TESTS:
- NOT RUN (not requested)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
