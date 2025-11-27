# Koekertaaja (Exam Prepper)

**Practice for exams and learn new things!** 🚀

Koekertaaja is an interactive exam preparation application that helps students prepare for exams through gamified learning. Upload your study materials, let AI create questions, and earn points with correct answers!

![Made with Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Anthropic Claude](https://img.shields.io/badge/AI-Claude_Sonnet_4-purple)

## ✨ Features

### 🎮 Gamified Learning
- **Points System**: Earn 10 points for each correct answer
- **Streak Bonuses**: Get +5 bonus points when you answer 3+ correct in a row
- **Achievements**: Unlock special badges for perfect scores and long streaks
- **Dynamic Celebrations**: Different celebration animations based on your score
- **Visual Feedback**: See your progress in real-time

### 📚 Question Set Creation
- **AI-Assisted Generation**: Claude Sonnet 4 AI creates questions from your materials
- **Multiple Source Types**: Upload PDFs, images, or write text
- **Automatic Multi-Difficulty Sets**: Creates 3 exam areas (Helppo, Normaali, Vaikea) automatically
- **Flexible Subject Input**: Enter any subject name (English, Math, History, etc.)
- **Adjustable Parameters**:
  - Material question pool: 10-100 questions generated from your materials
  - Exam length: 5-20 questions per difficulty level
- **Shareable Codes**: Each difficulty level gets its own unique 6-character code

### 🎯 Practice
- **Browse Exam Areas**: Browse all available exam areas
- **Progress Tracking**: See your points and current streak
- **Immediate Feedback**: Get explanations after each question
- **Results Summary**: View your overall performance and correct answers
- **Mobile-Friendly**: Works seamlessly on all devices

### 🎨 Modern UI
- **Colorful Gradients**: Energetic teal-purple-pink color scheme
- **Glassmorphism Effects**: Modern semi-transparent elements
- **Star Ratings**: Visual difficulty indicators
- **Responsive**: Optimized for both desktop and mobile
- **Touch-Optimized**: Large touch targets for mobile devices

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
   git clone https://github.com/mikkomakipaa/exam-prepper.git
   cd exam-prepper
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
3. Copy and run the file `supabase/migrations/20250103_initial_schema.sql`
4. This creates the required tables: `question_sets` and `questions`

### Step 4: Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 User Guide

### Creating Exam Areas

1. Click **"Create New Exam Area"** on the home page
2. Enter a **question set name** (e.g., "English Grade 7 - Chapter 3")
3. Enter the **subject** (e.g., English, Math, History)
4. Select **grade level** (optional, 1-12)
5. Set **exam length**: Number of questions per difficulty level (10-50, default 20)
6. Set **question pool size**: Total questions AI generates from material (50-200, default 100)
7. Add **study materials**:
   - Write text in the text field
   - OR upload PDF files
   - OR upload images
8. Click **"Create Question Sets"**
9. Wait for AI to generate questions (may take a few minutes)
10. You'll receive **4 shareable codes** - one for each difficulty level:
    - Helppo (Easy)
    - Normaali (Normal)
    - Vaikea (Hard)
    - Mahdoton (Impossible)

### Practicing

1. Click **"Start Practice"** on the home page
2. Browse **exam areas** and click on the one you want
3. Answer the questions:
   - Select your answer
   - Click **"Check Answer"**
   - Read the explanation and earn points
   - Click **"Next Question"**
4. View your **results**:
   - Total points
   - Best streak
   - Unlocked achievements
   - All answers with explanations
5. Play again or return to menu

### Earning Points

- **10 points** for each correct answer
- **+5 bonus points** when you answer 3 or more correct in a row
- **Achievements**:
  - 🏆 **Perfection** - 100% correct
  - 🔥 **Fire Streak** - 5+ correct in a row

## 🛠️ Technical Details

### Technologies

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Hosting**: Vercel-ready

### Project Structure

```
exam-prepper/
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
│   │   └── prompts/             # AI prompts
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

## 🎨 Color Palette

Koekertaaja uses a modern, energetic color palette:

- **Primary Gradient**: Cyan → Teal → Purple
- **Backgrounds**: Soft cyan-purple-pink gradient
- **Points**: Violet (💎)
- **Streaks**: Orange-Gold (🔥)
- **Success**: Emerald Green (✅)
- **Achievements**: Gold-Amber (🏆)

## 🔐 Security

- **No Login Required**: No personal data collected
- **Public Exam Areas**: Codes are shareable
- **RLS Policies**: Row-level security in Supabase
- **Server-Side API**: API keys not visible in browser
- **No Cookies**: Privacy-first approach

## 📝 License

MIT License - free to use and modify

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

---

Made with ❤️ for learners | [GitHub](https://github.com/mikkomakipaa/exam-prepper)
