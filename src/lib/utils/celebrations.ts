const PERFECT_SCORES_KEY = 'koekertaaja_perfect_scores';
const ALL_BADGES_KEY = 'koekertaaja_all_badges_celebrated';

function parseCelebratedQuestionSets(stored: string | null): string[] {
  if (!stored) {
    return [];
  }

  const parsed = JSON.parse(stored) as unknown;
  return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
}

export function hasCelebratedPerfectScore(questionSetCode: string): boolean {
  try {
    const stored = localStorage.getItem(PERFECT_SCORES_KEY);
    const celebrated = parseCelebratedQuestionSets(stored);
    return celebrated.includes(questionSetCode);
  } catch {
    return false;
  }
}

export function markPerfectScoreCelebrated(questionSetCode: string): void {
  try {
    const stored = localStorage.getItem(PERFECT_SCORES_KEY);
    const celebrated = parseCelebratedQuestionSets(stored);
    if (!celebrated.includes(questionSetCode)) {
      celebrated.push(questionSetCode);
      localStorage.setItem(PERFECT_SCORES_KEY, JSON.stringify(celebrated));
    }
  } catch (error) {
    console.error('Failed to mark perfect score celebrated:', error);
  }
}

export function hasCelebratedAllBadges(): boolean {
  try {
    return localStorage.getItem(ALL_BADGES_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markAllBadgesCelebrated(): void {
  try {
    localStorage.setItem(ALL_BADGES_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark all badges celebrated:', error);
  }
}
