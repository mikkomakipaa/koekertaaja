# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flexible exam preparation web application built with Next.js 14, TypeScript, and Supabase. Generates AI-powered question sets from uploaded materials for multiple subjects (starting with English). Uses Anthropic Claude API for question generation and Supabase for permanent storage of question sets.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **UI**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel

### Application Structure
```
src/
├── app/                      # Next.js pages and API routes
│   ├── page.tsx             # Landing/menu
│   ├── create/page.tsx      # Create question set
│   ├── play/[code]/page.tsx # Play quiz by code
│   └── api/generate-questions/route.ts
├── components/              # React components
├── lib/                     # Core logic
│   ├── supabase/           # Database queries
│   ├── ai/                 # Question generation
│   └── utils/              # Helpers
├── config/                 # Subject & prompt configuration
└── types/                  # TypeScript definitions
```

### Data Flow
1. **Question Generation**: Server-side API route receives material → calls Anthropic API → stores in Supabase
2. **Storage**: Permanent storage in Supabase with RLS policies (public read)
3. **Shareable Codes**: 6-character codes for accessing question sets via `/play/{CODE}`
4. **Session State**: Student progress tracked client-side only (not persisted)

### Key Features
- **Multi-Difficulty Set Creation**: Automatically creates 4 question sets (Helppo, Normaali, Vaikea, Mahdoton) from single material upload
- **Flexible Subject Input**: Users can enter any subject name (not limited to predefined list)
- **Configurable Question Generation**:
  - Question pool size: 50-200 questions generated from materials
  - Exam length: 10-50 questions per difficulty level
- **Multiple Question Types**: multiple_choice, fill_blank, true_false, matching, short_answer
- **Subject Extensibility**: Config-driven system for adding subjects (English enabled, Math/History/Society prepared)
- **Multimodal Input**: PDF, images, text files
- **No Authentication**: Code-based sharing only
- **Session-Only Progress**: Student scores not saved to database

## Important Implementation Details

### API Integration
- **Route**: `/api/generate-questions` (POST, server-side)
- **Model**: `claude-sonnet-4-20250514`
- **Max tokens**: 16000
- **Security**: API key stored server-side only (ANTHROPIC_API_KEY)
- **Content types**: Supports text, document (PDF), and image sources
- **Response**: JSON array of questions following strict schema

### Question Types
1. Vocabulary translations (Finnish ↔ English)
2. Grammar rules (fill-in-the-blank with verb forms)
3. Theory questions about grammar rules

### Database Schema (Supabase)

**question_sets table:**
- `id` (uuid), `code` (varchar, unique), `name`, `subject`, `grade`, `difficulty`
- `topic`, `subtopic`, `question_count`, `created_at`, `updated_at`

**questions table:**
- `id`, `question_set_id` (foreign key), `question_text`, `question_type`
- `correct_answer` (jsonb), `options` (jsonb), `explanation`, `image_url`, `order_index`

**RLS**: Public read access enabled, no client-side writes

### Question Schema
```typescript
{
  question: string,          // Question text in Finnish
  type: "multiple_choice",
  options: string[],         // 4 options (shuffled)
  correct_answer: string,
  explanation: string        // Explanation in Finnish
}
```

## Dependencies

The component imports from:
- `react` - Core React hooks
- `@/components/ui/*` - shadcn/ui components (Button, Textarea, Card, Alert)
- `lucide-react` - Icon components

## Environment Variables

Required variables in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anonymous key
ANTHROPIC_API_KEY=                 # Server-side only
NEXT_PUBLIC_APP_URL=               # Optional, for metadata
```

## Localization

All UI text and prompts are in **Finnish**. Questions are asked in Finnish but may contain English vocabulary or grammar elements depending on question type.

## State Management

All state is managed within the component using React `useState`:
- Game flow state machine
- Question data (all questions vs. current playing set)
- User inputs (material, files, answers)
- UI states (loading, errors)

No external state management library is used.

## Development Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
```

## Adding New Subjects

1. Add subject to `Subject` type in `src/types/questions.ts`
2. Add config in `src/config/subjects.ts` with `enabled: true`
3. Create prompt template in `src/config/prompts/[subject].ts`
4. Update `generateQuestions()` in `src/lib/ai/questionGenerator.ts`

## Important Notes

1. **API Costs**: Configurable question pool (50-200) and exam length (10-50) help control costs. Single API call creates all 4 difficulty levels.
2. **Batch Creation**: One material upload creates 4 question sets automatically (one per difficulty level)
3. **API Key Security**: Server-side only via API routes
4. **No Client Writes**: All database writes go through API routes
5. **Session State**: Game progress is client-side React state (not persisted)
6. **Type Safety**: Full TypeScript coverage with strict mode
7. **Question Shuffling**: Options shuffled during generation to prevent memorization
