# Map Question Type - Improved Design & Implementation Proposal

## Executive Summary

This document proposes an enhanced design for the map question type, recommends open-source map solutions, and outlines additional implementation tasks beyond the current tasks 19-23.

## Current Design Analysis (Tasks 19-23)

### ✅ Strengths
- Simple schema using existing JSONB columns
- Geography-only constraint
- Support for multiple input modes (single_region, multi_region, text)
- Region aliases for answer flexibility

### ⚠️ Areas for Improvement
1. **No coordinate/boundary definitions** - Regions lack spatial coordinates for hit detection
2. **Limited interaction modes** - Missing pin-placement, path-drawing, distance estimation
3. **No zoom/pan support** - Critical for mobile usability and detailed maps
4. **Static map assets only** - No vector maps or dynamic rendering
5. **No accessibility strategy** - Keyboard navigation and screen reader support unclear
6. **Missing internationalization** - No multi-language label support
7. **No performance optimization** - Large map images may impact mobile users

---

## Recommended Open-Source Map Solutions

### 🏆 **Primary Recommendation: React-Simple-Maps + D3-Geo**

**Why:**
- ✅ **Lightweight** - SVG-based, ~50KB minified
- ✅ **Mobile-first** - Scales perfectly on all devices
- ✅ **Touch-friendly** - Built-in gesture support
- ✅ **Accessible** - SVG elements can be keyboard-navigated
- ✅ **Customizable** - Easy to style and annotate
- ✅ **MIT Licensed** - No attribution required
- ✅ **TopoJSON support** - Efficient map data format
- ✅ **No external dependencies** - Works offline after load

**Ideal for:**
- Country/region selection (political maps)
- Simple click-to-select interactions
- Custom styling per question
- Educational contexts

**Example Use Cases:**
```typescript
// Select countries in Nordic region
// Select US states that border Mexico
// Identify capital cities on world map
```

**Package:** `react-simple-maps` + `d3-geo` + `topojson-client`

---

### 🥈 **Secondary Option: Leaflet + React-Leaflet**

**Why:**
- ✅ **Feature-rich** - Zoom, pan, layers, markers, drawing tools
- ✅ **Mature** - 12+ years of development
- ✅ **Plugin ecosystem** - 100+ plugins available
- ✅ **Mobile-optimized** - Excellent touch support
- ✅ **BSD Licensed** - Permissive

**Ideal for:**
- Advanced interactions (pin placement, route drawing)
- Multiple map layers (political, topographical, satellite)
- Future feature expansion

**Trade-offs:**
- Heavier bundle size (~140KB minified)
- Requires tile server or static tiles
- More complex setup

**Package:** `react-leaflet` + `leaflet`

---

### ❌ **Not Recommended**

| Solution | Why Not |
|----------|---------|
| **Mapbox GL JS** | Proprietary license, requires API key/billing |
| **Google Maps** | Requires billing account, restrictive ToS |
| **OpenLayers** | Overkill for simple educational maps, complex API |
| **Maplibre GL JS** | GPU-dependent, accessibility concerns, larger bundle |

---

## Enhanced Map Question Schema

### Improved Data Model

```typescript
// Extend existing schema from docs/API_SCHEMAS.md
interface MapQuestionOptions {
  // ENHANCED: Map source configuration
  mapSource: {
    type: 'topojson' | 'geojson' | 'svg' | 'image';
    url: string; // Public URL or path
    projection?: 'mercator' | 'naturalEarth' | 'orthographic';
    center?: [number, number]; // [longitude, latitude]
    zoom?: number; // Initial zoom level (1-10)
  };

  // ENHANCED: Region definitions with spatial data
  regions: Array<{
    id: string;
    label: string;
    aliases?: string[]; // Alternative spellings
    coordinates?: {
      type: 'polygon' | 'point';
      data: number[][] | [number, number]; // GeoJSON coordinates
    };
    boundingBox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
    properties?: Record<string, any>; // Additional metadata
  }>;

  // ENHANCED: Interaction modes
  inputMode:
    | 'select_region'       // Click to select one region
    | 'select_multi_region' // Click to select multiple regions
    | 'place_pin'           // Drop pin on location
    | 'draw_path'           // Draw route between points
    | 'text_answer'         // Type region name
    | 'distance_estimate';  // Estimate distance between points

  // NEW: Accessibility features
  accessibility: {
    keyboardNavigable: boolean; // Enable arrow key region navigation
    screenReaderLabels: Record<string, string>; // id -> ARIA label
    fallbackToText: boolean; // Allow text input as alternative
  };

  // NEW: Visual hints
  hints?: {
    highlightRegions?: string[]; // Region IDs to highlight
    showLabels?: boolean; // Show region labels on map
    showCapitals?: boolean; // Show capital markers
    colorScheme?: 'political' | 'topographical' | 'custom';
  };

  // NEW: Validation rules
  validation?: {
    maxSelections?: number; // For multi-region
    minSelections?: number;
    tolerance?: number; // Pixels for pin/point questions (default: 50)
  };
}

// Example correct_answer formats
type MapCorrectAnswer =
  | string                    // single_region: "finland"
  | string[]                  // multi_region: ["norway", "sweden", "finland"]
  | [number, number]          // place_pin: [24.9384, 60.1699] (Helsinki)
  | Array<[number, number]>   // draw_path: [[lon1, lat1], [lon2, lat2]]
  | { value: number; unit: 'km' | 'miles' }; // distance_estimate
```

### Example Question Payloads

**Example 1: Simple Region Selection (Nordic Countries)**
```json
{
  "question": "Valitse kaikki Pohjoismaat kartalta",
  "type": "map",
  "options": {
    "mapSource": {
      "type": "topojson",
      "url": "/maps/europe-110m.json",
      "projection": "mercator",
      "center": [10, 60],
      "zoom": 3
    },
    "regions": [
      { "id": "finland", "label": "Suomi", "aliases": ["Finland"] },
      { "id": "sweden", "label": "Ruotsi", "aliases": ["Sweden"] },
      { "id": "norway", "label": "Norja", "aliases": ["Norway"] },
      { "id": "denmark", "label": "Tanska", "aliases": ["Denmark"] },
      { "id": "iceland", "label": "Islanti", "aliases": ["Iceland"] }
    ],
    "inputMode": "select_multi_region",
    "accessibility": {
      "keyboardNavigable": true,
      "screenReaderLabels": {
        "finland": "Finland, Northern Europe",
        "sweden": "Sweden, Northern Europe"
      },
      "fallbackToText": true
    },
    "hints": {
      "showLabels": false,
      "colorScheme": "political"
    },
    "validation": {
      "minSelections": 5,
      "maxSelections": 5
    }
  },
  "correct_answer": ["finland", "sweden", "norway", "denmark", "iceland"],
  "explanation": "Pohjoismaat (Nordic countries) ovat Suomi, Ruotsi, Norja, Tanska ja Islanti.",
  "topic": "Maantieto",
  "subtopic": "Eurooppa",
  "skill": "nordic_countries"
}
```

**Example 2: Capital City Pin Placement**
```json
{
  "question": "Merkitse Pariisin sijainti kartalle",
  "type": "map",
  "options": {
    "mapSource": {
      "type": "topojson",
      "url": "/maps/france-departments.json",
      "projection": "mercator",
      "center": [2.3522, 48.8566],
      "zoom": 6
    },
    "regions": [],
    "inputMode": "place_pin",
    "accessibility": {
      "keyboardNavigable": false,
      "fallbackToText": true
    },
    "hints": {
      "showLabels": false,
      "showCapitals": false
    },
    "validation": {
      "tolerance": 30
    }
  },
  "correct_answer": [2.3522, 48.8566],
  "explanation": "Pariisi sijaitsee Ranskan pohjoisosassa Seine-joen varrella.",
  "topic": "Maantieto",
  "subtopic": "Euroopan pääkaupungit",
  "skill": "european_capitals"
}
```

---

## Performance & Asset Strategy

### Map Data Sources (Free & Open)

1. **Natural Earth Data** (Public Domain)
   - URL: https://www.naturalearthdata.com/
   - Formats: Shapefile, GeoJSON
   - Scales: 1:10m, 1:50m, 1:110m (high/med/low detail)
   - Best for: World, continents, countries

2. **TopoJSON World Atlas** (Open)
   - URL: https://github.com/topojson/world-atlas
   - Optimized for web (smaller files than GeoJSON)
   - Pre-built: countries-110m.json (~30KB), countries-50m.json (~90KB)

3. **OpenStreetMap** (ODbL License)
   - URL: https://www.openstreetmap.org/
   - Highly detailed, community-maintained
   - Requires attribution

### Asset Optimization Strategy

```
/public/maps/
├── topojson/
│   ├── world-110m.json           # ~30KB  - Low detail, global
│   ├── europe-50m.json           # ~50KB  - Med detail, Europe
│   ├── finland-regions-10m.json  # ~80KB  - High detail, Finland
│   └── ...
├── geojson/                      # Fallback for older browsers
└── metadata/
    └── map-registry.json         # Index of available maps
```

**Optimization Techniques:**
- ✅ Use TopoJSON (30-50% smaller than GeoJSON)
- ✅ Serve via CDN with aggressive caching
- ✅ Lazy-load map data only when needed
- ✅ Simplify geometries for mobile (reduce vertices)
- ✅ Compress with Brotli/Gzip

---

## Accessibility Requirements

### Keyboard Navigation
```typescript
// Arrow keys to navigate regions
// Enter/Space to select
// Tab to cycle through interactive elements
// Escape to deselect/reset
```

### Screen Reader Support
```html
<svg role="img" aria-label="Map of Europe">
  <g role="button"
     aria-label="Finland, Northern Europe"
     tabIndex="0"
     onClick={selectRegion}
     onKeyPress={selectRegion}>
    <path d="..." />
  </g>
</svg>
```

### Fallback Modes
- Text input alternative for all map questions
- High-contrast mode support
- Zoom controls for low-vision users

---

## Implementation Architecture

### Component Structure
```
src/components/questions/map/
├── MapQuestion.tsx              # Main wrapper component
├── InteractiveMap.tsx           # SVG map renderer (react-simple-maps)
├── RegionSelector.tsx           # Handles region selection logic
├── PinPlacer.tsx                # Pin placement interactions
├── PathDrawer.tsx               # Route drawing (future)
├── MapControls.tsx              # Zoom, pan, reset controls
├── MapAccessibility.tsx         # Keyboard nav, ARIA support
└── __tests__/
    ├── MapQuestion.test.tsx
    └── answer-validation.test.tsx
```

### Key Dependencies
```json
{
  "dependencies": {
    "react-simple-maps": "^3.0.0",
    "d3-geo": "^3.1.0",
    "topojson-client": "^3.1.0"
  }
}
```

**Bundle Impact:** ~65KB minified + gzipped (~200KB uncompressed)

---

## Mobile-First Design Considerations

### Touch Targets
- Minimum 44x44px touch targets (WCAG AAA)
- Adequate spacing between selectable regions
- Pinch-to-zoom support

### Responsive Breakpoints
```css
/* Mobile: Stack map vertically */
@media (max-width: 640px) {
  .map-container { height: 60vh; }
  .region-labels { font-size: 14px; }
}

/* Tablet: Side-by-side layout */
@media (min-width: 641px) and (max-width: 1024px) {
  .map-container { height: 70vh; }
}

/* Desktop: Full detail */
@media (min-width: 1025px) {
  .map-container { height: 80vh; }
  .show-tooltips { display: block; }
}
```

---

## Additional Tasks Required

See individual task files:
- `task-024-map-asset-pipeline.md` - Map data sourcing, conversion, optimization
- `task-025-map-component-library.md` - Reusable map component architecture
- `task-026-map-accessibility.md` - Keyboard nav, screen readers, fallbacks
- `task-027-map-performance.md` - Lazy loading, caching, bundle optimization
- `task-028-map-prompt-examples.md` - AI prompt templates with map examples
- `task-029-map-data-licensing.md` - License compliance, attribution, data sources

---

## Migration Path from Current Design

### Phase 1: Foundation (Tasks 19-23)
✅ Use current simple schema
✅ Image-based maps with click regions
✅ Basic accessibility

### Phase 2: Enhancement (New Tasks 24-29)
🔄 Migrate to SVG/TopoJSON maps
🔄 Add react-simple-maps integration
🔄 Implement keyboard navigation
🔄 Optimize bundle size

### Phase 3: Advanced Features (Future)
🔮 Pin placement questions
🔮 Route drawing
🔮 Distance estimation
🔮 Historical map overlays

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| **Large bundle size** | Use code-splitting, lazy-load maps, optimize TopoJSON |
| **Map data licensing** | Use Public Domain (Natural Earth) or properly attribute ODbL |
| **Mobile performance** | Test on low-end devices, simplify geometries, use SVG optimization |
| **Accessibility compliance** | Follow WCAG 2.1 AA, provide text alternatives, keyboard support |
| **Map data accuracy** | Source from authoritative datasets, version/timestamp maps |

---

## Recommendation Summary

1. ✅ **Use React-Simple-Maps** for initial implementation
2. ✅ **Source maps from Natural Earth Data** (public domain)
3. ✅ **Store as TopoJSON** for optimal size
4. ✅ **Implement keyboard navigation** from day one
5. ✅ **Provide text fallback** for all questions
6. ✅ **Start with region selection**, expand to pins/paths later

**Estimated Development Effort:**
- Tasks 19-23 (Current): ~2-3 days
- Tasks 24-29 (Enhanced): ~3-4 days
- **Total: 5-7 days for production-ready map questions**
