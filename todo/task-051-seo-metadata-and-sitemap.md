# Task: Add homepage metadata + sitemap for koekertaaja.fi

## Context

- Why this is needed: Improve SEO/social sharing for end users (school kids/parents/teachers) and add a sitemap for the new domain.
- New base URL: https://www.koekertaaja.fi
- Related files:
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
  - `public/robots.txt`

## Scope

- In scope:
  - Update global metadata to reflect homepage messaging and new domain.
  - Add Open Graphmetadata for sharing.
  - Add `sitemap.ts` for static routes.
- Out of scope:
  - Per-page metadata overrides beyond homepage.
  - Generating dynamic URLs for question sets.
  - Creating a new OG image asset (unless one already exists).

## Changes

- [ ] Update `src/app/layout.tsx` metadata:
  - title: “Koekertaaja – Kivaa koe­harjoittelua 4–6‑luokkalaisille” (or similar, kid-friendly)
  - description: mention quizzes, flashcards, points/streaks, AI-generated from materials
  - metadataBase: `https://www.koekertaaja.fi`
  - openGraph: title/description/url/siteName/locale/type
  - alternates.canonical to the base URL
- [ ] Add `src/app/sitemap.ts` with static URLs (at least `/`, `/play`, `/create`).
- [ ] Verify robots still allows crawling (keep `public/robots.txt` unless you decide to move to `robots.ts`).

## Acceptance Criteria

- [ ] `metadata` reflects homepage content and is written in Finnish for kids/parents.
- [ ] Open Graph metadata is present.
- [ ] Sitemap is generated at `/sitemap.xml` with the base URL `https://www.koekertaaja.fi`.

## Testing

- [ ] Manual: load homepage and verify meta tags in page source.
- [ ] Manual: check `/sitemap.xml` output in dev.
- [ ] New/updated tests: none.
