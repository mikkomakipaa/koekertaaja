import type { Badge, BadgeId } from '@/types';

export const BADGE_VISUAL_REGRESSION_BADGES: Badge[] = [
  {
    id: 'first_session',
    name: 'Skibidi Alku',
    description: 'Suorita ensimmäinen harjoituskierros',
    emoji: '✨',
    unlockConditions: ['Suorita ensimmäinen harjoitussessiosi'],
    unlocked: true,
    unlockedAt: new Date('2026-02-20T08:30:00.000Z'),
  },
  {
    id: '5_sessions',
    name: 'NPC ei olla',
    description: 'Suorita 5 harjoituskierrosta',
    emoji: '🎮',
    unlockConditions: ['Suorita 5 harjoitussessiota'],
    unlocked: true,
    unlockedAt: new Date('2026-02-24T12:15:00.000Z'),
  },
  {
    id: '10_sessions',
    name: 'Sigma Grindset',
    description: 'Suorita 10 harjoituskierrosta',
    emoji: '⚡',
    unlockConditions: ['Suorita 10 harjoitussessiota'],
    unlocked: true,
    unlockedAt: new Date('2026-02-27T09:00:00.000Z'),
  },
  {
    id: '25_sessions',
    name: 'Certified Goated',
    description: 'Suorita 25 harjoituskierrosta',
    emoji: '🐐',
    unlockConditions: ['Suorita 25 harjoitussessiota'],
    unlocked: true,
    unlockedAt: new Date('2026-03-01T16:45:00.000Z'),
  },
  {
    id: 'perfect_score',
    name: 'Goat Tulos',
    description: 'Saa kaikki kysymykset oikein',
    emoji: '⭐',
    unlockConditions: ['Saa 100% pisteistä yhdessä sessiossa'],
    unlocked: true,
    unlockedAt: new Date('2026-03-02T18:00:00.000Z'),
  },
  {
    id: 'nopea_tarkka',
    name: 'Slay Tarkka',
    description: 'Saa 100% Aikahaaste-tilassa',
    emoji: '🎯',
    unlockConditions: ['Saa kaikki 10 kysymystä oikein Aikahaaste-tilassa'],
    unlocked: false,
  },
  {
    id: 'beat_personal_best',
    name: 'Aura Ennätys',
    description: 'Saavuta henkilökohtainen ennätyksesi',
    emoji: '🏆',
    unlockConditions: [
      'Saa vähintään henkilökohtaisen ennätyksesi verran pisteitä',
      'Myös tasatulos avaa merkin',
    ],
    unlocked: true,
    unlockedAt: new Date('2026-03-03T07:50:00.000Z'),
  },
  {
    id: 'speed_demon',
    name: 'Fr Fr Fast',
    description: 'Suorita kierros alle 5 minuutissa',
    emoji: '⚡',
    unlockConditions: ['Suorita sessio alle 5 minuutissa'],
    unlocked: false,
  },
  {
    id: 'tried_both_levels',
    name: 'Vibe Kokeilija',
    description: 'Kokeile kaikkia kolmea pelimuotoa',
    emoji: '💎',
    unlockConditions: ['Kokeile kaikkia pelimuotoja (Helppo, Normaali ja Aikahaaste)'],
    unlocked: false,
  },
  {
    id: 'streak_3',
    name: 'W Putki',
    description: 'Vastaa 3 kysymykseen oikein peräkkäin',
    emoji: '🔥',
    unlockConditions: ['Vastaa 3 kysymykseen oikein peräkkäin'],
    unlocked: true,
    unlockedAt: new Date('2026-02-21T14:10:00.000Z'),
  },
  {
    id: 'streak_5',
    name: 'Rizz Putki',
    description: 'Vastaa 5 kysymykseen oikein peräkkäin',
    emoji: '🔥',
    unlockConditions: ['Vastaa 5 kysymykseen oikein peräkkäin'],
    unlocked: false,
  },
  {
    id: 'streak_10',
    name: 'Sigma Putki',
    description: 'Vastaa 10 kysymykseen oikein peräkkäin',
    emoji: '🔥🔥🔥',
    unlockConditions: ['Vastaa 10 kysymykseen oikein peräkkäin'],
    unlocked: true,
    unlockedAt: new Date('2026-03-03T07:55:00.000Z'),
  },
];

export const BADGE_VISUAL_REGRESSION_HIGHLIGHTED_IDS: BadgeId[] = [
  '25_sessions',
  'perfect_score',
  'streak_10',
];

export const BADGE_VISUAL_REGRESSION_STATS = {
  totalSessions: 28,
  perfectScores: 4,
  personalBest: 190,
  levelsPlayed: ['helppo', 'normaali', 'aikahaaste'],
};

export const BADGE_VISUAL_REGRESSION_RESULTS = {
  score: 14,
  total: 15,
  bestStreak: 10,
  skippedAnswers: 1,
};
