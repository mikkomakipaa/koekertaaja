/**
 * Verification test: Ensure flashcard mode uses dedicated flashcard templates
 *
 * This test verifies that:
 * 1. Flashcard mode loads the flashcard-rules.txt module
 * 2. Prompt enforces single flashcard Q&A format
 * 3. Flashcard mode uses type "flashcard"
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
    assert(prompt.includes('Käytä VAIN tyyppiä: flashcard'));
    assert(prompt.includes('KIELIAINEIDEN FLASHCARD-LISÄSÄÄNNÖT'));
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
  });

  it('should use single flashcard guidance for flashcard mode', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'flashcard',
    });

    // Verify guidance header and single flashcard type
    assert(prompt.includes('FLASHCARD-MUOTO (PERINTEINEN KYSYMYS-VASTAUS)'), 'Missing flashcard guidance header');
    assert(prompt.includes('Käytä kaikissa korteissa samaa tyyppiä: flashcard.'));
  });

  it('should use quiz type guidance for quiz mode', async () => {
    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 10,
      grade: 5,
      mode: 'quiz',
    });

    // Verify quiz guidance header
    assert(prompt.includes('KYSYMYSTYYPPIEN VALINTAOHJE'));

    // Verify quiz guidance includes type suggestions
    assert(prompt.match(/(multiple_choice|true_false|fill_blank|sequential)/i));
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

    // Verify math flashcards use single Q&A guidance
    assert(prompt.includes('FLASHCARD-MUOTO (PERINTEINEN KYSYMYS-VASTAUS)'));
    assert(prompt.includes('Käytä kaikissa korteissa samaa tyyppiä: flashcard.'));
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
    assert(!prompt.includes('KIELIAINEIDEN FLASHCARD-LISÄSÄÄNNÖT'));

    // Verify written flashcards use single Q&A guidance
    assert(prompt.includes('FLASHCARD-MUOTO (PERINTEINEN KYSYMYS-VASTAUS)'));
    assert(prompt.includes('Käytä kaikissa korteissa samaa tyyppiä: flashcard.'));
  });
});
