import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import { Badge, BadgeId } from '@/types';
import {
  Sparkle,
  Fire,
  Barbell,
  Target,
  Star,
  Rocket,
  Lightning,
  Palette
} from '@phosphor-icons/react';

const STORAGE_KEY = 'koekertaaja_badges';
const logger = createLogger({ module: 'useBadges' });

interface BadgeStats {
  totalSessions: number;
  perfectScores: number;
  personalBest: number;
  levelsPlayed: string[];
}

interface StoredBadgeData {
  unlockedBadges: BadgeId[];
  unlockedAt?: Partial<Record<BadgeId, string>>;
  stats: BadgeStats;
}

const MONIPUOLINEN_REQUIRED_MODES = ['helppo', 'normaali', 'aikahaaste'] as const;

export function hasUnlockedMonipuolinen(levelsPlayed: string[]): boolean {
  return MONIPUOLINEN_REQUIRED_MODES.every((mode) => levelsPlayed.includes(mode));
}

export function hasUnlockedHuippupisteet(params: {
  totalPoints: number;
  previousPersonalBest: number;
}): boolean {
  const { totalPoints, previousPersonalBest } = params;
  return totalPoints > 0 && totalPoints >= previousPersonalBest;
}

export function hasUnlockedNopeaJaTarkka(params: {
  difficulty?: string;
  score: number;
  totalQuestions: number;
}): boolean {
  const { difficulty, score, totalQuestions } = params;
  return difficulty === 'aikahaaste' && score === totalQuestions && totalQuestions === 10;
}

export function getBadgeDefinitionCount(): number {
  return Object.keys(BADGE_DEFINITIONS).length;
}

const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, 'unlocked' | 'unlockedAt'>> = {
  first_session: {
    id: 'first_session',
    name: 'Ensimmäinen yritys',
    description: 'Suorita ensimmäinen harjoituskierros',
    emoji: '🌟',
    unlockConditions: ['Suorita ensimmäinen harjoitussessiosi'],
  },
  '5_sessions': {
    id: '5_sessions',
    name: 'Harjoittelija',
    description: 'Suorita 5 harjoituskierrosta',
    emoji: '🔥',
    unlockConditions: ['Suorita 5 harjoitussessiota'],
  },
  '10_sessions': {
    id: '10_sessions',
    name: 'Ahkera opiskelija',
    description: 'Suorita 10 harjoituskierrosta',
    emoji: '💪',
    unlockConditions: ['Suorita 10 harjoitussessiota'],
  },
  '25_sessions': {
    id: '25_sessions',
    name: 'Mestari',
    description: 'Suorita 25 harjoituskierrosta',
    emoji: '🏆',
    unlockConditions: ['Suorita 25 harjoitussessiota'],
  },
  perfect_score: {
    id: 'perfect_score',
    name: 'Täydellinen',
    description: 'Saa kaikki kysymykset oikein',
    emoji: '⭐',
    unlockConditions: ['Saa 100% pisteistä yhdessä sessiossa'],
  },
  nopea_tarkka: {
    id: 'nopea_tarkka',
    name: 'Nopea ja tarkka',
    description: 'Saa 100% Aikahaaste-tilassa',
    emoji: '🎯',
    unlockConditions: ['Saa kaikki 10 kysymystä oikein Aikahaaste-tilassa'],
  },
  beat_personal_best: {
    id: 'beat_personal_best',
    name: 'Huippupisteet',
    description: 'Saavuta henkilökohtainen ennätyksesi',
    emoji: '🚀',
    unlockConditions: [
      'Saa vähintään henkilökohtaisen ennätyksesi verran pisteitä',
      'Myös tasatulos avaa merkin',
    ],
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Salamanopea',
    description: 'Suorita kierros alle 5 minuutissa',
    emoji: '⚡',
    unlockConditions: ['Suorita sessio alle 5 minuutissa'],
  },
  tried_both_levels: {
    id: 'tried_both_levels',
    name: 'Monipuolinen',
    description: 'Kokeile kaikkia kolmea pelimuotoa',
    emoji: '🎪',
    unlockConditions: ['Kokeile kaikkia pelimuotoja (Helppo, Normaali ja Aikahaaste)'],
  },
  streak_3: {
    id: 'streak_3',
    name: 'Putki 3',
    description: 'Vastaa 3 kysymykseen oikein peräkkäin',
    emoji: '🔥',
    unlockConditions: ['Vastaa 3 kysymykseen oikein peräkkäin'],
  },
  streak_5: {
    id: 'streak_5',
    name: 'Putki 5',
    description: 'Vastaa 5 kysymykseen oikein peräkkäin',
    emoji: '🔥🔥',
    unlockConditions: ['Vastaa 5 kysymykseen oikein peräkkäin'],
  },
  streak_10: {
    id: 'streak_10',
    name: 'Putki 10',
    description: 'Vastaa 10 kysymykseen oikein peräkkäin',
    emoji: '🔥🔥🔥',
    unlockConditions: ['Vastaa 10 kysymykseen oikein peräkkäin'],
  },
};

export function useBadges(questionSetCode?: string) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<BadgeId[]>([]);
  const [stats, setStats] = useState<BadgeStats>({
    totalSessions: 0,
    perfectScores: 0,
    personalBest: 0,
    levelsPlayed: [],
  });

  // Load badges from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredBadgeData = JSON.parse(stored);
        const unlockedAt = data.unlockedAt ?? {};
        setStats(data.stats);

        // Initialize all badges
        const allBadges = Object.values(BADGE_DEFINITIONS).map(def => ({
          ...def,
          unlocked: data.unlockedBadges.includes(def.id),
          unlockedAt: unlockedAt[def.id] ? new Date(unlockedAt[def.id] as string) : undefined,
        }));

        setBadges(allBadges);
      } else {
        // Initialize with all badges locked
        const allBadges = Object.values(BADGE_DEFINITIONS).map(def => ({
          ...def,
          unlocked: false,
          unlockedAt: undefined,
        }));
        setBadges(allBadges);
      }
    } catch (error) {
      logger.error({ error }, 'Error loading badges');
    }
  }, []);

  // Save badges to localStorage
  const saveBadges = useCallback((updatedBadges: Badge[], updatedStats: BadgeStats) => {
    try {
      const unlockedBadges = updatedBadges
        .filter(b => b.unlocked)
        .map(b => b.id);
      const unlockedAt: Partial<Record<BadgeId, string>> = {};

      updatedBadges.forEach((badge) => {
        if (badge.unlocked && badge.unlockedAt) {
          unlockedAt[badge.id] = badge.unlockedAt.toISOString();
        }
      });

      const data: StoredBadgeData = {
        unlockedBadges,
        unlockedAt,
        stats: updatedStats,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error({ error }, 'Error saving badges');
    }
  }, []);

  // Unlock a badge
  const unlockBadge = useCallback((badgeId: BadgeId) => {
    setBadges(prev => {
      const updated = prev.map(badge =>
        badge.id === badgeId && !badge.unlocked
          ? { ...badge, unlocked: true, unlockedAt: new Date() }
          : badge
      );

      // Check if this is newly unlocked
      const wasUnlocked = prev.find(b => b.id === badgeId)?.unlocked;
      if (!wasUnlocked) {
        setNewlyUnlocked(current => [...current, badgeId]);
      }

      return updated;
    });
  }, []);

  // Record session completion and check for badge unlocks
  const recordSession = useCallback((params: {
    score: number;
    totalQuestions: number;
    bestStreak: number;
    totalPoints: number;
    durationSeconds?: number;
    difficulty?: string;
  }) => {
    const { score, totalQuestions, bestStreak, totalPoints, durationSeconds, difficulty } = params;

    // Update stats
    const newStats: BadgeStats = {
      totalSessions: stats.totalSessions + 1,
      perfectScores: stats.perfectScores + (score === totalQuestions ? 1 : 0),
      personalBest: Math.max(stats.personalBest, totalPoints),
      levelsPlayed: difficulty && !stats.levelsPlayed.includes(difficulty)
        ? [...stats.levelsPlayed, difficulty]
        : stats.levelsPlayed,
    };

    setStats(newStats);

    // Check badge criteria
    const newBadges: BadgeId[] = [];

    // Session count badges
    if (newStats.totalSessions >= 1) newBadges.push('first_session');
    if (newStats.totalSessions >= 5) newBadges.push('5_sessions');
    if (newStats.totalSessions >= 10) newBadges.push('10_sessions');
    if (newStats.totalSessions >= 25) newBadges.push('25_sessions');

    // Perfect score
    if (score === totalQuestions) newBadges.push('perfect_score');

    // Nopea ja tarkka: Perfect score in Aikahaaste mode
    if (hasUnlockedNopeaJaTarkka({ difficulty, score, totalQuestions })) {
      newBadges.push('nopea_tarkka');
    }

    // Beat personal best
    if (hasUnlockedHuippupisteet({ totalPoints, previousPersonalBest: stats.personalBest })) {
      newBadges.push('beat_personal_best');
    }

    // Speed demon (5 minutes = 300 seconds)
    if (durationSeconds && durationSeconds < 300) {
      newBadges.push('speed_demon');
    }

    // Monipuolinen: require all three play modes.
    if (hasUnlockedMonipuolinen(newStats.levelsPlayed)) {
      newBadges.push('tried_both_levels');
    }

    // Streak badges
    if (bestStreak >= 3) newBadges.push('streak_3');
    if (bestStreak >= 5) newBadges.push('streak_5');
    if (bestStreak >= 10) newBadges.push('streak_10');

    // Unlock all earned badges
    newBadges.forEach(badgeId => unlockBadge(badgeId));

    // Save to localStorage
    setBadges(currentBadges => {
      const updated = currentBadges.map(badge =>
        newBadges.includes(badge.id) && !badge.unlocked
          ? { ...badge, unlocked: true, unlockedAt: new Date() }
          : badge
      );
      saveBadges(updated, newStats);
      return updated;
    });
  }, [stats, unlockBadge, saveBadges]);

  // Clear newly unlocked badges (call after showing notification)
  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  // Get personal best for specific question set
  const getPersonalBest = useCallback((code: string): number => {
    try {
      const stored = localStorage.getItem(`pb_${code}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  }, []);

  // Update personal best for specific question set
  const updatePersonalBest = useCallback((code: string, points: number) => {
    try {
      const current = getPersonalBest(code);
      if (points > current) {
        localStorage.setItem(`pb_${code}`, points.toString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [getPersonalBest]);

  return {
    badges,
    newlyUnlocked,
    stats,
    recordSession,
    clearNewlyUnlocked,
    getPersonalBest,
    updatePersonalBest,
  };
}
