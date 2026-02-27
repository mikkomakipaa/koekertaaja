import { z } from 'zod';

export const flagSchema = z.object({
  questionId: z.string().uuid({ message: 'Invalid questionId' }),
  questionSetId: z.string().uuid({ message: 'Invalid questionSetId' }),
  reason: z.enum(['wrong_answer', 'ambiguous', 'typo', 'other'], {
    errorMap: () => ({ message: 'Invalid reason' }),
  }),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
  clientId: z.string().min(8, 'Invalid clientId').max(200, 'Invalid clientId').optional(),
});

export const MAX_FLAGS_PER_DAY = 3;
export const PER_QUESTION_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
export const MAX_FLAGS_PER_QUESTION_WINDOW = 1;

export function getFlagAbuseRejection(params: {
  dailyCount: number;
  questionWindowCount: number;
}): { error: string } | null {
  if (params.dailyCount >= MAX_FLAGS_PER_DAY) {
    return { error: 'Flagging limit reached. Try again later.' };
  }

  if (params.questionWindowCount >= MAX_FLAGS_PER_QUESTION_WINDOW) {
    return { error: 'You already flagged this question recently. Try again later.' };
  }

  return null;
}
