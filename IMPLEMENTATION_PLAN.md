# Exam Prepper - Implementation Plan

## Overview
Flexible exam preparation web application for Finnish students (grades 4-6), starting with English language, expandable to Math, History, and Society subjects.

## Core Requirements
- No authentication required
- Link/code sharing for question sets
- Session-only student progress (not stored)
- Variable question count (user-defined)
- Multi-subject support (starting with English)
- Difficulty levels: Helppo, Normaali, Vaikea, Mahdoton
- Clean URLs: `/play/ABC123`
- Deploy: GitHub + Vercel + Supabase

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Deployment**: Vercel
- **Storage**: Supabase (question sets only)

## Architecture

### Database Schema (Supabase)

```sql
-- Question Sets
CREATE TABLE question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade INTEGER,
  difficulty VARCHAR(20) NOT NULL,
  topic TEXT,
  subtopic TEXT,
  question_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX idx_question_sets_code ON question_sets(code);
CREATE INDEX idx_question_sets_subject ON question_sets(subject);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  correct_answer JSONB NOT NULL,
  options JSONB,
  explanation TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_set_id ON questions(question_set_id);

-- RLS Policies (all public read, no write from client)
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON question_sets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON questions FOR SELECT USING (true);
```

### Project Structure

```
exam-prepper/
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── README.md
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
│
├── public/
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                      # Landing/menu
│   │   ├── create/
│   │   │   └── page.tsx                  # Create question set
│   │   ├── play/
│   │   │   └── [code]/
│   │   │       └── page.tsx              # Play by code
│   │   └── api/
│   │       └── generate-questions/
│   │           └── route.ts              # Server-side AI generation
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── alert.tsx
│   │   │   └── ...
│   │   ├── questions/
│   │   │   ├── QuestionRenderer.tsx      # Main renderer
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── FillBlank.tsx
│   │   │   ├── TrueFalse.tsx
│   │   │   └── Matching.tsx
│   │   ├── create/
│   │   │   ├── MaterialUpload.tsx
│   │   │   ├── SubjectSelector.tsx
│   │   │   ├── DifficultySelector.tsx
│   │   │   ├── GradeSelector.tsx
│   │   │   └── QuestionCountSelector.tsx
│   │   ├── play/
│   │   │   ├── GameScreen.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ResultsScreen.tsx
│   │   └── shared/
│   │       ├── ShareCodeDisplay.tsx
│   │       ├── LoadByCode.tsx
│   │       └── Header.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Supabase browser client
│   │   │   ├── server.ts                 # Supabase server client
│   │   │   └── queries.ts                # Database queries
│   │   ├── ai/
│   │   │   ├── anthropic.ts              # Anthropic API wrapper
│   │   │   └── questionGenerator.ts      # Question generation logic
│   │   ├── utils/
│   │   │   ├── codeGenerator.ts          # 6-char code generation
│   │   │   ├── shuffleArray.ts
│   │   │   └── fileProcessor.ts          # Handle PDF/image uploads
│   │   └── validation/
│   │       └── questionSet.ts            # Validation schemas (zod)
│   │
│   ├── config/
│   │   ├── subjects.ts                   # Subject definitions
│   │   └── prompts/
│   │       ├── english.ts                # English prompt template
│   │       ├── math.ts                   # Future
│   │       ├── history.ts                # Future
│   │       └── society.ts                # Future
│   │
│   ├── types/
│   │   ├── database.ts                   # Supabase generated types
│   │   ├── questions.ts                  # Question type definitions
│   │   └── index.ts
│   │
│   └── hooks/
│       ├── useQuestionSet.ts
│       ├── useGameSession.ts
│       └── useQuestions.ts
│
└── supabase/
    ├── migrations/
    │   └── 20250103_initial_schema.sql
    └── seed.sql
```

## Type Definitions

```typescript
// src/types/questions.ts

export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'true_false'
  | 'matching'
  | 'short_answer';

export type Subject = 'english' | 'math' | 'history' | 'society';

export type Difficulty = 'helppo' | 'normaali' | 'vaikea' | 'mahdoton';

export interface BaseQuestion {
  id: string;
  question_set_id: string;
  question_text: string;
  question_type: QuestionType;
  explanation: string;
  image_url?: string;
  order_index: number;
}

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

export interface MatchingQuestion extends BaseQuestion {
  question_type: 'matching';
  pairs: Array<{ left: string; right: string }>;
}

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | MatchingQuestion;

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
}

export interface GameSession {
  questionSetCode: string;
  questions: Question[];
  currentIndex: number;
  answers: Answer[];
  score: number;
  startedAt: Date;
}

export interface Answer {
  questionId: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  explanation: string;
}
```

## User Flows

### Flow 1: Create Question Set
1. User lands on home page
2. Clicks "Luo uusi kysymyssarja"
3. Selects subject (English for MVP)
4. Selects grade (4 or 6)
5. Selects difficulty
6. Inputs question count (20-100)
7. Names the set
8. Uploads materials OR pastes text
9. Submits → API generates questions via Claude
10. Questions saved to Supabase with unique code
11. User sees shareable code and "Play now" button

### Flow 2: Play by Code
1. User visits `/play/ABC123` or enters code on home
2. System loads question set from Supabase
3. System randomly selects N questions (configurable, default 15)
4. User answers questions sequentially
5. Immediate feedback after each answer
6. Final results screen with score
7. Option to play again (new random selection) or return home
8. No data saved to database

### Flow 3: Browse Saved Sets (Future)
- Not in MVP, but architecture supports it

## API Routes

### POST /api/generate-questions
Server-side endpoint to call Anthropic API securely.

**Request:**
```typescript
{
  subject: Subject;
  grade: number;
  difficulty: Difficulty;
  questionCount: number;
  material: {
    text?: string;
    files?: File[];  // PDFs, images
  };
}
```

**Response:**
```typescript
{
  questions: Question[];
  metadata: {
    questionCount: number;
    tokensUsed: number;
  };
}
```

## Subject Configuration

```typescript
// src/config/subjects.ts

export const SUBJECTS = {
  english: {
    id: 'english',
    name: 'Englanti',
    icon: '🇬🇧',
    enabled: true,
    questionTypes: ['multiple_choice', 'fill_blank', 'true_false', 'matching'],
    defaultQuestionCount: 50,
    maxQuestionCount: 100,
    supportedMaterials: ['pdf', 'text', 'image'],
  },
  math: {
    id: 'math',
    name: 'Matematiikka',
    icon: '🔢',
    enabled: false, // Future
    questionTypes: ['multiple_choice', 'fill_blank', 'short_answer'],
    requiresLatex: true,
  },
  // ... etc
} as const;
```

## AI Prompt Strategy

Each subject has a dedicated prompt template with:
- Subject-specific instructions
- Grade-appropriate language
- Difficulty level guidelines
- Question type distribution
- Finnish UI language requirements
- JSON schema for responses

## Environment Variables

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Phases

### Phase 1: Foundation (Current)
- [ ] Next.js project setup
- [ ] Supabase schema and connection
- [ ] Type definitions
- [ ] Subject configuration
- [ ] Basic UI components

### Phase 2: Question Creation
- [ ] Material upload component
- [ ] AI question generation API
- [ ] Question set creation flow
- [ ] Code generation and storage

### Phase 3: Gameplay
- [ ] Load by code functionality
- [ ] Question renderer (multiple choice first)
- [ ] Game session state management
- [ ] Results screen

### Phase 4: Polish & Deploy
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] Vercel deployment
- [ ] Testing

### Phase 5: Expand (Future)
- [ ] Additional question types
- [ ] Math, History, Society subjects
- [ ] Browse/search functionality
- [ ] Progress tracking (if needed)

## Next Steps
1. Initialize Next.js project with TypeScript
2. Set up Supabase project and run migrations
3. Configure shadcn/ui components
4. Build subject configuration system
5. Create type definitions
6. Implement question creation flow
7. Build gameplay experience
8. Deploy to Vercel
