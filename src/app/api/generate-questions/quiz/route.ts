import { NextResponse } from 'next/server';

export const maxDuration = 10;

export async function POST() {
  return NextResponse.json(
    { error: 'Käytä /api/generate-single' },
    { status: 410 }
  );
}
