/**
 * API Route: Delete Question Set
 *
 * Deletes a question set and all its questions (CASCADE)
 * Server-side only to use admin client
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteQuestionSet } from '@/lib/supabase/write-queries';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionSetId } = body;

    // Validate input
    if (!questionSetId) {
      return NextResponse.json(
        { error: 'Question set ID is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    // Delete the question set
    const success = await deleteQuestionSet(questionSetId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete question set. Check server logs for details.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete-question-set API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
