import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BadgePreviewCard } from '@/components/play/BadgePreviewCard';
import { GradeCard } from '@/components/play/GradeCard';
import { TopicMasterySection } from '@/components/play/TopicMasterySection';
import type { Badge } from '@/types';

const unlockedBadge: Badge = {
  id: 'perfect_score',
  name: 'Täysi onnistuminen',
  description: 'Saa kaikki kysymykset oikein',
  emoji: '⭐',
  unlockConditions: ['Saa 100% pisteistä yhdessä sessiossa'],
  unlocked: true,
};

describe('results screen cards', () => {
  it('renders a strong grade card for perfect-score cases', () => {
    const html = renderToString(
      createElement(GradeCard, {
        score: 10,
        total: 10,
        title: 'Matematiikka',
        difficultyLabel: 'Normaali',
      })
    );

    assert.ok(html.includes('Matematiikka'));
    assert.ok(html.includes('Normaali'));
    assert.match(html, /10(?:<!-- -->)?\s*\/\s*(?:<!-- -->)?10(?:<!-- -->)? oikein/);
    assert.ok(html.includes('Kierroksen tulos'));
    assert.ok(html.includes('Arvosana'));
  });

  it('renders badge preview only when new badges exist', () => {
    const withBadge = renderToString(createElement(BadgePreviewCard, { badges: [unlockedBadge] }));
    const withoutBadge = renderToString(createElement(BadgePreviewCard, { badges: [] }));

    assert.ok(withBadge.includes('Uudet merkit'));
    assert.ok(withBadge.includes('Täysi onnistuminen'));
    assert.equal(withoutBadge, '');
  });

  it('renders empty-state topic guidance when no topic data exists', () => {
    const html = renderToString(createElement(TopicMasterySection, { items: [] }));

    assert.ok(html.includes('Aiheiden hallinta'));
    assert.ok(html.includes('Aihekohtaista hallintadataa ei ole viela saatavilla.'));
  });

  it('renders topic review CTA routing for weak topics and omits it for strong topics', () => {
    const html = renderToString(
      createElement(TopicMasterySection, {
        items: [
          {
            topic: 'Geometria',
            correct: 1,
            total: 4,
            percentage: 25,
            level: 'weak',
            statusLabel: 'Kertaa seuraavaksi',
            guidance: 'Aloita kertaus taman aiheen korteista.',
            playHref: '/play/QUIZ123?mode=pelaa&topic=Geometria',
            reviewHref: '/play/FLASH123?mode=opettele&topic=Geometria',
          },
          {
            topic: 'Yhteenlasku',
            correct: 4,
            total: 4,
            percentage: 100,
            level: 'strong',
            statusLabel: 'Vahva',
            guidance: 'Tama aihe pysyy hyvin muistissa.',
            playHref: '/play/QUIZ123?mode=pelaa&topic=Yhteenlasku',
            reviewHref: null,
          },
        ],
      })
    );

    assert.ok(html.includes('Geometria'));
    assert.ok(!html.includes('Kertaa seuraavaksi'));
    assert.ok(!html.includes('Vahva'));
    assert.match(html, /1(?:<!-- -->)?\/(?:<!-- -->)?4(?:<!-- -->)? oikein/);
    assert.match(html, /25(?:<!-- -->)?%/);
    assert.ok(html.includes('Pelaa'));
    assert.ok(html.includes('Opettele'));
    assert.ok(!html.includes('progressbar'));
    assert.match(html, /href="\/play\/QUIZ123\?mode=pelaa&amp;topic=Geometria"/);
    assert.match(html, /href="\/play\/FLASH123\?mode=opettele&amp;topic=Geometria"/);
    assert.ok(html.includes('Yhteenlasku'));
    assert.match(html, /href="\/play\/QUIZ123\?mode=pelaa&amp;topic=Yhteenlasku"/);
  });
});
