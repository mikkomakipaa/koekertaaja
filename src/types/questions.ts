import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';

// Question Types
export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'sequential'
  | 'map';

export type Subject = string;

export type Difficulty = 'helppo' | 'normaali';

export type Mode = 'quiz' | 'flashcard';

export type QuestionSetStatus = 'created' | 'published';

export type QuestionFlagReason = 'wrong_answer' | 'ambiguous' | 'typo' | 'other';

export interface QuestionFlag {
  id: string;
  question_id: string;
  question_set_id: string;
  reason: QuestionFlagReason;
  note?: string | null;
  client_id: string;
  created_at: string;
}

// Base Question Interface
export interface BaseQuestion {
  id: string;
  question_set_id: string;
  question_text: string;
  question_type: QuestionType;
  explanation: string;
  image_url?: string;
  order_index: number;
  topic?: string;  // High-level topic (e.g., "Grammar", "Vocabulary", "Reading")
  skill?: string;  // Specific skill tag (snake_case)
  subtopic?: string;  // Optional finer-grained subtopic within a topic
}

// Specific Question Types
export interface MultipleChoiceQuestion extends BaseQuestion {
  question_type: 'multiple_choice';
  options: string[];
  correct_answer: string;
}

export interface FillBlankQuestion extends BaseQuestion {
  question_type: 'fill_blank';
  correct_answer: string;
  acceptable_answers?: string[];
}

export interface TrueFalseQuestion extends BaseQuestion {
  question_type: 'true_false';
  correct_answer: boolean;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingQuestion extends BaseQuestion {
  question_type: 'matching';
  pairs: MatchingPair[];
}

export interface ShortAnswerQuestion extends BaseQuestion {
  question_type: 'short_answer';
  correct_answer: string;
  acceptable_answers?: string[];
  max_length?: number;
}

export interface SequentialItem {
  text: string;
  year?: number;
}

export interface SequentialQuestion extends BaseQuestion {
  question_type: 'sequential';
  items: SequentialItem[] | string[];  // Items in scrambled order (displayed to user)
  correct_order: number[];  // Correct indices [0, 2, 1, 3] representing original item positions
}

export interface MapRegion {
  id: string;
  label: string;
  aliases?: string[];
}

export type MapInputMode = 'single_region' | 'multi_region' | 'text';

export interface MapQuestionOptions {
  mapAsset: string;
  regions: MapRegion[];
  inputMode: MapInputMode;
}

export interface MapQuestion extends BaseQuestion {
  question_type: 'map';
  options: MapQuestionOptions;
  correct_answer: string | string[];
}

export interface MapQuestionEntity {
  id: string;
  question_set_id: string | null;
  subject: Subject;
  grade?: number | null;
  difficulty?: Difficulty | null;
  question: string;
  explanation: string;
  topic?: string | null;
  subtopic?: string | null;
  skill?: string | null;
  map_asset: string;
  input_mode: MapInputMode;
  regions: MapRegion[];
  correct_answer: string | string[];
  acceptable_answers?: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export function isSequentialItemArray(items: unknown): items is SequentialItem[] {
  return Array.isArray(items) && items.every(
    (item) => typeof item === 'object' && item !== null && 'text' in item
  );
}

export function isStringArray(items: unknown): items is string[] {
  return Array.isArray(items) && items.every((item) => typeof item === 'string');
}

// Union type of all question types
export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | ShortAnswerQuestion
  | SequentialQuestion
  | MapQuestion;

// Question Set
export interface QuestionSet {
  id: string;
  code: string;
  name: string;
  subject: Subject;
  subject_type?: SubjectType;
  grade?: number;
  difficulty: Difficulty;
  mode: Mode;  // 'quiz' for traditional assessment, 'flashcard' for memorization-focused
  topic?: string;
  subtopic?: string;
  question_count: number;
  exam_length?: number;
  status: QuestionSetStatus;  // 'created' (unpublished) or 'published' (visible on play pages)
  created_at: string;
  updated_at?: string;
}

// Question Set with Questions
export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
}

// Study Mode
export type StudyMode = 'pelaa' | 'opettele';

// Flashcard (converted from questions, excludes sequential)
export type FlashcardCompatibleQuestion = Exclude<Question, SequentialQuestion>;

export interface Flashcard {
  id: string;
  questionId: string;
  front: string;  // Question text
  back: {
    answer: string;  // Formatted answer display
    explanation: string;  // Why this is correct
  };
  questionType: QuestionType;
  originalQuestion: FlashcardCompatibleQuestion;
}

// Flashcard Session (client-side only, not stored in DB)
export interface FlashcardSession {
  questionSetCode: string;
  questionSetName: string;
  flashcards: Flashcard[];
  currentIndex: number;
  reviewedCount: number;
  flippedCards: Set<string>;  // Track which cards have been flipped
  startedAt: Date;
}

// Game Session (not stored in DB)
export interface GameSession {
  questionSetCode: string;
  questionSetName: string;
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  score: number;
  startedAt: Date;
}

// Answer
export interface Answer {
  questionId: string;
  questionText: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation: string;
  pointsEarned?: number;
  streakAtAnswer?: number;
}

// Badge System
export type BadgeId =
  | 'first_session'
  | '5_sessions'
  | '10_sessions'
  | '25_sessions'
  | 'perfect_score'
  | 'beat_personal_best'
  | 'speed_demon'
  | 'tried_both_levels'
  | 'streak_3'
  | 'streak_5'
  | 'streak_10';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  unlockConditions: string[];
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface BadgeProgress {
  badges: Record<BadgeId, Badge>;
  stats: {
    totalSessions: number;
    perfectScores: number;
    personalBest: number;
    levelsPlayed: Set<string>;
  };
}

// Material Upload
export interface MaterialUpload {
  text?: string;
  files?: File[];
}

// Question Generation Request
export interface QuestionGenerationRequest {
  subject: Subject;
  subjectType?: SubjectType;
  grade?: number;
  difficulty: Difficulty;
  questionCount: number;
  questionSetName: string;
  topic?: string;
  subtopic?: string;
  material: MaterialUpload;
}

// Question Generation Response
export interface QuestionGenerationResponse {
  code: string;
  questionSet: QuestionSet;
  questions: Question[];
  metadata: {
    questionCount: number;
    tokensUsed?: number;
  };
}
