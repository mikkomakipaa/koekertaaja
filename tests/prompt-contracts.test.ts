import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PromptBuilder } from '@/lib/prompts/PromptBuilder';
import { PromptLoader } from '@/lib/prompts/PromptLoader';
import type { Difficulty, Subject } from '@/types/questions';

// Golden string captured from a real whole-set assemblePrompt() call on 2026-04-12
// before removing the embedded KÄYTÄ/SÄÄNNÖT/JAKAUTUMINEN block from topic-tagging.txt.
const WHOLE_SET_TAGGING_GOLDEN = `KÄYTÄ NÄITÄ TUNNISTETTUJA AIHEITA (3 kpl):
1. Geometria
2. Murtoluvut
3. Yhtalot

SÄÄNNÖT:
- Jokaisessa kysymyksessä/kortissa on topic.
- Topic-arvo on yksi yllä olevista nimistä täsmälleen samalla kirjoitusasulla.
- Älä keksi uusia topic-arvoja.
- subtopic on vapaaehtoinen tarkenne.

JAKAUTUMINEN:
- Tavoite: noin 4 kysymystä per topic.
- Jaa 12 kysymystä mahdollisimman tasaisesti.
- Sallittu vaihtelu: enintään noin 2-3 kysymystä per topic laatu edellä.`;

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

  it('whole-set prompt preserves the captured tagging contract exactly once', async () => {
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

    assert.equal(prompt.includes(WHOLE_SET_TAGGING_GOLDEN), true);
    assert.equal(prompt.split('KÄYTÄ NÄITÄ TUNNISTETTUJA AIHEITA').length - 1, 1);
  });

  it('whole-set prompt includes whole-set tagging and rendered distribution section without focused-only rules', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'Math' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 12,
      grade: 5,
      mode: 'quiz',
      identifiedTopics: ['Geometria', 'Murtoluvut', 'Yhtalot'],
      materialText: 'Geometria: pinta-ala ja piiri. Murtoluvut: lavennus ja supistus.',
      distribution: [
        {
          topic: 'Geometria',
          targetCount: 4,
          coverage: 4 / 12,
          keywords: ['pinta-ala', 'piiri'],
          subtopics: ['suorakulmio', 'kolmio'],
          difficulty: 'normaali',
          importance: 'high',
        },
        {
          topic: 'Murtoluvut',
          targetCount: 4,
          coverage: 4 / 12,
          keywords: ['lavennus', 'supistus'],
          subtopics: ['samannimiset', 'vertailu'],
          difficulty: 'normaali',
          importance: 'high',
        },
        {
          topic: 'Yhtalot',
          targetCount: 4,
          coverage: 4 / 12,
          keywords: ['ratkaiseminen', 'tasapaino'],
          subtopics: ['yhteenlasku', 'vähennyslasku'],
          difficulty: 'normaali',
          importance: 'high',
        },
      ],
    });

    assert.match(prompt, /KÄYTÄ NÄITÄ TUNNISTETTUJA AIHEITA/i);
    assert.match(prompt, /JAKAUTUMINEN/i);
    assert.match(prompt, /AIHEALUEIDEN JAKAUMA \(NOUDATA TARKASTI\):/i);
    assert.match(prompt, /Geometria/i);
    assert.match(prompt, /Murtoluvut/i);
    assert.match(prompt, /Yhtalot/i);
    assert.doesNotMatch(prompt, /TÄMÄ ERÄ KOSKEE VAIN AIHETTA/i);
    assert.doesNotMatch(prompt, /FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT/i);
  });

  it('focused quiz prompt uses focused-batch contract and omits whole-set distribution guidance', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'Biology' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 8,
      grade: 6,
      mode: 'quiz',
      focusTopic: 'Fotosynteesi',
      identifiedTopics: ['Fotosynteesi', 'Soluhengitys', 'Kasvin rakenne'],
      materialText: 'Fotosynteesi tapahtuu viherhiukkasissa ja tarvitsee valoa, vettä ja hiilidioksidia.',
      distribution: [
        {
          topic: 'Fotosynteesi',
          targetCount: 8,
          coverage: 1,
          keywords: ['viherhiukkanen', 'klorofylli'],
          subtopics: ['reaktioyhtälö', 'merkitys'],
          difficulty: 'normaali',
          importance: 'high',
        },
      ],
    });

    assert.match(prompt, /topic-kenttä on täsmälleen "Fotosynteesi"/i);
    assert.match(prompt, /TOISTON VÄLTTÄMINEN/i);
    assert.doesNotMatch(prompt, /JAKAUTUMINEN/i);
    assert.doesNotMatch(prompt, /AIHEALUEIDEN JAKAUMA \(NOUDATA TARKASTI\):/i);
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
    assert.match(prompt, /hieman aiempaa informatiivisempaa/i);
    assert.match(prompt, /auttavat muistamaan oikean vastauksen/i);
    assert.match(prompt, /tarpeeksi pitkä vahvistamaan muistamista, mutta tarpeeksi lyhyt nopeaan kertaukseen/i);
    assert.match(prompt, /ÄLÄ kirjoita quiz-tyylistä palautetta/i);
    assert.match(prompt, /ÄLÄ painota yleisiä virheitä tai väärää vastausta/i);
    assert.match(prompt, /Palauta vain JSON-taulukko/i);
    assert.doesNotMatch(prompt, /(anthropic|claude|openai|gpt)/i);
  });

  it('focused flashcard prompt includes focused flashcard rules', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'helppo' as Difficulty,
      questionCount: 6,
      grade: 5,
      mode: 'flashcard',
      focusTopic: 'Fotosynteesi',
      identifiedTopics: ['Fotosynteesi'],
      materialText: 'Photosynthesis means how plants make food using sunlight.',
    });

    assert.match(prompt, /FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT/i);
  });

  it('whole-set flashcard prompt excludes focused flashcard rules', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'English' as Subject,
      difficulty: 'helppo' as Difficulty,
      questionCount: 6,
      grade: 5,
      mode: 'flashcard',
      identifiedTopics: ['Sanasto', 'Kielioppi', 'Arkilauseet'],
      materialText: 'Present simple ja koulusanasto.',
    });

    assert.doesNotMatch(prompt, /FOCUSED-ERÄN MUISTIKORTTISÄÄNNÖT/i);
  });

  it('history quiz prompt excludes short answer guidance', async () => {
    const builder = new PromptBuilder(new PromptLoader());

    const prompt = await builder.assemblePrompt({
      subject: 'History' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 12,
      grade: 5,
      mode: 'quiz',
      identifiedTopics: ['Antiikki', 'Keskiaika', 'Suomen historia'],
      materialText: 'Historiassa käsitellään aikakausia, tapahtumia ja niiden järjestystä.',
    });

    assert.doesNotMatch(prompt, /Käytettävissä olevat kysymystyypit[\s\S]*- short_answer:/i);
    assert.match(prompt, /ÄLÄ käytä short_answer-tyyppiä historiassa/i);
    assert.match(prompt, /Historian sisällöissä käytä sequential-tyyppiä/i);
  });

  it('focused call exposes focused-batch template version metadata', async () => {
    const loader = new PromptLoader();
    const builder = new PromptBuilder(loader);

    await builder.assemblePrompt({
      subject: 'Biology' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 8,
      grade: 6,
      mode: 'quiz',
      focusTopic: 'Fotosynteesi',
      identifiedTopics: ['Fotosynteesi'],
      materialText: 'Fotosynteesi tarvitsee valoa, vettä ja hiilidioksidia.',
    });

    const metadata = loader.getVersionMetadata();

    assert.match(metadata['core/focused-batch-tagging.txt'] ?? '', /^\d+\.\d+\.\d+$/);
  });

  it('whole-set call exposes whole-set version metadata and does not load focused-batch tagging template', async () => {
    const loader = new PromptLoader();
    const builder = new PromptBuilder(loader);

    await builder.assemblePrompt({
      subject: 'Math' as Subject,
      difficulty: 'normaali' as Difficulty,
      questionCount: 12,
      grade: 5,
      mode: 'quiz',
      identifiedTopics: ['Geometria', 'Murtoluvut', 'Yhtalot'],
      materialText: 'Geometria: pinta-ala ja piiri. Murtoluvut: lavennus ja supistus.',
    });

    const metadata = loader.getVersionMetadata();

    assert.match(metadata['core/whole-set-tagging.txt'] ?? '', /^\d+\.\d+\.\d+$/);
    assert.equal('core/focused-batch-tagging.txt' in metadata, false);
  });
});
