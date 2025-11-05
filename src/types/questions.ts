// Question Types
export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'true_false'
  | 'matching'
  | 'short_answer';

export type Subject = string;

export type Difficulty = 'helppo' | 'normaali' | 'vaikea';

// Base Question Interface
export interface BaseQuestion {
  id: string;
  question_set_id: string;
  question_text: string;
  question_type: QuestionType;
  explanation: string;
  image_url?: string;
  order_index: number;
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
  max_length?: number;
}

// Union type of all question types
export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | ShortAnswerQuestion;

// Question Set
export interface QuestionSet {
  id: string;
  code: string;
  name: string;
  subject: Subject;
  grade?: number;
  difficulty: Difficulty;
  topic?: string;
  subtopic?: string;
  question_count: number;
  created_at: string;
  updated_at?: string;
}

// Question Set with Questions
export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[];
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

// Material Upload
export interface MaterialUpload {
  text?: string;
  files?: File[];
}

// Question Generation Request
export interface QuestionGenerationRequest {
  subject: Subject;
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
