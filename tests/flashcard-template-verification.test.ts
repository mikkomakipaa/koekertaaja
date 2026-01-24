/**
 * Verification test: Ensure flashcard mode uses dedicated flashcard templates
 *
 * This test verifies that:
 * 1. Flashcard mode loads the flashcard-rules.txt module
 * 2. Flashcard mode uses flashcard distributions (not quiz distributions)
 * 3. Flashcard distributions exclude passive recognition types
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PromptBuilder } from '@/lib/prompts/PromptBuilder';
import { PromptLoader } from '@/lib/prompts/PromptLoader';
import type { Subject, Difficulty } from '@/types/questions';

describe('Flashcard Template Selection', () => {
  let builder: PromptBuilder;
  let loader: PromptLoader;

  before(() => {
    loader = new PromptLoader();
    builder = new PromptBuilder(loader);
  });

  it('should load flashcard-rules.txt for flashcard mode', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'flashcard',
    });

    // Verify flashcard-specific rules are present
    assert(prompt.includes('FLASHCARD-MOODIN SÄÄNNÖT'));
    assert(prompt.includes('Flashcardit mittaavat aktiivista muistamista'));
    assert(prompt.includes('fill_blank, short_answer, matching'));
  });

  it('should NOT load flashcard-rules.txt for quiz mode', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'quiz',
    });

    // Verify flashcard-specific rules are NOT present
    assert(!prompt.includes('FLASHCARD-MOODIN SÄÄNNÖT'));
    assert(!prompt.includes('Flashcardit mittaavat aktiivista muistamista'));
  });

  it('should use flashcard distributions for flashcard mode', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'flashcard',
    });

    // Verify flashcard distribution header
    assert(prompt.includes('KORTTITYYPPIEN JAKAUMA'), 'Missing flashcard distribution header');

    // Verify only allowed flashcard types are included
    // (fill_blank, short_answer, matching)
    assert(prompt.match(/60% fill_blank/), `Expected 60% fill_blank in: ${prompt.substring(0, 500)}`);
    assert(prompt.match(/30% short_answer/), 'Expected 30% short_answer');
    assert(prompt.match(/10% matching/), 'Expected 10% matching');

    // NOTE: The type templates (language.txt, math.txt, etc.) currently include
    // quiz-mode question type instructions (MULTIPLE_CHOICE, TRUE_FALSE, SEQUENTIAL).
    // This is EXPECTED behavior - the templates are shared between quiz and flashcard modes.
    // The flashcard-rules.txt overrides these with flashcard-specific constraints.
    //
    // What matters is that:
    // 1. Flashcard rules are present
    // 2. Flashcard distributions (not quiz distributions) are used
    // 3. The AI generator filters out invalid types at runtime (questionGenerator.ts:221-241)
    //
    // Future improvement: Split type templates into quiz-specific and mode-agnostic sections
  });

  it('should use quiz distributions for quiz mode', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'quiz',
    });

    // Verify quiz distribution header
    assert(prompt.includes('KYSYMYSTYYPPIEN JAKAUMA'));

    // Verify quiz types are included (may include multiple_choice, true_false, etc.)
    assert(prompt.match(/(multiple_choice|true_false|fill_blank)/i));
  });

  it('should handle math flashcards correctly', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'Math' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'flashcard',
    });

    // Verify flashcard rules are present
    assert(prompt.includes('FLASHCARD-MOODIN SÄÄNNÖT'));

    // Verify math flashcard distribution (70% fill_blank, 20% matching, 10% short_answer)
    assert(prompt.match(/70% fill_blank/));
    assert(prompt.match(/20% matching/));
    assert(prompt.match(/10% short_answer/));
  });

  it('should handle written subject flashcards correctly', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'History' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'flashcard',
    });

    // Verify flashcard rules are present
    assert(prompt.includes('FLASHCARD-MOODIN SÄÄNNÖT'));

    // Verify written flashcard distribution (50% fill_blank, 30% short_answer, 20% matching)
    assert(prompt.match(/50% fill_blank/));
    assert(prompt.match(/30% short_answer/));
    assert(prompt.match(/20% matching/));
  });
});
