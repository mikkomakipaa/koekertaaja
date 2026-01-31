# Task: Map performance optimization - Lazy loading, caching, bundle size

## Context

- Map data files (TopoJSON) can be 30-100KB per map.
- Loading all maps upfront impacts page load performance.
- Mobile users on slow connections need optimized delivery.
- Map components add ~65KB to bundle (react-simple-maps + d3-geo).
- Related docs: `MAP_QUESTION_DESIGN_PROPOSAL.md`
- Related files: `src/components/questions/map/`, `next.config.js`

## Scope

- In scope:
  - Lazy-load map data only when map question appears.
  - Code-split map components to reduce initial bundle.
  - Configure CDN caching for map assets (1 year TTL).
  - Add loading states and error boundaries.
  - Monitor bundle size impact (target: <70KB added, code-split).
- Out of scope:
  - Server-side rendering of maps (complex, low ROI).
  - Real-time map data updates.

## Changes

- [ ] Use dynamic imports for map components: `const MapQuestion = lazy(() => import('./map/MapQuestion'))`.
- [ ] Create `useMapData` hook for lazy-loading TopoJSON files.
- [ ] Add loading spinner/skeleton while map data fetches.
- [ ] Add error boundary for map rendering failures.
- [ ] Configure `next.config.js` headers for aggressive caching of `/public/maps/**`.
- [ ] Add bundle analysis script: `npm run analyze` (using @next/bundle-analyzer).
- [ ] Document performance metrics in PR description.

## Acceptance Criteria

- [ ] Map components are code-split (verify with bundle analyzer).
- [ ] Map data is fetched only when map question is rendered.
- [ ] Cache headers set: `Cache-Control: public, max-age=31536000, immutable` for `/public/maps/**`.
- [ ] Loading state shows before map renders.
- [ ] Error boundary catches and displays friendly error if map fails to load.
- [ ] Bundle size increase ≤ 70KB (gzipped) after adding all map features.
- [ ] Page load time on 3G connection ≤ 5 seconds (test with Chrome DevTools throttling).

## Testing

- [ ] Run `npm run analyze` and verify map components in separate chunk.
- [ ] Manual: Test on throttled 3G connection, verify loading states.
- [ ] Manual: Simulate network error, verify error boundary shows.
- [ ] Manual: Check browser DevTools Network tab for cache headers.
- [ ] Lighthouse audit: Performance score ≥ 90 on mobile.
- [ ] Compare bundle sizes before/after implementation.
