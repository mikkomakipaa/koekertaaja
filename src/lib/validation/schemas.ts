import { z } from 'zod';

/**
 * Schema for create question set API request
 */
export const createQuestionSetSchema = z.object({
  questionSetName: z
    .string()
    .min(1, 'Question set name is required')
    .max(200, 'Question set name must be 200 characters or less')
    .trim(),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(100, 'Subject must be 100 characters or less')
    .trim(),
  questionCount: z
    .number()
    .int('Question count must be an integer')
    .min(50, 'Minimum 50 questions required')
    .max(200, 'Maximum 200 questions allowed'),
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
});

export type CreateQuestionSetInput = z.infer<typeof createQuestionSetSchema>;

/**
 * Schema for AI-generated questions
 */
export const aiQuestionSchema = z.object({
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question must be 1000 characters or less'),
  type: z.enum([
    'multiple_choice',
    'fill_blank',
    'true_false',
    'matching',
    'short_answer',
  ]),
  options: z.array(z.string()).min(2, 'Multiple choice questions must have at least 2 options').optional(),
  correct_answer: z.union([
    z.string(),
    z.boolean(),
    z.array(z.any()),
  ]),
  acceptable_answers: z.array(z.string()).optional(),
  explanation: z
    .string()
    .min(10, 'Explanation must be at least 10 characters')
    .max(2000, 'Explanation must be 2000 characters or less'),
  pairs: z.array(z.object({
    left: z.string(),
    right: z.string(),
  })).min(1, 'Matching questions must have at least 1 pair').optional(),
}).superRefine((data: any, ctx: z.RefinementCtx) => {
  // Validate that multiple_choice questions have valid options
  if (data.type === 'multiple_choice') {
    if (!data.options || data.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multiple choice questions must have at least 2 options',
        path: ['options'],
      });
    }
  }

  // Validate that matching questions have valid pairs
  if (data.type === 'matching') {
    if (!data.pairs || data.pairs.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Matching questions must have at least 1 pair',
        path: ['pairs'],
      });
    }
  }
});

export const aiQuestionArraySchema = z.array(aiQuestionSchema);

export type AIQuestion = z.infer<typeof aiQuestionSchema>;
