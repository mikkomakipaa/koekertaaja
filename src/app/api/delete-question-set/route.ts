/**
 * API Route: Delete Question Set
 *
 * Deletes a question set and all its questions (CASCADE)
 * Server-side only to use admin client
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteQuestionSet } from '@/lib/supabase/write-queries';
import { requireAuth } from '@/lib/supabase/server-auth';

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    let user;
    try {
      user = await requireAuth();
      console.log('User authenticated:', user.id);
    } catch (authError) {
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to delete question sets.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questionSetId } = body;

    // Validate input
    if (!questionSetId) {
      console.error('Missing question set ID in request');
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

    console.log('Attempting to delete question set:', questionSetId);

    // Delete the question set
    const success = await deleteQuestionSet(questionSetId);

    if (!success) {
      console.error('Failed to delete question set:', questionSetId);
      return NextResponse.json(
        { error: 'Failed to delete question set. Check server logs for details.' },
        { status: 500 }
      );
    }

    console.log('Successfully deleted question set:', questionSetId);
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
