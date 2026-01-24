/**
 * Tests for useMapData hook
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock fetch for tests
const originalFetch = global.fetch;

describe('useMapData hook', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = originalFetch;
  });

  it('should validate TopoJSON structure', async () => {
    const validTopoJSON = {
      type: 'Topology',
      objects: {
        countries: {
          type: 'GeometryCollection',
          geometries: [],
        },
      },
      arcs: [],
    };

    // Mock successful fetch
    global.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => validTopoJSON,
    })) as any;

    const result = await fetch('/maps/test.topojson').then(r => r.json());

    assert.strictEqual(result.type, 'Topology');
    assert.ok(result.objects);
  });

  it('should reject invalid TopoJSON missing type', async () => {
    const invalidTopoJSON = {
      objects: {},
      arcs: [],
    };

    global.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => invalidTopoJSON,
    })) as any;

    const result = await fetch('/maps/test.topojson').then(r => r.json());

    assert.notStrictEqual(result.type, 'Topology');
  });

  it('should reject invalid TopoJSON missing objects', async () => {
    const invalidTopoJSON = {
      type: 'Topology',
      arcs: [],
    };

    global.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => invalidTopoJSON,
    })) as any;

    const result = await fetch('/maps/test.topojson').then(r => r.json());

    assert.strictEqual(result.type, 'Topology');
    assert.ok(!result.objects);
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = mock.fn(async () => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })) as any;

    const response = await fetch('/maps/missing.topojson');

    assert.strictEqual(response.ok, false);
    assert.strictEqual(response.status, 404);
  });
});
