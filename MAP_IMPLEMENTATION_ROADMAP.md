# Map Question Type - Complete Implementation Roadmap

## Overview

This roadmap outlines the complete implementation plan for map-based geography questions in Koekertaaja. The implementation is divided into two phases:

- **Phase 1 (Tasks 19-23):** Foundation - Basic map question support
- **Phase 2 (Tasks 24-29):** Enhancement - Production-ready features

## Phase 1: Foundation (Tasks 19-23)

**Goal:** Enable basic map questions for geography subjects

| Task | Title | Effort | Dependencies |
|------|-------|--------|--------------|
| 19 | [Design map question schema](task-019-design-map-question-schema.md) | 0.5 days | None |
| 20 | [DB and types for map questions](task-020-db-and-types-map-question.md) | 0.5 days | Task 19 |
| 21 | [Update prompts for geography](task-021-prompts-geography-map.md) | 1 day | Task 19 |
| 22 | [UI map question component](task-022-ui-map-question-component.md) | 1.5 days | Task 20 |
| 23 | [Validation and tests](task-023-map-question-validation-and-tests.md) | 0.5 days | Task 20, 22 |

**Total Estimated Effort:** ~4 days

**Deliverables:**
- ✅ Map question type recognized throughout app
- ✅ Basic region selection UI
- ✅ Geography prompts generate map questions
- ✅ Tests cover map question schema and validation

**Limitations:**
- Image-based maps (not vector/interactive)
- Limited accessibility (no keyboard navigation)
- No performance optimization
- Manual map asset management

---

## Phase 2: Enhancement (Tasks 24-29)

**Goal:** Production-ready map questions with optimal UX

| Task | Title | Effort | Dependencies | Priority |
|------|-------|--------|--------------|----------|
| 24 | [Map asset pipeline](task-024-map-asset-pipeline.md) | 1 day | Task 22 | High |
| 25 | [Map component library](task-025-map-component-library.md) | 2 days | Task 24 | High |
| 26 | [Map accessibility](task-026-map-accessibility.md) | 1.5 days | Task 25 | High |
| 27 | [Map performance](task-027-map-performance.md) | 1 day | Task 25 | Medium |
| 28 | [Map prompt examples](task-028-map-prompt-examples.md) | 0.5 days | Task 21, 25 | Medium |
| 29 | [Map data licensing](task-029-map-data-licensing.md) | 0.5 days | Task 24 | High |

**Total Estimated Effort:** ~6.5 days

**Deliverables:**
- ✅ Vector-based SVG maps (react-simple-maps)
- ✅ Optimized TopoJSON assets (<35KB per map)
- ✅ Full keyboard navigation and screen reader support
- ✅ Lazy-loaded, code-split components
- ✅ Comprehensive AI prompt examples
- ✅ License compliance and attribution

**Enhancements:**
- 📈 60% smaller map files (TopoJSON vs GeoJSON)
- ⚡ Code-split components (~65KB added, lazy-loaded)
- ♿ WCAG 2.1 AA compliant
- 📱 Optimized for mobile (pinch-zoom, touch targets)
- 🎨 Customizable styling per question

---

## Technology Stack

### Core Dependencies (Phase 2)
```json
{
  "dependencies": {
    "react-simple-maps": "^3.0.0",
    "d3-geo": "^3.1.0",
    "topojson-client": "^3.1.0"
  }
}
```

**Bundle Impact:**
- Base library: ~65KB minified + gzipped
- Map data (TopoJSON): 30-100KB per map (lazy-loaded)
- **Total initial bundle increase:** ~0KB (code-split)

### Map Data Sources
- **Natural Earth Data** (Public Domain) - Primary source
- **TopoJSON World Atlas** (ISC License) - Pre-optimized files
- **OpenStreetMap** (ODbL) - Optional, requires attribution

---

## Implementation Sequence

### Recommended Order (Critical Path)

```
Phase 1:
Task 19 (Schema) → Task 20 (Types) → Task 21 (Prompts)
                                    → Task 22 (UI) → Task 23 (Tests)

Phase 2:
Task 24 (Assets) → Task 25 (Components) → Task 26 (Accessibility)
                                        → Task 27 (Performance)
                                        → Task 28 (Prompts)
Task 29 (Licensing) - Can run in parallel with Task 24-28
```

### Parallel Work Opportunities
- **Tasks 21 & 22** can be developed in parallel (different developers)
- **Task 29** can start immediately with Task 24
- **Tasks 27 & 28** can run concurrently after Task 25

---

## Feature Comparison

### Phase 1 (Basic) vs Phase 2 (Enhanced)

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| **Map Format** | Static images | Vector SVG (TopoJSON) |
| **File Size** | 100-500KB per map | 30-100KB per map |
| **Interactivity** | Click regions | Zoom, pan, select |
| **Accessibility** | Basic (mouse only) | Full (keyboard + SR) |
| **Mobile** | Works but suboptimal | Optimized touch/gestures |
| **Performance** | All maps loaded | Lazy-loaded per question |
| **Code Split** | No | Yes (~0KB initial impact) |
| **Data Source** | Manual uploads | Automated pipeline |
| **Licensing** | Manual tracking | Documented + automated |

---

## Success Metrics

### Phase 1 Completion Criteria
- [ ] At least 1 geography question set generates map questions
- [ ] Map questions render and accept answers
- [ ] Basic tests pass (schema, validation, UI)

### Phase 2 Completion Criteria
- [ ] Lighthouse Performance score ≥ 90 (mobile)
- [ ] Lighthouse Accessibility score = 100
- [ ] Bundle size increase ≤ 70KB (gzipped, code-split)
- [ ] Map data files ≤ 35KB for world map
- [ ] Keyboard navigation tested with VoiceOver + NVDA
- [ ] All licenses documented and compliant

---

## Risk Mitigation

| Risk | Phase | Mitigation Strategy |
|------|-------|---------------------|
| **Bundle bloat** | Both | Code-split components, lazy-load data |
| **Licensing issues** | 2 | Use Public Domain sources (Natural Earth) |
| **Mobile performance** | 2 | Optimize TopoJSON, test on low-end devices |
| **Accessibility gaps** | 1 | Provide text fallback, implement in Phase 2 |
| **Map data accuracy** | Both | Source from authoritative datasets, timestamp maps |
| **Browser compatibility** | 2 | Test SVG support, provide image fallback |

---

## Future Enhancements (Post-Phase 2)

These features are out of scope for initial implementation but may be added later:

### Phase 3: Advanced Interactions
- **Pin placement questions** - "Mark the location of Paris on the map"
- **Route drawing** - "Draw the route of the Trans-Siberian Railway"
- **Distance estimation** - "Estimate the distance from Oslo to Stockholm"
- **Historical maps** - Overlay different time periods (e.g., borders in 1939 vs 2024)

### Phase 4: Enhanced Content
- **Custom map creation tools** - Admin UI for creating new maps
- **3D globe visualization** - Orthographic projection for global questions
- **Satellite imagery layers** - Switch between political and satellite views
- **Population density heatmaps** - Visualize demographic data

**Estimated Additional Effort:** 5-10 days per phase

---

## Developer Handoff Checklist

Before starting implementation, ensure:
- [ ] Read `MAP_QUESTION_DESIGN_PROPOSAL.md` completely
- [ ] Review existing question types in `src/types/questions.ts`
- [ ] Understand current answer validation in `src/lib/questions/answer-evaluation.ts`
- [ ] Set up dev environment with node ≥18, npm ≥9
- [ ] Review WCAG 2.1 AA accessibility guidelines
- [ ] Test on physical mobile devices (not just emulators)

---

## Questions or Clarifications?

**For schema/design questions:** See `MAP_QUESTION_DESIGN_PROPOSAL.md`
**For task-specific questions:** See individual task files (task-019 through task-029)
**For implementation help:** Check existing question type implementations (`src/components/questions/`)

---

**Last Updated:** 2026-01-19
**Status:** Planning Complete, Implementation Pending
**Estimated Total Effort:** 10.5 days (Phase 1 + Phase 2)
