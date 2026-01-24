# Map Performance Optimization

## Overview

This document describes the performance optimizations implemented for map questions to reduce initial page load time and improve user experience on slow connections.

## Implemented Optimizations

### 1. Code Splitting with Lazy Loading

**Components lazy-loaded:**
- `MapQuestion` component (via `QuestionRenderer.tsx:8-9`)
- `InteractiveMap` component (via `LazyInteractiveMap.tsx`)

**Implementation:**
```typescript
// src/components/questions/QuestionRenderer.tsx
const MapQuestion = lazy(() =>
  import('./MapQuestion').then(mod => ({ default: mod.MapQuestion }))
);

// Wrapped with Suspense and loading skeleton
<Suspense fallback={<LoadingSkeleton />}>
  <MapQuestion {...props} />
</Suspense>
```

**Impact:**
- Map components (~65KB) are only loaded when a map question is rendered
- React splits these into separate chunks loaded on-demand
- Reduces initial bundle size for users who don't encounter map questions

### 2. Lazy Map Data Loading

**Hook: `useMapData`** (`src/hooks/useMapData.ts`)

**Features:**
- Fetches TopoJSON data only when map question appears
- In-memory caching to prevent duplicate fetches
- Validates TopoJSON structure before caching
- Provides loading, error, and data states

**Usage:**
```typescript
const { data, isLoading, error } = useMapData('/maps/finland.topojson');

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
// Render map with data
```

**Cache management:**
```typescript
// Preload map data (e.g., on hover or prediction)
await preloadMapData('/maps/finland.topojson');

// Clear cache if needed (testing, memory pressure)
clearMapDataCache();
```

### 3. CDN Caching Headers

**Configuration:** `next.config.js:54-61`

```javascript
{
  source: '/maps/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

**Impact:**
- Map files cached for 1 year (31536000 seconds)
- `immutable` directive tells browsers file will never change
- Subsequent loads instant (cached in browser)
- CDN can cache aggressively without revalidation

### 4. Error Boundaries

**Component: `MapErrorBoundary`** (`src/components/questions/map/MapErrorBoundary.tsx`)

**Features:**
- Catches JavaScript errors during map rendering
- Displays user-friendly error message
- Suggests fallback to text mode
- Logs technical details for debugging (expandable)

**Coverage:**
- Wraps entire MapQuestion component
- Prevents map errors from crashing the entire question set

### 5. Loading States

**Three levels of loading feedback:**

1. **Component loading** (QuestionRenderer.tsx:89-95)
   - Shows spinner while MapQuestion chunk downloads
   - Text: "Ladataan karttaa..."

2. **Data loading** (MapQuestion.tsx:179-185)
   - Shows spinner while TopoJSON data fetches
   - Text: "Ladataan karttadataa..."

3. **Image loading** (MapQuestion.tsx:196)
   - Browser native `loading="lazy"` for map images
   - Defers loading until image near viewport

## Performance Metrics

### Bundle Size Analysis

**Run bundle analyzer:**
```bash
npm run analyze
```

This generates:
- `.next/analyze/client.html` - Client bundle breakdown
- `.next/analyze/server.html` - Server bundle breakdown

**Expected results:**
- Map components in separate chunk(s)
- Main bundle reduced by ~65KB (gzipped)
- Map chunk only loaded when needed

### Testing Performance

**Manual testing checklist:**

1. **3G throttling test:**
   - Chrome DevTools → Network → Throttle to "Slow 3G"
   - Navigate to page with map question
   - Verify page loads in ≤ 5 seconds
   - Verify loading spinner shows while map loads

2. **Cache test:**
   - Load map question first time (observe network requests)
   - Navigate away and back
   - Verify map data not fetched again (304 or cached)

3. **Error handling test:**
   - Block network request for map file (DevTools → Network → Block request URL)
   - Verify error boundary shows friendly message
   - Verify text fallback mode still works

4. **Lighthouse audit:**
   ```bash
   # Run production build
   npm run build
   npm run start

   # Open Chrome DevTools → Lighthouse
   # Run Performance audit on mobile
   # Target: Score ≥ 90
   ```

### Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Bundle size increase | ≤ 70KB (gzipped) | `npm run analyze` |
| Page load (3G) | ≤ 5 seconds | Chrome DevTools throttling |
| Lighthouse Performance | ≥ 90 | Chrome Lighthouse mobile audit |
| Map data cache hit rate | ≥ 95% | Browser Network tab (second load) |
| Error recovery | 100% | Manual testing with blocked network |

## Best Practices

### When to Use Lazy Loading

✅ **Use for:**
- Map components (large dependencies)
- TopoJSON data files (30-100KB each)
- Heavy visualization libraries
- Components not shown on initial render

❌ **Don't use for:**
- Core UI components (buttons, inputs)
- Small utilities (<5KB)
- Components always shown on initial load
- Critical rendering path components

### Map Data Caching Strategy

**Automatic caching:**
- `useMapData` hook caches in memory automatically
- No manual cache management needed in components

**Manual preloading:**
```typescript
// Preload on user intent (hover, focus)
onMouseEnter={() => {
  preloadMapData('/maps/sweden.topojson');
}}

// Preload likely next questions
useEffect(() => {
  if (currentQuestionIndex < questions.length - 1) {
    const nextQuestion = questions[currentQuestionIndex + 1];
    if (nextQuestion.type === 'map' && nextQuestion.options.mapAsset) {
      preloadMapData(nextQuestion.options.mapAsset);
    }
  }
}, [currentQuestionIndex]);
```

### Cache Headers Best Practices

**For immutable assets** (versioned/hashed filenames):
```
Cache-Control: public, max-age=31536000, immutable
```

**For mutable assets** (can change):
```
Cache-Control: public, max-age=3600, must-revalidate
```

**For private/user-specific data:**
```
Cache-Control: private, max-age=300
```

## Monitoring & Debugging

### Bundle Size Monitoring

**Setup Continuous Monitoring:**
1. Run `npm run analyze` before and after changes
2. Compare `.next/analyze/` outputs
3. Check for unexpected bundle size increases
4. Verify map chunks properly separated

**GitHub Actions Integration (optional):**
```yaml
- name: Analyze bundle size
  run: |
    npm run analyze
    # Upload artifacts or compare with baseline
```

### Performance Monitoring in Production

**Recommended tools:**
- **Vercel Analytics** (already integrated via `@vercel/analytics`)
- **Web Vitals** monitoring:
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)

**Add custom performance marks:**
```typescript
// Mark when map starts loading
performance.mark('map-load-start');

// Mark when map finishes loading
performance.mark('map-load-end');

// Measure duration
performance.measure('map-load-duration', 'map-load-start', 'map-load-end');
```

## Troubleshooting

### Issue: Map not loading

**Symptoms:**
- Infinite loading spinner
- Error message shown
- Console errors

**Debugging steps:**
1. Check Network tab for failed requests
2. Verify map file exists at URL
3. Check CORS headers if loading from external source
4. Verify TopoJSON structure is valid
5. Check error boundary console logs

### Issue: Slow loading on fast connections

**Possible causes:**
- Map file too large (not optimized)
- CDN not configured
- Cache headers not working

**Solutions:**
1. Optimize map files: `npm run maps:optimize`
2. Verify cache headers in Network tab
3. Check CDN configuration (Vercel Edge Network)
4. Consider using SVG instead of TopoJSON for small maps

### Issue: Bundle still too large

**Investigation:**
1. Run `npm run analyze`
2. Check if map libraries properly code-split
3. Look for duplicate dependencies
4. Verify tree-shaking working correctly

**Solutions:**
- Move heavy dependencies to dynamic imports
- Use lighter alternatives (e.g., Leaflet instead of Mapbox)
- Split large components further

## Future Optimizations

**Potential improvements:**

1. **Service Worker caching**
   - Cache map data in Service Worker
   - Offline map support
   - Faster subsequent loads

2. **Progressive image loading**
   - Show low-res placeholder first
   - Load high-res version progressively
   - Similar to progressive JPEG

3. **Adaptive loading**
   - Detect connection speed
   - Load simplified maps on slow connections
   - Full-resolution on fast connections

4. **Preconnect/Prefetch**
   ```html
   <link rel="preconnect" href="https://cdn.example.com">
   <link rel="prefetch" href="/maps/finland.topojson">
   ```

5. **WebAssembly for map processing**
   - Faster TopoJSON parsing
   - Client-side map simplification
   - Better performance on complex maps

## References

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React.lazy() documentation](https://react.dev/reference/react/lazy)
- [HTTP Caching Best Practices](https://web.dev/http-cache/)
- [Web Performance Optimization](https://web.dev/fast/)
- [Bundle Analyzer Documentation](https://www.npmjs.com/package/@next/bundle-analyzer)
