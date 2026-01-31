import {
  Question,
  QuestionSet,
  QuestionFlag,
  SequentialItem,
  isSequentialItemArray,
  isStringArray,
} from './questions';

/**
 * Safely convert various types to boolean
 * Handles string "true"/"false"/"totta", numbers 1/0, and actual booleans
 */
function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    // Handle English (true/false), Finnish (totta/tarua), and numeric strings
    const lowerValue = value.toLowerCase().trim();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'totta';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return Boolean(value);
}

function normalizeSequentialItems(items: unknown): SequentialItem[] {
  if (isSequentialItemArray(items)) {
    return items;
  }
  if (isStringArray(items)) {
    return items.map((text) => ({ text }));
  }
  return [];
}

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      question_sets: {
        Row: QuestionSet & Record<string, unknown>;
        Insert: Omit<QuestionSet, 'id' | 'created_at' | 'updated_at'> & Record<string, unknown>;
        Update: Partial<Omit<QuestionSet, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      questions: {
        Row: DatabaseQuestion & Record<string, unknown>;
        Insert: Omit<DatabaseQuestion, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<DatabaseQuestion, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
      question_flags: {
        Row: QuestionFlag & Record<string, unknown>;
        Insert: Omit<QuestionFlag, 'id' | 'created_at'> & Record<string, unknown>;
        Update: Partial<Omit<QuestionFlag, 'id' | 'created_at'>> & Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Database representation of Question (JSONB fields)
export interface DatabaseQuestion {
  id: string;
  question_set_id: string;
  question_text: string;
  question_type: string;
  correct_answer: any; // JSONB
  options?: any; // JSONB
  explanation: string;
  image_url?: string;
  order_index: number;
  created_at: string;
  topic?: string;
  skill?: string;
  subtopic?: string;
}

// Helper to convert DatabaseQuestion to typed Question
export function parseDatabaseQuestion(dbQuestion: DatabaseQuestion): Question {
  const base = {
    id: dbQuestion.id,
    question_set_id: dbQuestion.question_set_id,
    question_text: dbQuestion.question_text,
    explanation: dbQuestion.explanation,
    image_url: dbQuestion.image_url,
    order_index: dbQuestion.order_index,
    topic: dbQuestion.topic,
    skill: dbQuestion.skill,
    subtopic: dbQuestion.subtopic,
  };

  switch (dbQuestion.question_type) {
    case 'multiple_choice':
      return {
        ...base,
        question_type: 'multiple_choice',
        options: (dbQuestion.options as string[]) || [],
        correct_answer: dbQuestion.correct_answer as string,
      };
    case 'fill_blank':
      return {
        ...base,
        question_type: 'fill_blank',
        correct_answer: dbQuestion.correct_answer as string,
        acceptable_answers: dbQuestion.options as string[] | undefined,
      };
    case 'true_false':
      return {
        ...base,
        question_type: 'true_false',
        correct_answer: convertToBoolean(dbQuestion.correct_answer),
      };
    case 'matching':
      return {
        ...base,
        question_type: 'matching',
        pairs: (dbQuestion.correct_answer as Array<{ left: string; right: string }>) || [],
      };
    case 'short_answer':
      return {
        ...base,
        question_type: 'short_answer',
        correct_answer: dbQuestion.correct_answer as string,
        acceptable_answers: Array.isArray(dbQuestion.options) ? dbQuestion.options as string[] : undefined,
        max_length: (dbQuestion.options && !Array.isArray(dbQuestion.options)) ? dbQuestion.options.max_length as number | undefined : undefined,
      };
    case 'sequential': {
      const storedAnswer = dbQuestion.correct_answer as any;
      const rawItems = storedAnswer?.items ?? storedAnswer;
      return {
        ...base,
        question_type: 'sequential',
        items: normalizeSequentialItems(rawItems),
        correct_order: Array.isArray(storedAnswer?.correct_order) ? storedAnswer.correct_order : [],
      };
    }
    default:
      throw new Error(`Unknown question type: ${dbQuestion.question_type}`);
  }
}
