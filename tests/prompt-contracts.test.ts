import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PromptBuilder } from '@/lib/prompts/PromptBuilder';
import { PromptLoader } from '@/lib/prompts/PromptLoader';
import type { Difficulty, Subject } from '@/types/questions';

describe('Prompt Contracts', () => {
  it('quiz prompt keeps strict JSON and core contract scaffolds', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'Math' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 12,
      grade: 5,
      mode: 'quiz',
      identifiedTopics: ['Geometria', 'Murtoluvut', 'Yhtalot'],
      materialText: 'Geometria: pinta-ala ja piiri. Murtoluvut: lavennus ja supistus.',
    });

    assert.match(prompt, /JSON-VASTAUSMUOTO/i);
    assert.match(prompt, /Palauta vain JSON-taulukko/i);
    assert.match(prompt, /TOPIC-TAGGING/i);
    assert.match(prompt, /SKILL-TAGGING/i);
    assert.match(prompt, /DIFFICULTY-RUBRIC/i);
    assert.match(prompt, /multiple_choice: options on pakollinen ja sisältää tasan 4 vaihtoehtoa/i);
    assert.doesNotMatch(prompt, /(anthropic|claude|openai|gpt)/i);
  });

  it('flashcard prompt keeps flashcard-only schema contract', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'helppo' as Difficulty,
      questionCount: 8,
      grade: 4,
      mode: 'flashcard',
      identifiedTopics: ['Sanasto', 'Kielioppi', 'Arkilauseet'],
      materialText: 'Present simple ja koulusanasto.',
    });

    assert.match(prompt, /FLASHCARD-MOODIN SÄÄNNÖT/i);
    assert.match(prompt, /Käytä VAIN tyyppiä: flashcard/i);
    assert.match(prompt, /KIELIAINEIDEN FLASHCARD-LISÄSÄÄNNÖT/i);
    assert.match(prompt, /Palauta vain JSON-taulukko/i);
    assert.doesNotMatch(prompt, /(anthropic|claude|openai|gpt)/i);
  });
});
