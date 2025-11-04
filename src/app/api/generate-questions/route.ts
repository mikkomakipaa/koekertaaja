import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form data
    const subject = formData.get('subject') as Subject;
    const questionCount = parseInt(formData.get('questionCount') as string);
    const questionSetName = formData.get('questionSetName') as string;
    const grade = formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined;
    const topic = formData.get('topic') as string | undefined;
    const subtopic = formData.get('subtopic') as string | undefined;
    const materialText = formData.get('materialText') as string | undefined;

    // Validate required fields (no longer need difficulty from form)
    if (!subject || !questionCount || !questionSetName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process uploaded files
    const files: Array<{ type: string; name: string; data: string }> = [];
    const fileEntries = Array.from(formData.entries()).filter(([key]) =>
      key.startsWith('file_')
    );

    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        files.push({
          type: value.type,
          name: value.name,
          data: base64,
        });
      }
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return NextResponse.json(
        { error: 'Please provide material (text or files)' },
        { status: 400 }
      );
    }

    // Define all difficulty levels
    const difficulties: Difficulty[] = ['helppo', 'normaali', 'vaikea', 'mahdoton'];

    // Calculate questions per difficulty (25% each)
    const questionsPerDifficulty = Math.floor(questionCount / 4);

    // Array to store created question sets
    const createdSets: any[] = [];

    // Generate questions for each difficulty level
    for (const difficulty of difficulties) {
      // Generate questions using AI
      const questions = await generateQuestions({
        subject,
        difficulty,
        questionCount: questionsPerDifficulty,
        grade,
        materialText,
        materialFiles: files.length > 0 ? files : undefined,
      });

      if (questions.length === 0) {
        return NextResponse.json(
          { error: `Failed to generate questions for difficulty: ${difficulty}` },
          { status: 500 }
        );
      }

      // Generate unique code
      let code = generateCode();
      let attempts = 0;
      const maxAttempts = 10;
      let result = null;

      // Ensure code is unique (simple retry logic)
      while (attempts < maxAttempts && !result) {
        result = await createQuestionSet(
          {
            code,
            name: `${questionSetName} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
            subject,
            difficulty,
            grade,
            topic,
            subtopic,
            question_count: questions.length,
          },
          questions
        );

        if (!result) {
          // Code collision, try again
          code = generateCode();
          attempts++;
        }
      }

      if (!result) {
        return NextResponse.json(
          { error: `Failed to create question set for difficulty: ${difficulty}` },
          { status: 500 }
        );
      }

      createdSets.push(result);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdSets.length} question sets across all difficulty levels`,
      questionSets: createdSets.map(set => ({
        code: set.code,
        difficulty: set.questionSet.difficulty,
        questionCount: set.questionSet.question_count,
      })),
      totalQuestions: createdSets.reduce((sum, set) => sum + set.questionSet.question_count, 0),
    });
  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
