OpenAI Codex v0.89.0 (research preview)
--------
workdir: /Users/mikko.makipaa/koekertaaja
model: gpt-5.2-codex
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: none
reasoning summaries: auto
session id: 019bf97d-03a6-7350-9ae6-30a7dd72811e
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

# Task 05: Add "How It Works" Section

**Status:** 🔴 Not Started
**Priority:** P1 (Enhanced)
**Estimate:** 2 points

## Goal
Create a simple 4-step guide showing users how to get started with the app.

## Requirements

### Section Structure
- **Section title:** "Näin se toimii"
- 4 numbered steps in clear sequence
- Clean, easy-to-scan layout

### Steps Content

**1️⃣ Valitse aihe**
- Selaa kysymyssarjoja luokittain ja aihealueittain

**2️⃣ Valitse tila**
- Tietovisat tai Kortit

**3️⃣ Aloita harjoittelu**
- Vastaa kysymyksiin ja opi

**4️⃣ Tarkista tulokset**
- Näe edistymisesi ja kerää saavutuksia

### Visual Design
- Mobile: Stack vertically with clear step numbers
- Desktop: Consider horizontal timeline or 2x2 grid
- Large, prominent step numbers (1-4)
- Icons for each step (optional but recommended)
- Proper spacing between steps
- Use emerald for step numbers or active states

### Optional Icons
- Step 1: FolderOpen or MagnifyingGlass
- Step 2: Swap or Cards
- Step 3: Play or PencilSimple
- Step 4: ChartBar or Trophy

## Current Status
- ❌ Not implemented yet

## Acceptance Criteria
- [ ] Section title is clear
- [ ] All 4 steps displayed in order
- [ ] Step numbers are prominent and styled
- [ ] Descriptions are concise and clear
- [ ] Mobile responsive (vertical stack)
- [ ] Desktop layout is clean (horizontal or grid)
- [ ] Optional icons enhance understanding
- [ ] Dark mode styling works
- [ ] Proper spacing and visual hierarchy
- [ ] Semantic HTML (ordered list recommended)

## Files to Modify
- `src/app/page.tsx` (add new section before final CTA)

## Implementation Notes
- Use `<ol>` (ordered list) for semantic HTML
- Style list numbers with custom CSS or use divs with aria-label
- Keep descriptions short (1-2 sentences max)
- Consider using CSS counters for step numbers
- Ensure step numbers are accessible (not decorative only)
- Maintain consistent spacing with other sections

mcp: supabase starting
2026-01-26T08:47:59.411116Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when Auth(TokenRefreshFailed("Failed to parse server response"))
mcp: supabase failed: MCP client for `supabase` failed to start: MCP startup failed: handshaking with MCP server failed: Send message error Transport [rmcp::transport::worker::WorkerTransport<rmcp::transport::streamable_http_client::StreamableHttpClientWorker<rmcp::transport::auth::AuthClient<reqwest::async_impl::client::Client>>>] error: Auth error: OAuth token refresh failed: Failed to parse server response, when send initialize request
mcp startup: failed: supabase
exec
/bin/zsh -lc 'rg --files' in /Users/mikko.makipaa/koekertaaja succeeded in 216ms:
next.config.js
postcss.config.js
src/proxy.ts
LICENSE
src/lib/logger.ts
AGENTS.md
posthog-setup-report.md
tsconfig.json
src/lib/questions/answer-evaluation.ts
src/lib/questions/sequential-utils.ts
MAP_QUESTION_DESIGN_PROPOSAL.md
src/types/index.ts
src/types/database.ts
src/types/questions.ts
CLAUDE.md
eslint.config.mjs
src/lib/supabase/auth.ts
src/lib/supabase/write-queries.ts
src/lib/supabase/client.ts
src/lib/supabase/admin.ts

thinking
**Preparing to edit main page file**
exec
/bin/zsh -lc "sed -n '1,220p' src/app/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 287ms:
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/shared/Footer';
import { AudienceTabs } from '@/components/landing/AudienceTabs';
import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [activeAudience, setActiveAudience] = useState<'oppilaille' | 'huoltajille'>('oppilaille');
  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
exec
/bin/zsh -lc "sed -n '220,520p' src/app/page.tsx" in /Users/mikko.makipaa/koekertaaja succeeded in 106ms:
                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                      <span>Kielioppi</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                      <span>Luetun ymmärtäminen</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
                      <span>Sanaluokat</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-green-100/80 dark:border-green-500/30 bg-green-50/70 dark:bg-green-500/10 shadow-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 dark:bg-green-950/30">
                      <span className="text-2xl" aria-hidden="true">

thinking
**Planning final steps section**

I'm preparing to add a new numbered steps section with phosphor icons and emerald step numbers in a two-by-two grid before the AudienceTabs component, styled consistently with cards and tailwind classes.
file update
M /Users/mikko.makipaa/koekertaaja/src/app/page.tsx
@@ -8,3 +8,3 @@
 import { AudienceTabs } from '@/components/landing/AudienceTabs';
-import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle, FolderOpen, Swap, Play, Trophy } from '@phosphor-icons/react';
 import Image from 'next/image';
@@ -280,2 +280,69 @@
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Näin se toimii</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">Neljä nopeaa askelta aloitukseen.</p>
+            </div>
+            <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    1
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <FolderOpen size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse aihe</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">
+                      Selaa kysymyssarjoja luokittain ja aihealueittain.
+                    </p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    2
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Swap size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse tila</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Tietovisat tai Kortit.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    3
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Play size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Aloita harjoittelu</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Vastaa kysymyksiin ja opi.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    4
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Trophy size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tarkista tulokset</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Näe edistymisesi ja kerää saavutuksia.</p>
+                  </div>
+                </div>
+              </li>
+            </ol>
+          </section>
+
           <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
apply_patch(auto_approved=true) exited 0 in 842ms:
Success. Updated the following files:
M src/app/page.tsx
file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 60ebb186f3a33c0b81cc558ada8f0c7322bb4bc3..89f26662b503f8571280f62dcc4267f8d976d936
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -6,7 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Footer } from '@/components/shared/Footer';
 import { AudienceTabs } from '@/components/landing/AudienceTabs';
-import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle, FolderOpen, Swap, Play, Trophy } from '@phosphor-icons/react';
 import Image from 'next/image';
 
 export default function HomePage() {
@@ -278,6 +278,73 @@
             </div>
           </section>
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Näin se toimii</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">Neljä nopeaa askelta aloitukseen.</p>
+            </div>
+            <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    1
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <FolderOpen size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse aihe</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">
+                      Selaa kysymyssarjoja luokittain ja aihealueittain.
+                    </p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    2
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Swap size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse tila</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Tietovisat tai Kortit.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    3
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Play size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Aloita harjoittelu</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Vastaa kysymyksiin ja opi.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    4
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Trophy size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tarkista tulokset</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Näe edistymisesi ja kerää saavutuksia.</p>
+                  </div>
+                </div>
+              </li>
+            </ol>
+          </section>
+
           <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
         </div>
       </div>

file update:
diff --git a/src/app/page.tsx b/src/app/page.tsx
index 60ebb186f3a33c0b81cc558ada8f0c7322bb4bc3..89f26662b503f8571280f62dcc4267f8d976d936
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -6,7 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Footer } from '@/components/shared/Footer';
 import { AudienceTabs } from '@/components/landing/AudienceTabs';
-import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle, FolderOpen, Swap, Play, Trophy } from '@phosphor-icons/react';
 import Image from 'next/image';
 
 export default function HomePage() {
@@ -278,6 +278,73 @@
             </div>
           </section>
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Näin se toimii</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">Neljä nopeaa askelta aloitukseen.</p>
+            </div>
+            <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    1
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <FolderOpen size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse aihe</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">
+                      Selaa kysymyssarjoja luokittain ja aihealueittain.
+                    </p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    2
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Swap size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse tila</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Tietovisat tai Kortit.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    3
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Play size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Aloita harjoittelu</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Vastaa kysymyksiin ja opi.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    4
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Trophy size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tarkista tulokset</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Näe edistymisesi ja kerää saavutuksia.</p>
+                  </div>
+                </div>
+              </li>
+            </ol>
+          </section>
+
           <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
         </div>
       </div>


thinking
**Confirming no tests needed**

All number texts are styled emerald as intended, with no tests present or run. Preparing the final response accordingly.
codex
Added the “Näin se toimii” section with a semantic ordered list, emerald step numbers, and icons in a responsive 2x2 grid layout before the final CTA area. Styling matches existing layout, supports dark mode, and keeps copy concise.

STATUS: success
SUMMARY: Added the four-step “Näin se toimii” section with prominent emerald numbers, optional icons, and responsive grid layout. Placed before the audience tabs and aligned with existing styling.
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
index 60ebb186f3a33c0b81cc558ada8f0c7322bb4bc3..89f26662b503f8571280f62dcc4267f8d976d936
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -6,7 +6,7 @@
 import { Button } from '@/components/ui/button';
 import { Footer } from '@/components/shared/Footer';
 import { AudienceTabs } from '@/components/landing/AudienceTabs';
-import { BookOpenText, GameController, Cards, CheckCircle } from '@phosphor-icons/react';
+import { BookOpenText, GameController, Cards, CheckCircle, FolderOpen, Swap, Play, Trophy } from '@phosphor-icons/react';
 import Image from 'next/image';
 
 export default function HomePage() {
@@ -278,6 +278,73 @@
             </div>
           </section>
 
+          <section className="mt-12">
+            <div className="flex flex-col gap-2">
+              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Näin se toimii</h2>
+              <p className="text-sm text-gray-600 dark:text-gray-400">Neljä nopeaa askelta aloitukseen.</p>
+            </div>
+            <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    1
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <FolderOpen size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse aihe</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">
+                      Selaa kysymyssarjoja luokittain ja aihealueittain.
+                    </p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    2
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Swap size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Valitse tila</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Tietovisat tai Kortit.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    3
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Play size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Aloita harjoittelu</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Vastaa kysymyksiin ja opi.</p>
+                  </div>
+                </div>
+              </li>
+              <li className="rounded-2xl border border-emerald-100/80 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10 p-5 shadow-sm">
+                <div className="flex items-start gap-4">
+                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white text-2xl font-bold">
+                    4
+                  </div>
+                  <div className="flex-1 space-y-2">
+                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
+                      <Trophy size={24} weight="duotone" />
+                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Tarkista tulokset</h3>
+                    </div>
+                    <p className="text-sm text-gray-700 dark:text-gray-300">Näe edistymisesi ja kerää saavutuksia.</p>
+                  </div>
+                </div>
+              </li>
+            </ol>
+          </section>
+
           <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
         </div>
       </div>

tokens used
17 569
Added the “Näin se toimii” section with a semantic ordered list, emerald step numbers, and icons in a responsive 2x2 grid layout before the final CTA area. Styling matches existing layout, supports dark mode, and keeps copy concise.

STATUS: success
SUMMARY: Added the four-step “Näin se toimii” section with prominent emerald numbers, optional icons, and responsive grid layout. Placed before the audience tabs and aligned with existing styling.
CHANGED FILES:
- src/app/page.tsx
TESTS:
- NOT RUN (not requested)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
