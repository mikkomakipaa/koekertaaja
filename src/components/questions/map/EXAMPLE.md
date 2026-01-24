# Map Component Usage Examples

## Basic InteractiveMap Example

```tsx
'use client';

import { InteractiveMap } from '@/components/questions/map';
import type { Topology } from 'topojson-specification';

// Import your TopoJSON data
import worldData from './world-110m.json'; // Example data source

export function BasicMapExample() {
  return (
    <InteractiveMap
      topojsonData={worldData as Topology}
      topojsonObjectKey="countries"
      projection="mercator"
      width={800}
      height={600}
      onGeographyClick={(geo) => {
        console.log('Clicked:', geo.properties.name);
      }}
    />
  );
}
```

## RegionSelector Example (Single Selection)

```tsx
'use client';

import { useState } from 'react';
import { RegionSelector } from '@/components/questions/map';
import type { Topology } from 'topojson-specification';

import usStatesData from './us-states.json';

export function USStateQuiz() {
  const [selectedState, setSelectedState] = useState<string[]>([]);

  return (
    <div>
      <h2>Select California on the map</h2>
      <RegionSelector
        topojsonData={usStatesData as Topology}
        topojsonObjectKey="states"
        mode={{ type: 'select-region', multiSelect: false }}
        onSelectionChange={(selectedIds) => {
          setSelectedState(selectedIds);
          if (selectedIds[0] === 'CA') {
            alert('Correct! ✓');
          }
        }}
        selectedColor="#10B981"
        unselectedColor="#E5E7EB"
        width={800}
        height={600}
      />
    </div>
  );
}
```

## RegionSelector Example (Multi-Selection)

```tsx
'use client';

import { useState } from 'react';
import { RegionSelector } from '@/components/questions/map';
import type { Topology } from 'topojson-specification';

import europeData from './europe.json';

export function EuropeGeographyQuiz() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const correctAnswers = ['DE', 'FR', 'IT', 'ES'];

  const checkAnswer = () => {
    const isCorrect =
      selectedCountries.length === correctAnswers.length &&
      selectedCountries.every((c) => correctAnswers.includes(c));

    alert(isCorrect ? 'Correct! ✓' : 'Try again');
  };

  return (
    <div>
      <h2>Select all countries in the EU Big 4</h2>
      <RegionSelector
        topojsonData={europeData as Topology}
        topojsonObjectKey="countries"
        mode={{ type: 'select-region', multiSelect: true }}
        onSelectionChange={setSelectedCountries}
        selectedColor="#3B82F6"
        unselectedColor="#F3F4F6"
        width={800}
        height={600}
      />
      <button onClick={checkAnswer}>Check Answer</button>
    </div>
  );
}
```

## Map with Controls Example

```tsx
'use client';

import { InteractiveMap, MapControls, useMapInteraction } from '@/components/questions/map';
import type { Topology } from 'topojson-specification';

import worldData from './world-110m.json';

export function MapWithControls() {
  const { viewport, zoomIn, zoomOut, resetViewport } = useMapInteraction({
    initialZoom: 1,
    minZoom: 1,
    maxZoom: 8,
  });

  return (
    <div style={{ position: 'relative' }}>
      <InteractiveMap
        topojsonData={worldData as Topology}
        topojsonObjectKey="countries"
        viewport={viewport}
        width={800}
        height={600}
      />
      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetViewport}
        config={{
          showZoom: true,
          showReset: true,
          position: 'top-right',
        }}
      />
    </div>
  );
}
```

## Custom Styling Example

```tsx
'use client';

import { RegionSelector } from '@/components/questions/map';
import type { Topology } from 'topojson-specification';

import worldData from './world-110m.json';

export function CustomStyledMap() {
  return (
    <RegionSelector
      topojsonData={worldData as Topology}
      topojsonObjectKey="countries"
      mode={{ type: 'select-region', multiSelect: true }}
      selectedColor="#8B5CF6"    // Purple
      unselectedColor="#1F2937"  // Dark gray
      hoverColor="#A78BFA"       // Light purple
      className="rounded-lg shadow-2xl"
      width={800}
      height={600}
      mapProps={{
        projection: 'orthographic', // Globe view
      }}
    />
  );
}
```

## Getting TopoJSON Data

### Option 1: World Atlas (Recommended)

```bash
# Install world-atlas package
npm install world-atlas

# Or download directly from GitHub
# https://github.com/topojson/world-atlas
```

```tsx
import { topology } from 'topojson-client';
import * as worldAtlas from 'world-atlas/countries-110m.json';

const worldData = worldAtlas as unknown as Topology;
```

### Option 2: US Atlas

```bash
npm install us-atlas
```

```tsx
import * as usAtlas from 'us-atlas/states-10m.json';
const usData = usAtlas as unknown as Topology;
```

### Option 3: Custom TopoJSON

Download from Natural Earth Data and convert to TopoJSON:

```bash
# Install topojson CLI tools
npm install -g topojson

# Convert GeoJSON to TopoJSON
geo2topo countries=countries.json > world.topojson.json

# Simplify for smaller file size
toposimplify -s 1e-5 < world.topojson.json > world-simplified.topojson.json
```

## TopoJSON Data Structure

```json
{
  "type": "Topology",
  "objects": {
    "countries": {
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Polygon",
          "id": "FI",
          "properties": { "name": "Finland" },
          "arcs": [[0, 1, 2]]
        }
      ]
    }
  },
  "arcs": [
    [[100, 200], [150, 250]],
    [[150, 250], [200, 300]]
  ]
}
```

## Integration with Question System

```tsx
'use client';

import { useState } from 'react';
import { RegionSelector } from '@/components/questions/map';
import type { Topology } from 'topojson-specification';
import type { MapQuestion } from '@/types/questions';

interface MapQuestionProps {
  question: MapQuestion;
  onAnswer: (answer: string[]) => void;
}

export function MapQuestionRenderer({ question, onAnswer }: MapQuestionProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const handleSubmit = () => {
    onAnswer(selectedRegions);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{question.prompt}</h3>

      <RegionSelector
        topojsonData={question.mapData as Topology}
        topojsonObjectKey={question.objectKey}
        mode={{
          type: 'select-region',
          multiSelect: question.multiSelect ?? false,
        }}
        onSelectionChange={setSelectedRegions}
        selectedColor="#3B82F6"
        unselectedColor="#E5E7EB"
        width={800}
        height={600}
      />

      <button
        onClick={handleSubmit}
        disabled={selectedRegions.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  );
}
```

## Best Practices

1. **TopoJSON Data Size**: Keep TopoJSON files small
   - Use simplified geometries (< 1MB recommended)
   - Load data lazily or use dynamic imports
   - Consider using different detail levels for different zoom levels

2. **Performance**:
   - Memoize map data to avoid re-parsing
   - Use React.memo() for map components
   - Lazy load map data with Suspense

3. **Accessibility**:
   - Provide keyboard navigation for region selection
   - Add ARIA labels to map elements
   - Include text alternatives for map-based questions

4. **Mobile Support**:
   - Test touch interactions on real devices
   - Use appropriate map sizes for mobile screens
   - Consider portrait vs landscape orientations

5. **Browser Compatibility**:
   - Test SVG rendering across browsers
   - Provide fallback for older browsers if needed
   - Monitor bundle size impact
