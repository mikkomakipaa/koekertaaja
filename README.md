# Koekertaaja (Exam Prepper)

**Practice for exams and learn new things!** 🚀

Koekertaaja is an interactive exam preparation application that helps students prepare for exams through gamified learning. Upload your study materials, let AI create questions, and earn points with correct answers!

<img width="571" height="605" alt="image" src="https://github.com/user-attachments/assets/a5efcc2c-0022-42d6-9f1b-e7d3009d7e31" />
<img width="570" height="638" alt="image" src="https://github.com/user-attachments/assets/b320995c-19d5-4867-a35b-7d021b0aafee" />
<img width="566" height="735" alt="image" src="https://github.com/user-attachments/assets/fd8c2b3c-288a-4448-92da-b25926e37c6e" />


![Made with Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Anthropic Claude](https://img.shields.io/badge/AI-Claude_Sonnet_4-purple)


## ✨ Features

### 🎮 Gamified Learning
- **Points System**: Earn 10 points for each correct answer
- **Streak Bonuses**: Get +5 bonus points when you answer 3+ correct in a row
- **Badge System**: Unlock 10+ achievements including:
  - Practice milestones (First session, 5 sessions, 10 sessions, 25 sessions)
  - Performance badges (Perfect score, Beat personal best)
  - Speed achievements (Complete in under 5 minutes)
  - Streak badges (3, 5, and 10 correct in a row)
  - Exploration badges (Try different difficulty levels)
- **Dynamic Celebrations**: Different icons and messages based on your score percentage
- **Visual Feedback**: Real-time progress tracking with color-coded icons
- **Personal Bests**: Track and beat your highest scores per question set

### 📚 Question Set Creation
- **AI-Assisted Generation**: Claude Sonnet 4 AI creates questions from your materials
- **Multiple Source Types**: Upload PDFs, images, or write text
- **Automatic Multi-Difficulty Sets**: Creates 2 exam areas (Helppo, Normaali) automatically
- **Optional Flashcard Generation**: Create a separate flashcard set optimized for memorization
  - **Subject-optimized distributions**: English (60/30/10), Math (70/20/10), Generic (50/30/20)
  - **Active recall focus**: Only fill_blank, short_answer, and matching types
  - **Topic selection**: Choose specific topics to practice
  - **Kid-friendly format**: Clean explanations with memory aids
- **Topic-Balanced Generation**: AI identifies 3-5 topics and distributes questions evenly (~10 cards per topic)
- **Flexible Subject Input**: Enter any subject name (English, Math, History, Biology, etc.)
- **Grade-Specific Distributions**: Question types tailored for grades 4-6
- **Adjustable Parameters**:
  - Material question pool: 40-400 questions generated from your materials
  - Exam length: 5-20 questions per session
- **Shareable Codes**: Each difficulty level gets its own unique 6-character code

### 🎯 Practice
- **Browse Exam Areas**: Browse all available exam areas with grade filtering
- **Balanced Topic Coverage**: Stratified sampling ensures equal coverage of all topics
- **Progress Tracking**: See your points and current streak
- **Immediate Feedback**: Get explanations after each question
- **Results Summary**: View your overall performance and correct answers
- **Flashcard Mode**: Practice with memorization-optimized questions
  - **Topic selection**: Choose "All Topics" or focus on specific areas
  - **Simplified results**: Clean explanation view without redundant information
  - **3D flip animation**: Engaging card flip interaction
  - **Progress tracking**: See how many cards you've reviewed
- **Mobile-Friendly**: Works seamlessly on all devices

### 🎨 Modern UI
- **Dark Mode Support**: Automatic system preference detection with smooth transitions
- **Phosphor Icons**: Beautiful duotone vector icons throughout the app
- **Mobile-First Design**: Optimized for 10-12 year-old students on tablets and phones
- **Accessibility**: WCAG AAA contrast ratios, 48px+ touch targets
- **Responsive Layout**: Seamless experience across all screen sizes
- **Visual Hierarchy**: Clear information organization with color-coded badges
- **Empty States**: Helpful guidance for first-time users

## 🚀 Quick Start (For Non-Technical Users)

### Step 1: Get Required Accounts

1. **Supabase Account** (database):
   - Go to [supabase.com](https://supabase.com)
   - Create a free account
   - Create a new project
   - Note down Project URL and anon public key (found in Settings → API)

2. **Anthropic Account** (AI):
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Create an account and get an API key
   - Note down the API key

### Step 2: Install the Application

1. **Download the code**:
   ```bash
   git clone https://github.com/mikkomakipaa/koekertaaja.git
   cd koekertaaja
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Copy `.env.example` → `.env.local`
   - Open `.env.local` in a text editor
   - Add your Supabase details:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ANTHROPIC_API_KEY=your_anthropic_api_key_here
     ```

### Step 3: Initialize Database

1. Go to your Supabase project
2. Open SQL Editor
3. Run all migration files in order from `supabase/migrations/`:
   - `20250103_initial_schema.sql` - Creates tables
   - `20250104_add_check_constraints.sql` - Adds validation
   - `20250105_update_difficulty_constraint.sql` - Updates difficulty levels
   - `20250106_fix_empty_options.sql` - Fixes data integrity
   - `20250130_add_mode_column.sql` - Adds quiz/flashcard distinction
   - `20250130_add_delete_policies.sql` - Adds RLS policies
   - `20250130_add_topic_to_questions.sql` - Enables topic-balanced selection
4. This creates all required tables, indexes, and security policies

### Step 4: Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Technical Details

### Technologies

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Phosphor Icons (duotone vector icons)
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Hosting**: Vercel-ready with CSP headers

### Project Structure

```
koekertaaja/
├── src/
│   ├── app/                      # Next.js pages
│   │   ├── page.tsx             # Home page
│   │   ├── create/page.tsx      # Create exam area
│   │   ├── play/page.tsx        # Browse exam areas
│   │   ├── play/[code]/page.tsx # Play questions
│   │   └── api/                 # API routes
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── questions/           # Question types
│   │   ├── create/              # Creation flow
│   │   └── play/                # Game flow
│   ├── lib/                     # Services and utilities
│   │   ├── supabase/            # Database queries
│   │   ├── ai/                  # AI generation
│   │   └── utils/               # Helper functions
│   ├── hooks/                   # React hooks
│   │   └── useGameSession.ts    # Game state and points
│   ├── config/                  # Configuration
│   │   ├── subjects.ts          # Subject definitions
│   │   └── prompts/             # AI prompts (quiz + flashcard for each subject)
│   └── types/                   # TypeScript types
└── supabase/
    └── migrations/              # Database schema
```

### Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build

# Production server
npm start
```

## 🚢 Deploy to Vercel

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Vercel project**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables (same as `.env.local`)
   - Click "Deploy"

3. **Done!** Your app is now online

## 🎨 Design System

Koekertaaja uses a cohesive, child-friendly design system:

### Color Palette
- **Primary**: Purple (#a855f7) - App theme and CTAs
- **Points**: Amber (#f59e0b) - Gem/diamond icons
- **Streaks**: Orange (#f97316) - Fire icons
- **Success**: Green (#22c55e) - Correct answers
- **Error**: Red (#ef4444) - Wrong answers
- **Info**: Blue (#3b82f6) - Information and explanations

### Badge Categories
- **Purple**: Practice/Milestone badges (session counts)
- **Gold/Yellow**: Performance badges (perfect scores, personal bests)
- **Blue/Cyan**: Speed badges (fast completion)
- **Green/Emerald**: Exploration badges (trying different levels)
- **Orange/Red**: Streak badges (consecutive correct answers)

### Dark Mode
- Automatic system preference detection
- Optimized color schemes for both modes
- Smooth transitions between modes

## 🔐 Security

- **No Login Required**: No personal data collected
- **Public Exam Areas**: Codes are shareable
- **RLS Policies**: Row-level security in Supabase
- **Server-Side API**: API keys not visible in browser
- **No Cookies**: Privacy-first approach

## 📝 License

This project is licensed under the
Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
See the LICENSE file for details.

## 🤝 Support and Development

- **Issues**: Open an issue on GitHub
- **Questions**: Check documentation or start a discussion
- **Feature Ideas**: Pull requests welcome!

## 🌟 Credits

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Anthropic Claude](https://www.anthropic.com/) - AI model
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Phosphor Icons](https://phosphoricons.com/) - Icon system

---

Made with ❤️ for learners | [GitHub](https://github.com/mikkomakipaa/koekertaaja)
