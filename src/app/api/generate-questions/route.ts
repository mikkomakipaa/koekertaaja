import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { createQuestionSet } from '@/lib/supabase/queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form data
    const subject = formData.get('subject') as Subject;
    const difficulty = formData.get('difficulty') as Difficulty;
    const questionCount = parseInt(formData.get('questionCount') as string);
    const questionSetName = formData.get('questionSetName') as string;
    const grade = formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined;
    const topic = formData.get('topic') as string | undefined;
    const subtopic = formData.get('subtopic') as string | undefined;
    const materialText = formData.get('materialText') as string | undefined;

    // Validate required fields
    if (!subject || !difficulty || !questionCount || !questionSetName) {
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

    // Generate questions using AI
    const questions = await generateQuestions({
      subject,
      difficulty,
      questionCount,
      grade,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique (simple retry logic)
    while (attempts < maxAttempts) {
      const result = await createQuestionSet(
        {
          code,
          name: questionSetName,
          subject,
          difficulty,
          grade,
          topic,
          subtopic,
          question_count: questions.length,
        },
        questions
      );

      if (result) {
        return NextResponse.json({
          success: true,
          code: result.code,
          questionSet: result.questionSet,
          questionCount: questions.length,
        });
      }

      // Code collision, try again
      code = generateCode();
      attempts++;
    }

    return NextResponse.json(
      { error: 'Failed to create question set after multiple attempts' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in generate-questions API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
