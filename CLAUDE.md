# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Koekertaaja** (Exam Prepper) is a Finnish exam preparation web app built with Next.js 14, TypeScript, and Supabase. It uses Anthropic Claude AI to generate question sets from uploaded materials (PDF, images, text) and provides a gamified learning experience with points, streaks, and achievement badges.

**Target Audience**: Primary school students (ages 10-12, grades 4-6)

**Design Philosophy**: Age-appropriate gamification focusing on personal growth over competition. No leaderboards or public rankings - uses achievement badges and personal best tracking to encourage practice without social pressure.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **UI**: Tailwind CSS + shadcn/ui components
- **Icons**: Phosphor Icons (duotone vector icons)
- **Dark Mode**: Automatic system preference detection
- **Validation**: Zod schemas
- **Logging**: Pino with pretty printing
- **Deployment**: Vercel-ready with CSP headers

## Development vs Production Environments

**Status**: The application is now **live in production** (published 2025-11-27).

### Environment Separation

**Production**:
- Live user-facing application
- Stable, tested features only
- Production Supabase database (contains real user-generated question sets)
- Production Vercel deployment
- **DO NOT** make experimental changes directly to production

**Development**:
- Separate Supabase project for testing
- Development branch deployments
- Safe environment for testing new features
- Isolated from production data

### Development Workflow

1. **Always use development environment** for new features and experiments
2. **Environment variables**: Maintain separate `.env.local` files:
   - `.env.local` (development) - points to dev Supabase
   - `.env.production` - points to prod Supabase (used by Vercel)
3. **Testing**: Thoroughly test in dev before merging to main
4. **Database changes**: Test migrations in dev Supabase first
5. **Deployment**: Only merge to main when feature is production-ready

### Required Environment Setup

For development, create a **separate Supabase project** and configure `.env.local`:

```bash
# Development environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=          # Dev Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Dev Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=         # Dev service role key
ANTHROPIC_API_KEY=                 # Shared or separate dev key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production environment variables are configured in **Vercel project settings** (never in code).

### Critical Guidelines

- **Never test experimental features against production database**
- **Always verify which environment you're connected to** before making changes
- **Database migrations**: Apply to dev first, then production after validation
- **Feature flags**: Consider using environment-based feature flags for gradual rollouts
- **Monitoring**: Check production logs/errors regularly via Vercel dashboard

## Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Type checking & linting
npm run typecheck    # TypeScript type checking (REQUIRED before commits)
npm run lint         # ESLint

# Build
npm run build        # Production build
npm start           # Production server
```

## Architecture

### Core Data Flow

1. **Question Generation** (Server-side):
   - User uploads materials via `/create` page
   - Optional: User can select flashcard generation checkbox
   - Frontend sends multipart request to `/api/generate-questions` (POST)
   - API route converts PDFs/images to base64, calls Anthropic Claude API
   - Generates **2 difficulty levels** (Helppo/Normaali) for quiz mode
   - Optional: Generates **1 flashcard set** optimized for memorization
   - Questions stored in Supabase with unique 6-character codes
   - Returns shareable codes for each difficulty level + flashcard set (if requested)

2. **Question Practice** (Client-side):
   - Users access exam area via `/play/[code]` or code input
   - Client fetches question set + questions from Supabase (public read)
   - Game state managed entirely client-side via `useGameSession` hook
   - Points system: 10 per correct, +5 bonus for 3+ streak
   - Badge system tracks achievements in localStorage
   - Personal best scores tracked per question set
   - Session duration tracked for speed badges

3. **Database** (Supabase):
   - `question_sets`: Metadata (code, name, subject, difficulty, grade)
   - `questions`: Question data (text, type, options, correct_answer, explanation)
   - Public read via RLS, server-side writes only
   - Cascade delete: deleting question_set removes all questions

### Directory Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing/menu page
│   ├── create/page.tsx             # Create exam area
│   ├── play/page.tsx               # Browse exam areas
│   ├── play/[code]/page.tsx        # Play questions by code
│   └── api/
│       ├── generate-questions/route.ts  # AI question generation
│       └── delete-question-set/route.ts # Delete exam area
├── components/
│   ├── questions/                  # Question type renderers (MultipleChoice, FillBlank, etc.)
│   ├── create/                     # Creation flow components
│   ├── play/                       # Game flow components (ProgressBar, ResultsScreen)
│   ├── shared/                     # Shared components (Footer, LoadByCode, ShareCodeDisplay)
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── ai/
│   │   ├── anthropic.ts           # Claude API client wrapper
│   │   └── questionGenerator.ts   # Question generation logic
│   ├── supabase/
│   │   ├── client.ts              # Supabase client (public access)
│   │   ├── admin.ts               # Supabase admin (service role)
│   │   ├── queries.ts             # Read operations
│   │   └── write-queries.ts       # Write operations
│   ├── utils/
│   │   ├── codeGenerator.ts       # 6-char code generation
│   │   └── shuffleArray.ts        # Fisher-Yates shuffle
│   ├── validation/schemas.ts       # Zod schemas for API validation
│   ├── logger.ts                   # Pino logger setup
│   └── ratelimit.ts                # Rate limiting logic
├── config/
│   ├── subjects.ts                 # Subject definitions
│   └── prompts/                    # AI prompts per subject
│       ├── english.ts              # Quiz prompts with grade-specific distributions
│       ├── math.ts                 # Math quiz prompts with grade-specific distributions
│       ├── generic.ts              # Generic quiz prompts for all other subjects
│       ├── english-flashcards.ts   # Flashcard-optimized prompts (60/30/10)
│       ├── math-flashcards.ts      # Math flashcard prompts (70/20/10)
│       └── generic-flashcards.ts   # Generic flashcard prompts for content subjects (50/30/20)
├── hooks/
│   ├── useGameSession.ts           # Game state: points, streaks, answers
│   └── useBadges.ts                # Badge tracking with localStorage
└── types/
    ├── questions.ts                # Core type definitions
    └── database.ts                 # Database type parsers
```

### Key Implementation Details

**Question Types**:
- `multiple_choice`: 4 options, 1 correct
- `fill_blank`: Text input with acceptable answers
- `true_false`: Boolean choice
- `matching`: Pairs to match
- `short_answer`: Text input with max length

**Question Generation**:
- Configurable pool size: 40-400 questions generated from materials (default: 100)
- Configurable exam length: 5-20 questions per session (default: 15)
- **Dual-mode generation**:
  - **Quiz mode**: 2 difficulty levels (Helppo/Normaali) with grade-specific question type distributions
  - **Flashcard mode**: Optional, single set optimized for memorization and active recall
- **Topic-balanced generation** (NEW):
  - AI analyzes material and identifies 3-5 high-level topics
  - Questions distributed evenly across all identified topics
  - Each question tagged with its primary topic (stored in `questions.topic` column)
  - Example: Material covering grammar, vocabulary, reading → ~33% questions per topic
  - High-level topics (not detailed): "Grammar" vs "Grammar - Past Tense"
- Grade-specific distributions (4-6):
  - Grade 4: More basic question types (60% multiple_choice in helppo)
  - Grade 5: Balanced mix (50% multiple_choice in helppo, 35% in normaali)
  - Grade 6: More open-ended (45% multiple_choice in helppo, 25% + 40% fill_blank in normaali)
- **Flashcard optimization**:
  - **English**: 60% fill_blank, 30% short_answer, 10% matching
  - **Math**: 70% fill_blank, 20% matching, 10% short_answer
  - **Generic (content subjects)**: 50% fill_blank, 30% short_answer, 20% matching
  - **Kid-friendly prompts**: Clean markdown format with positive-only instructions
  - **Excludes**: multiple_choice, true_false, sequential (passive recognition)
  - **Focus**: Active recall, memorization techniques, clear explanations
  - **Topic selection**: Users can choose specific topics to practice
  - **Simplified UI**: Result view shows only explanation (no redundant answer display)
  - Also uses topic-balanced generation (~10 cards per topic)
- Subject-specific prompts: `src/config/prompts/{subject}.ts`
- Multimodal: Supports PDF (document type) and images
- Response validated with Zod schemas (graceful failure: accepts 70%+ valid questions)
- Options shuffled during generation to prevent memorization

**Game Session** (`useGameSession` hook):
- **Stratified sampling** for balanced topic coverage:
  - Groups questions by topic
  - Samples evenly from each topic (e.g., 5 from each of 3 topics for 15-question session)
  - Graceful fallback: Uses random sampling if <70% questions have topics
  - Works for both quiz and flashcard modes
- Shuffles questions at session start
- Tracks: points, current streak, best streak, answers
- Points: 10 per correct + 5 bonus when streak ≥ 3
- All state is client-side React (not persisted)

**Badge System** (`useBadges` hook):
- 11 achievement badges stored in localStorage
- Badge categories:
  - **Practice milestones**: 1st, 5th, 10th, 25th session completed
  - **Performance**: Perfect score, beat personal best
  - **Speed**: Complete session under 5 minutes
  - **Streaks**: 3, 5, or 10 correct answers in a row
  - **Exploration**: Try both difficulty levels
- Personal best scores tracked per question set (localStorage)
- Session duration tracking for speed-based achievements
- Age-appropriate: No leaderboards, no public comparison
- All badges displayed on results screen (unlocked/locked states)

**Security**:
- CSP headers configured in `next.config.js`
- API keys server-side only (never exposed to client)
- RLS enabled on Supabase tables (public read, server writes)
- Input validation via Zod schemas
- Rate limiting on expensive endpoints

**Localization**:
- All UI text in **Finnish**
- Questions/explanations in Finnish
- English vocabulary/grammar for English subject

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=         # Server-side writes
ANTHROPIC_API_KEY=                 # Server-side only
NEXT_PUBLIC_APP_URL=               # Optional, for metadata
```

## Database Schema

Run `supabase/migrations/20250103_initial_schema.sql` in Supabase SQL Editor.

**Tables**:
- `question_sets`: id (uuid), code (unique 6-char), name, subject, grade, difficulty, topic, subtopic, question_count, timestamps
- `questions`: id (uuid), question_set_id (fk), question_text, question_type, correct_answer (jsonb), options (jsonb), explanation, image_url, order_index, created_at

**Indexes**: code, subject, created_at, question_set_id, order_index

**RLS**: Public read enabled, no client writes

## Adding New Subjects

1. Add config in `src/config/subjects.ts` with `enabled: true`
2. Create quiz prompt template in `src/config/prompts/{subject}.ts` with grade-specific distributions
3. Create flashcard prompt template in `src/config/prompts/{subject}-flashcards.ts` (optional)
4. Update `generateQuestions()` in `src/lib/ai/questionGenerator.ts` to import and route both prompts
5. Consider question type distributions appropriate for the subject (math uses more fill_blank, languages may use more matching)

## Recent Features & Improvements

### Topic-Balanced Question Generation & Selection (2025-11-30)
- **Problem**: Random question selection could result in unbalanced coverage (e.g., 12 grammar + 3 vocabulary)
- **Solution**: AI identifies topics during generation, stratified sampling ensures balanced selection
- **Implementation**:
  - Added `topic TEXT` column to `questions` table (nullable)
  - Updated all prompts (quiz + flashcard) with topic identification instructions
  - AI generates 3-5 high-level topics and tags each question
  - `useGameSession` hook implements stratified sampling algorithm
  - Equal distribution across topics (e.g., 15 questions = 5 per topic for 3 topics)
- **Benefits**:
  - Fair assessment across all topics
  - Better learning outcomes (students practice all areas)
  - Foundation for future topic-specific practice modes
  - Works seamlessly for both quiz and flashcard modes
- **Graceful fallback**: If <70% questions tagged, falls back to random sampling
- **Migration**: `20250130_add_topic_to_questions.sql`

### Flashcard Optimization (2025-11-30)
- **Optional flashcard generation**: Purple checkbox in create form
- **Memorization-focused**: Excludes passive question types (multiple_choice, true_false)
- **Active recall optimization**:
  - English: 60% fill_blank + 30% short_answer + 10% matching
  - Math: 70% fill_blank + 20% matching + 10% short_answer
- **Separate prompts**: Dedicated flashcard prompt files with memory techniques
- **Single set per topic**: Named "Topic - Kortit", stored as normaali difficulty
- **Enhanced explanations**: Step-by-step solutions, memory aids, examples
- **Dual-mode architecture**: `mode: 'quiz' | 'flashcard'` in question generator

### Grade-Specific Question Distributions (2025-11-30)
- **Difficulty progression**: Higher grades get more open-ended questions
- **Per-grade distributions**: Grades 4-6 each have unique question type percentages
- **Easy to modify**: `GRADE_DISTRIBUTIONS` constant at top of each prompt file
- **Curriculum-aligned**: Based on Finnish national curriculum requirements
- **Visual differentiation**: Color-coded grade badges (pink→purple spectrum)
- **Grade filtering**: Filter question sets by grade on play page

### UX/UI Improvements (2025-11-29)

### Dark Mode Implementation
- **Automatic detection**: Respects system `prefers-color-scheme` setting
- **CSS variables**: Full dark theme palette in `globals.css`
- **Component coverage**: All pages and components support dark mode
- **Color optimization**: Adjusted text contrast for WCAG AAA compliance
- **Smooth transitions**: `transition-colors` class for seamless mode switching

### Phosphor Icons Migration
- **Replaced emojis**: All emojis replaced with Phosphor vector icons
- **Icon categories**:
  - Points: `<DiamondsFour />` (duotone, amber)
  - Streaks: `<Fire />` (duotone, orange)
  - Badges: Category-specific icons (Sparkle, Star, Fire, Barbell, Target, Rocket, Lightning, Palette)
  - Subjects: GlobeHemisphereWest, MathOperations, Scroll, Bank
  - Celebrations: Sparkle, Star, Confetti, ThumbsUp, Barbell
- **Duotone weight**: Primary style for depth and visual interest
- **Color coding**: Semantic colors match icon meaning
- **Bundle size**: ~5-7KB (tree-shaken)

### Mobile-First UX Enhancements
- **Badge grid optimization**: 2 columns on mobile (320px) for better touch targets
- **Stats bar hierarchy**: Question progress prominent, points/streak secondary
- **Touch targets**: Minimum 48px for all interactive elements
- **Text sizes**: Increased for readability on small screens (text-lg, text-xl)
- **Empty states**: Helpful guidance for first-time users
- **Play page metadata**: Labeled badges (Grade, Aihealue) with clear visual hierarchy

### Accessibility Improvements
- **WCAG AAA compliance**: Enhanced text contrast in dark mode
- **Explicit text colors**: `text-gray-900 dark:text-gray-100` on all text elements
- **ARIA labels**: Added to icon buttons and emojis
- **Focus states**: Maintained keyboard navigation support
- **Reduced cognitive load**: Simplified results screen, show only incorrect answers by default

### Visual Design Refinements
- **Badge color categories**: Color-coded by achievement type (purple, gold, blue, green, orange)
- **Collapsible sections**: Badges section toggleable on results screen
- **Consistent spacing**: Standardized padding and gaps across components
- **Branded icons**: Phosphor icons create cohesive visual language

## Important Notes

- **Type safety**: Always run `npm run typecheck` before committing
- **API costs**: Configurable question pool and exam length help control costs
- **Batch creation**: One upload creates 2 difficulty levels automatically
- **Security**: Never commit `.env.local` or expose API keys
- **Session state**: Game progress is ephemeral (not saved to database)
- **Badge persistence**: Stored locally via localStorage (no server sync)
- **Code generation**: Uses crypto.randomBytes for 6-character codes (A-Z0-9)
- **Question shuffling**: Applied at session start via Fisher-Yates algorithm
- **File uploads**: 30MB limit set in `next.config.js` for server actions
- **Age-appropriate design**: No leaderboards or public rankings for 10-12 year olds
