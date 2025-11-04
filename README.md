# Exam Prepper

Flexible exam preparation web application for Finnish students. Generate AI-powered question sets from study materials and practice with randomized quizzes.

## Features

- **AI-Powered Question Generation**: Upload PDFs, images, or text to generate custom question sets using Claude AI
- **Multiple Subjects**: English (with Math, History, and Society coming soon)
- **Flexible Difficulty**: Four levels from Helppo to Mahdoton
- **Variable Question Counts**: Generate 20-100 questions per set
- **Shareable Codes**: Each question set gets a unique 6-character code
- **Session-Only Progress**: No login required, privacy-focused
- **Multiple Question Types**: Multiple choice, fill-in-the-blank, true/false, and more

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (claude-sonnet-4)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account and project
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd exam-prepper
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Set up Supabase database:
   - Go to your Supabase project
   - Run the migration file from `supabase/migrations/20250103_initial_schema.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
exam-prepper/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── create/            # Create question set
│   │   ├── play/[code]/       # Play by code
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── questions/        # Question renderers
│   │   ├── create/           # Creation flow
│   │   └── play/             # Game flow
│   ├── lib/                  # Utilities and services
│   │   ├── supabase/        # Database queries
│   │   ├── ai/              # AI generation
│   │   └── utils/           # Helper functions
│   ├── config/              # Configuration
│   │   ├── subjects.ts      # Subject definitions
│   │   └── prompts/         # AI prompts
│   └── types/               # TypeScript types
└── supabase/
    └── migrations/          # Database schema
```

## Usage

### Creating a Question Set

1. Click "Luo uusi kysymyssarja"
2. Select subject, grade, and difficulty
3. Choose how many questions to generate (20-100)
4. Upload materials (PDF, images, or text)
5. Submit and wait for AI to generate questions
6. Share the generated code with others

### Playing a Quiz

1. Enter a 6-character code or select from saved sets
2. Answer 15 randomly selected questions
3. Get immediate feedback after each answer
4. View your final score and review answers
5. Play again with a new random selection

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

The app is designed to deploy seamlessly on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy

## Adding New Subjects

1. Update `src/types/questions.ts` to add the subject to the `Subject` type
2. Add configuration in `src/config/subjects.ts`
3. Create a prompt template in `src/config/prompts/[subject].ts`
4. Update the AI generator in `src/lib/ai/questionGenerator.ts`
5. Enable the subject in the config

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
