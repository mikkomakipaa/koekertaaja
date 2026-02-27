import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeSubtopicLabel,
  normalizeTopicLabel,
} from '@/lib/topics/normalization';

describe('topic label normalization', () => {
  it('maps known canonical topic aliases to Finnish canonical labels', () => {
    assert.equal(normalizeTopicLabel('Nouns and Articles'), 'Substantiivit ja artikkelit');
    assert.equal(normalizeTopicLabel('Vocabulary and Thematic Content'), 'Sanasto ja temaattinen sisältö');
    assert.equal(normalizeTopicLabel('Communicative Functions and Texts'), 'Viestinnälliset funktiot ja tekstit');
    assert.equal(normalizeTopicLabel('Present Simple Grammar'), 'Preesensin kielioppi');
    assert.equal(normalizeTopicLabel('Essential Verbs: Be and Have'), 'Keskeiset verbit: olla ja omistaa');
  });

  it('normalizes case, whitespace, and separator variants during alias matching', () => {
    assert.equal(normalizeTopicLabel('  nouns  &   articles '), 'Substantiivit ja artikkelit');
    assert.equal(normalizeTopicLabel('Vocabulary / Thematic Content'), 'Sanasto ja temaattinen sisältö');
    assert.equal(normalizeTopicLabel('communicative functions - texts'), 'Viestinnälliset funktiot ja tekstit');
  });

  it('keeps canonical topic label output capitalization', () => {
    assert.equal(normalizeTopicLabel('substantiivit ja artikkelit'), 'Substantiivit ja artikkelit');
    assert.equal(normalizeTopicLabel('preesensin kielioppi'), 'Preesensin kielioppi');
  });

  it('uses normalized trimmed fallback when alias is unknown', () => {
    assert.equal(normalizeTopicLabel('  Geometria   ja   mittaaminen  '), 'Geometria ja mittaaminen');
  });

  it('is idempotent for topics', () => {
    const once = normalizeTopicLabel('Nouns / Articles');
    const twice = normalizeTopicLabel(once);
    assert.equal(twice, once);
  });

  it('emits telemetry for unexpected unmapped English topic labels', () => {
    const events: Array<{ input: string; normalized: string; context?: string }> = [];

    const normalized = normalizeTopicLabel('Grammar Drill Focus', {
      context: 'topic-test',
      onUnexpectedEnglish: (event) => {
        events.push(event);
      },
    });

    assert.equal(normalized, 'kielioppi Drill Focus');
    assert.equal(events.length, 1);
    assert.equal(events[0].input, 'Grammar Drill Focus');
    assert.equal(events[0].context, 'topic-test');
  });
});

describe('subtopic label normalization', () => {
  it('maps known subtopic aliases to Finnish canonical labels', () => {
    assert.equal(normalizeSubtopicLabel('object pronouns'), 'Objektipronominit');
    assert.equal(normalizeSubtopicLabel('clothing vocabulary'), 'Vaatesanasto');
    assert.equal(normalizeSubtopicLabel('present simple grammar'), 'Preesensin kielioppi');
  });

  it('supports case-insensitive separators in subtopic aliases', () => {
    assert.equal(normalizeSubtopicLabel('OBJECT  PRONOUNS'), 'Objektipronominit');
    assert.equal(normalizeSubtopicLabel('clothing-vocabulary'), 'Vaatesanasto');
  });

  it('is idempotent for subtopics', () => {
    const once = normalizeSubtopicLabel('Object Pronouns');
    const twice = normalizeSubtopicLabel(once);
    assert.equal(twice, once);
  });
});
