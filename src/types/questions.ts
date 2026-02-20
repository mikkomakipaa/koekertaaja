import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import type { PromptMetadata } from '@/lib/prompts/promptVersion';

// Question Types
export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'fill_blank'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'sequential'
  | 'flashcard';

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
  image_reference?: string;
  requires_visual?: boolean;
  order_index: number;
  topic?: string;  // High-level topic (e.g., "Grammar", "Vocabulary", "Reading")
  skill?: string;  // Specific skill tag (snake_case)
  subtopic?: string;  // Optional finer-grained subtopic within a topic
  concept_id?: string; // Optional curriculum concept identifier for dependency ordering
}

// Specific Question Types
export interface MultipleChoiceQuestion extends BaseQuestion {
  question_type: 'multiple_choice';
  options: string[];
  correct_answer: string;
}

export interface MultipleSelectQuestion extends BaseQuestion {
  question_type: 'multiple_select';
  options: string[];
  correct_answers: string[];
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

export interface FlashcardQuestion extends BaseQuestion {
  question_type: 'flashcard';
  correct_answer: string;
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
  | MultipleSelectQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | ShortAnswerQuestion
  | SequentialQuestion
  | FlashcardQuestion;

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
  prompt_metadata?: PromptMetadata | null;
  created_at: string;
  updated_at?: string;
}

// Question Set with Questions
export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
}

// Study Mode
export type StudyMode = 'pelaa' | 'opettele';

/**
 * Available interactive learning modes in the play experience.
 */
export type QuizMode = 'quiz' | 'flashcard' | 'speed-quiz';

/**
 * Client-side session state for an active Aikahaaste (speed quiz) run.
 */
export interface SpeedQuizSession {
  /** Identifies this session as speed quiz mode. */
  mode: 'speed-quiz';
  /** Share code of the question set being played. */
  questionSetCode: string;
  /** The 10 selected questions for this run. */
  selectedQuestions: Question[];
  /** Zero-based index of the currently active question. */
  currentQuestionIndex: number;
  /** Fixed time limit per question in seconds (v1). */
  timePerQuestion: 15;
  /** Fixed number of questions in one session (v1). */
  totalQuestions: 10;
  /** Session start timestamp in milliseconds. */
  startTime: number;
  /** Timestamp in milliseconds when the current question started. */
  questionStartTime: number;
  /** Question IDs automatically skipped due to timeout. */
  skippedQuestions: string[];
  /** Mapping of question ID to the submitted user answer. */
  answers: Record<string, string>;
  /** Question IDs answered correctly. */
  correctAnswers: string[];
  /** Question IDs answered incorrectly. */
  wrongAnswers: string[];
}

/**
 * Summary payload for rendering speed quiz results.
 */
export interface SpeedQuizResult {
  /** Total elapsed quiz time in seconds. */
  totalTime: number;
  /** Number of correctly answered questions. */
  correctCount: number;
  /** Number of incorrectly answered questions. */
  wrongCount: number;
  /** Number of questions skipped due to timeout. */
  skippedCount: number;
  /** Final points earned from the session. */
  score: number;
  /** Longest consecutive correct-answer streak. */
  bestStreak: number;
  /** Per-question outcome data for results breakdown UI. */
  questions: Array<{
    /** Question ID. */
    id: string;
    /** Question text shown to the user. */
    question: string;
    /** Result status of this question in speed quiz mode. */
    status: 'correct' | 'wrong' | 'skipped';
    /** User-submitted answer, when available. */
    userAnswer?: string;
    /** Correct answer shown in results view. */
    correctAnswer: string;
  }>;
}

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
  questionType?: QuestionType;
  questionOptions?: string[];
  isCorrect: boolean;
  explanation: string;
  pointsEarned?: number;
  streakAtAnswer?: number;
  matchType?: 'exact' | 'numerical' | 'unit_conversion' | 'expression' | 'semantic' | 'none';
}

// Badge System
export type BadgeId =
  | 'first_session'
  | '5_sessions'
  | '10_sessions'
  | '25_sessions'
  | 'perfect_score'
  | 'nopea_tarkka'
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
