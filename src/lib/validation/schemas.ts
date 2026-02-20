import { z } from 'zod';
import { SUBJECTS } from '@/config/subjects';

/**
 * Schema for create question set API request
 */
const subjectTypeSchema = z.enum(['language', 'math', 'written', 'skills', 'concepts', 'geography']);
const validSubjectIds = new Set(SUBJECTS.map((subject) => subject.id));

export const createQuestionSetSchema = z.object({
  questionSetName: z
    .string()
    .min(1, 'Question set name is required')
    .max(200, 'Question set name must be 200 characters or less')
    .trim(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .trim()
    .refine(
      (value) => {
        if (validSubjectIds.has(value)) return true;
        return value.length <= 100;
      },
      'Invalid subject'
    ),
  questionCount: z
    .number()
    .int('Question count must be an integer')
    .min(20, 'Minimum 20 questions required')
    .max(200, 'Maximum 200 questions allowed'),
  examLength: z
    .number()
    .int('Exam length must be an integer')
    .min(5, 'Minimum 5 questions per exam')
    .max(20, 'Maximum 20 questions per exam'),
  grade: z
    .number()
    .int('Grade must be an integer')
    .min(1, 'Grade must be between 1-13')
    .max(13, 'Grade must be between 1-13')
    .optional(),
  topic: z
    .string()
    .max(200, 'Topic must be 200 characters or less')
    .optional(),
  subtopic: z
    .string()
    .max(200, 'Subtopic must be 200 characters or less')
    .optional(),
  materialText: z
    .string()
    .max(50000, 'Material text must be 50,000 characters or less')
    .optional(),
  subjectType: subjectTypeSchema.optional(),
  targetWords: z
    .array(z.string().trim().min(1, 'Target word must not be empty'))
    .max(100, 'Maximum 100 target words allowed')
    .optional(),
  contentType: z.enum(['vocabulary', 'grammar', 'mixed']).optional(),
});

export type CreateQuestionSetInput = z.infer<typeof createQuestionSetSchema>;

/**
 * Schema for AI-generated questions
 */
const sequentialItemSchema = z.object({
  text: z.string().min(1, 'Item text must not be empty').max(500, 'Item text must be 500 characters or less'),
  year: z
    .number()
    .int()
    .min(-3000, 'Year must be between -3000 and 3000')
    .max(3000, 'Year must be between -3000 and 3000')
    .optional(),
});

export const aiQuestionSchema = z.object({
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question must be 1000 characters or less'),
  type: z.enum([
    'multiple_choice',
    'multiple_select',
    'fill_blank',
    'true_false',
    'matching',
    'short_answer',
    'sequential',
    'flashcard',
  ]),
  topic: z
    .string()
    .min(1, 'Topic must not be empty')
    .max(100, 'Topic must be 100 characters or less'),  // Required - every question must have a topic
  subtopic: z
    .string()
    .min(1, 'Subtopic must not be empty')
    .max(100, 'Subtopic must be 100 characters or less')
    .optional(),
  skill: z
    .string()
    .regex(/^[a-z_]+$/, 'Skill must be snake_case')
    .max(100, 'Skill must be 100 characters or less')
    .optional(),
  concept_id: z
    .string()
    .regex(/^[a-z_]+$/, 'Concept ID must be snake_case')
    .max(100, 'Concept ID must be 100 characters or less')
    .optional(),
  image_reference: z
    .string()
    .regex(/^IMAGE_\d+$/i, 'Image reference must match IMAGE_X format')
    .optional(),
  requires_visual: z.boolean().optional(),
  image_url: z.string().max(2000, 'Image URL must be 2000 characters or less').optional(),
  options: z.array(z.string()).min(2, 'Multiple choice questions must have at least 2 options').optional(),
  correct_answers: z.array(z.string()).optional(),
  correct_answer: z.union([
    z.string(),
    z.boolean(),
    z.array(z.any()),
  ]).optional(),
  answer: z.string().optional(),
  acceptable_answers: z.array(z.string()).optional(),
  explanation: z
    .string()
    .min(10, 'Explanation must be at least 10 characters')
    .max(2000, 'Explanation must be 2000 characters or less'),
  pairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).optional(),
  items: z.union([
    z.array(sequentialItemSchema)
      .min(3, 'Sequential questions must have at least 3 items')
      .max(8, 'Sequential questions must have at most 8 items'),
    z.array(z.string().min(1, 'Item text must not be empty').max(500, 'Item text must be 500 characters or less'))
      .min(3, 'Sequential questions must have at least 3 items')
      .max(8, 'Sequential questions must have at most 8 items'),
  ]).optional(),
  correct_order: z.array(z.number()).optional(),
}).superRefine((data, ctx) => {
  // Validate that multiple_choice has at least 2 options (ideally 4)
  if (data.type === 'multiple_choice') {
    if (!Array.isArray(data.options) || data.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multiple choice questions must have at least 2 options',
        path: ['options'],
      });
    }
  }

  if (data.type === 'multiple_select') {
    if (!Array.isArray(data.options) || data.options.length !== 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multiple select questions must have exactly 5 options',
        path: ['options'],
      });
    }

    if (!Array.isArray(data.correct_answers) || data.correct_answers.length < 2 || data.correct_answers.length > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multiple select questions must have 2-3 correct answers',
        path: ['correct_answers'],
      });
    }

    if (Array.isArray(data.options) && Array.isArray(data.correct_answers)) {
      const allInOptions = data.correct_answers.every((answer) => data.options?.includes(answer));
      if (!allInOptions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'All multiple select correct answers must be present in options',
          path: ['correct_answers'],
        });
      }

      if (data.correct_answers.length >= data.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Multiple select question cannot have all options correct',
          path: ['correct_answers'],
        });
      }
    }
  }

  // Validate that matching has at least 2 pairs
  if (data.type === 'matching') {
    if (!data.pairs || data.pairs.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Matching questions must have at least 2 pairs',
        path: ['pairs'],
      });
    }
  }

  // Validate that sequential has items and correct_order
  if (data.type === 'sequential') {
    const itemCount = Array.isArray(data.items) ? data.items.length : 0;

    if (!data.items || itemCount < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sequential questions must have at least 3 items',
        path: ['items'],
      });
    }
    if (!data.correct_order || data.correct_order.length !== itemCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sequential correct_order must match items length',
        path: ['correct_order'],
      });
    }
    // Validate that correct_order contains valid indices
    if (data.correct_order && itemCount > 0) {
      const maxIndex = itemCount - 1;
      const hasInvalidIndex = data.correct_order.some(idx => idx < 0 || idx > maxIndex);
      if (hasInvalidIndex) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sequential correct_order contains invalid indices',
          path: ['correct_order'],
        });
      }
    }
  }

  // Validate that non-sequential questions have an answer payload
  if (data.type !== 'sequential' && data.type !== 'multiple_select' && !data.correct_answer && !data.answer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Question must have a correct_answer',
      path: ['correct_answer'],
    });
  }

  if (data.type === 'flashcard') {
    if (typeof data.question === 'string' && data.question.includes('___')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Flashcard question must not use fill-in-the-blank format',
        path: ['question'],
      });
    }
  }
});

export const aiQuestionArraySchema = z.array(aiQuestionSchema);

export type AIQuestion = z.infer<typeof aiQuestionSchema>;

export const extendQuestionCountSchema = z
  .coerce
  .number()
  .int('Question count must be an integer')
  .min(1, 'Question count must be at least 1')
  .max(200, 'Question count must be 200 or less');
