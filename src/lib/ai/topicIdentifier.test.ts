import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFallbackTopicAnalysis } from './topicIdentifier';

test('buildFallbackTopicAnalysis derives Ympäristöoppi topics from curriculum', async () => {
  const result = await buildFallbackTopicAnalysis({
    subject: 'environmental-studies',
    grade: 5,
    materialText: 'Ekosysteemit, energia ja kestävä kulutus ovat tämän kappaleen teemoja.',
  });

  assert.equal(result.topics.length, 5);
  assert.equal(result.metadata.promptVersion, 'fallback-curriculum-v1');
  assert.equal(result.primarySubject, 'environmental-studies');
  assert.ok(result.topics.some((topic) => topic.name.includes('Ekosysteemit')));
  assert.ok(result.topics.every((topic) => topic.keywords.length >= 3));
  assert.ok(result.topics.every((topic) => topic.subtopics.length >= 2));
});
