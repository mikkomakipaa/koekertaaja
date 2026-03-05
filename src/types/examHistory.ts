export interface ExamHistoryEntry {
  code: string;
  name: string | null;
  subject: string | null;
  examDate: string | null;
  difficulty: string | null;
  grade: string | null;
  sortTimestamp: number;
  lastScore: {
    score: number;
    total: number;
    percentage: number;
    timestamp: number;
    difficulty?: string;
  } | null;
}
