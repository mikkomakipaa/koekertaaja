# Component Library

**Version**: 1.0
**Last Updated**: 2026-01-25
**Purpose**: Document all UI components used in Koekertaaja

---

## Component Organization

```
src/components/
├── questions/          # Question type renderers
│   ├── MultipleChoice.tsx
│   ├── FillBlank.tsx
│   ├── TrueFalse.tsx
│   ├── Matching.tsx
│   └── ShortAnswer.tsx
├── create/             # Creation flow components
│   ├── SubjectInput.tsx
│   ├── MaterialUpload.tsx
│   ├── ParameterInputs.tsx
│   └── ShareCodeDisplay.tsx
├── play/               # Game flow components
│   ├── ProgressBar.tsx
│   ├── QuestionRenderer.tsx
│   ├── ResultsScreen.tsx
│   ├── BadgeDisplay.tsx
│   └── CelebrationMessage.tsx
├── shared/             # Shared components
│   ├── Footer.tsx
│   ├── LoadByCode.tsx
│   └── ShareCodeDisplay.tsx
└── ui/                 # shadcn/ui primitives
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── modal.tsx
    ├── skeleton.tsx
    └── ...
```

---

## Question Type Components

### 1. MultipleChoice

**Purpose**: Render multiple choice questions with 4 options
**Location**: `src/components/questions/MultipleChoice.tsx`

**Props**:
```tsx
interface MultipleChoiceProps {
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  showExplanation: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  explanation?: string;
}
```

**Features**:
- **Option randomization**: Shuffles options each session (useMemo)
- **Large touch targets**: 48px minimum height
- **Visual feedback**: Green for correct, red for incorrect
- **Keyboard navigation**: Arrow keys + Enter

**Example**:
```tsx
<MultipleChoice
  question="Mikä näistä on oikein?"
  options={['A', 'B', 'C', 'D']}
  onAnswer={(answer) => handleAnswer(answer)}
  showExplanation={answered}
  isCorrect={answer === correctAnswer}
  correctAnswer="B"
  explanation="B on oikein koska..."
/>
```

**States**:
1. **Unanswered**: Default gray buttons
2. **Answered correct**: Selected option green, others disabled
3. **Answered incorrect**: Selected option red, correct option green
4. **Show explanation**: Explanation card appears below

---

### 2. FillBlank

**Purpose**: Fill in the blank with text input
**Location**: `src/components/questions/FillBlank.tsx`

**Props**:
```tsx
interface FillBlankProps {
  question: string;
  onAnswer: (answer: string) => void;
  showExplanation: boolean;
  isCorrect?: boolean;
  correctAnswer?: string | string[];
  explanation?: string;
  grade: 4 | 5 | 6; // For lenient matching
}
```

**Features**:
- **Lenient answer matching**: Grade-based similarity thresholds
- **Auto-focus**: Input focused on mount
- **Enter to submit**: Press Enter to submit answer
- **Visual feedback**: Border color changes (green/red)

**Matching Algorithm**:
```tsx
// Three strategies: exact → contains → fuzzy
1. Exact match (normalized): lowercase, trim, no punctuation
2. Contains match: correct answer substring in user answer
3. Fuzzy match: Levenshtein distance with grade-based threshold
   - Grade 4: 75% similarity
   - Grade 5: 80% similarity
   - Grade 6: 85% similarity
```

**Example**:
```tsx
<FillBlank
  question="Täydennä: Kasvit tarvitsevat _____ valosta energiaa."
  onAnswer={(answer) => handleAnswer(answer)}
  showExplanation={answered}
  isCorrect={checkAnswer(answer)}
  correctAnswer={['fotosynteesin', 'fotosynteesiä']}
  explanation="Fotosynteesin avulla..."
  grade={5}
/>
```

---

### 3. TrueFalse

**Purpose**: Simple true/false question
**Location**: `src/components/questions/TrueFalse.tsx`

**Props**:
```tsx
interface TrueFalseProps {
  question: string;
  onAnswer: (answer: boolean) => void;
  showExplanation: boolean;
  isCorrect?: boolean;
  correctAnswer?: boolean;
  explanation?: string;
}
```

**Features**:
- **Two large buttons**: "Totta" and "Epätotta"
- **Icon indicators**: Checkmark and X icons
- **Clear visual feedback**: Green/red highlighting

**Example**:
```tsx
<TrueFalse
  question="Maa kiertää Aurinkoa."
  onAnswer={(answer) => handleAnswer(answer)}
  showExplanation={answered}
  isCorrect={answer === true}
  correctAnswer={true}
  explanation="Totta! Maa kiertää Aurinkoa 365 päivässä."
/>
```

---

### 4. Matching

**Purpose**: Match pairs (drag or tap to select)
**Location**: `src/components/questions/Matching.tsx`

**Props**:
```tsx
interface MatchingProps {
  question: string;
  pairs: Array<{ left: string; right: string }>;
  onAnswer: (matches: Record<string, string>) => void;
  showExplanation: boolean;
  isCorrect?: boolean;
  explanation?: string;
}
```

**Features**:
- **Tap-based matching**: Tap left item, then right item
- **Visual connections**: Lines drawn between matched pairs
- **Randomized order**: Right column shuffled
- **Clear feedback**: Green for correct pairs, red for incorrect

**Example**:
```tsx
<Matching
  question="Yhdistä sanat niiden käännöksiin"
  pairs={[
    { left: 'Dog', right: 'Koira' },
    { left: 'Cat', right: 'Kissa' },
    { left: 'Bird', right: 'Lintu' }
  ]}
  onAnswer={(matches) => handleAnswer(matches)}
  showExplanation={answered}
  isCorrect={checkMatches(matches)}
  explanation="Oikeat vastaukset: Dog=Koira..."
/>
```

---

### 5. ShortAnswer

**Purpose**: Short text answer with max length
**Location**: `src/components/questions/ShortAnswer.tsx`

**Props**:
```tsx
interface ShortAnswerProps {
  question: string;
  maxLength?: number; // Default: 200
  onAnswer: (answer: string) => void;
  showExplanation: boolean;
  isCorrect?: boolean;
  correctAnswer?: string | string[];
  explanation?: string;
  grade: 4 | 5 | 6;
}
```

**Features**:
- **Character counter**: Shows remaining characters
- **Multi-line input**: Textarea for longer answers
- **Lenient matching**: Same as FillBlank
- **Auto-resize**: Textarea grows with content

**Example**:
```tsx
<ShortAnswer
  question="Selitä lyhyesti, mikä on fotosynteesin?"
  maxLength={200}
  onAnswer={(answer) => handleAnswer(answer)}
  showExplanation={answered}
  isCorrect={checkAnswer(answer)}
  correctAnswer="Fotosynteesin on prosessi, jossa kasvit..."
  explanation="Hyvä vastaus! Fotosynteesin on..."
  grade={5}
/>
```

---

## Game UI Components

### ProgressBar

**Purpose**: Show session progress (questions answered)
**Location**: `src/components/play/ProgressBar.tsx`

**Props**:
```tsx
interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
  mode?: 'quiz' | 'flashcard';
}
```

**Layout**:
```
┌────────────────────────────────────┐
│ Edistyminen            33% valmis  │
│ ████████░░░░░░░░░░░░░░░░░░░░░░     │
└────────────────────────────────────┘
```

**Features**:
- **Mode-aware colors**: Indigo for quiz, teal for flashcards
- **Clear percentage label**: Shows rounded completion percent
- **Accessible progressbar**: ARIA values included on the fill
- **Mobile-optimized**: Compact layout for small screens

**Example**:
```tsx
<ProgressBar
  current={5}
  total={15}
  score={3}
  mode="quiz"
/>
```

---

### BadgeDisplay

**Purpose**: Show badge achievement (unlocked/locked)
**Location**: `src/components/play/BadgeDisplay.tsx`

**Props**:
```tsx
interface BadgeDisplayProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType;
    category: 'milestone' | 'performance' | 'speed' | 'streak' | 'exploration';
  };
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Badge Categories & Icons**:
- **Milestone**: Sparkle (purple-500)
- **Performance**: Star (amber-500)
- **Speed**: Lightning (blue-500)
- **Streak**: Fire (orange-500)
- **Exploration**: Palette (green-500)

**States**:
1. **Unlocked**: Colored icon, colored border, full opacity
2. **Locked**: Gray icon, gray border, 50% opacity

**Example**:
```tsx
<BadgeDisplay
  badge={{
    id: 'first-session',
    name: 'Ensimmäinen Harjoitus',
    description: 'Suoritit ensimmäisen harjoituksen!',
    icon: Sparkle,
    category: 'milestone'
  }}
  unlocked={true}
  size="md"
/>
```

---

### ResultsScreen

**Purpose**: Show session results, badges, personal bests
**Location**: `src/components/play/ResultsScreen.tsx`

**Props**:
```tsx
interface ResultsScreenProps {
  score: number; // 0-100
  totalQuestions: number;
  correctAnswers: number;
  points: number;
  bestStreak: number;
  newBadges: Badge[];
  isPersonalBest: boolean;
  previousBest?: number;
  onPlayAgain: () => void;
  onExit: () => void;
}
```

**Layout**:
```
┌────────────────────────────────────┐
│ 🎉 Hienoa työtä!                   │
│                                    │
│ Tulos: 80% (12/15 oikein)          │
│ 💎 120 pistettä                    │
│ 🔥 Paras putki: 5                  │
│                                    │
│ 🏆 Uusi henkilökohtainen ennätys!  │
│ (Edellinen: 70%)                   │
│                                    │
│ 🎖️ Avatut merkit (3):              │
│ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │  ✨  │ │  ⭐  │ │  🔥  │        │
│ └──────┘ └──────┘ └──────┘        │
│                                    │
│ [Harjoittele uudelleen] [Lopeta]  │
└────────────────────────────────────┘
```

**Features**:
- **Score-based celebration**: Different icons/messages per score range
- **Personal best tracking**: Shows previous best if beaten
- **Badge carousel**: Show new badges with animations
- **Collapsible sections**: Show incorrect answers (optional)

---

### CelebrationMessage

**Purpose**: Dynamic celebration based on score percentage
**Location**: `src/components/play/CelebrationMessage.tsx`

**Props**:
```tsx
interface CelebrationMessageProps {
  scorePercentage: number; // 0-100
}
```

**Score Ranges**:
- **100%**: 🎉 "Täydellinen! Kaikki oikein!" (Confetti icon)
- **80-99%**: 👍 "Hienoa! Melkein täydellinen!" (ThumbsUp icon)
- **60-79%**: 😊 "Hyvin tehty!" (Smiley icon)
- **40-59%**: 💪 "Hyvä yritys! Harjoittele lisää." (Barbell icon)
- **0-39%**: 🌱 "Jatka harjoittelua!" (Plant icon)

**Example**:
```tsx
<CelebrationMessage scorePercentage={85} />
// Renders: 👍 "Hienoa! Melkein täydellinen!"
```

---

## Creation Flow Components

### SubjectInput

**Purpose**: Subject selector with autocomplete
**Location**: `src/components/create/SubjectInput.tsx`

**Props**:
```tsx
interface SubjectInputProps {
  value: string;
  onChange: (subject: string) => void;
  suggestions: string[]; // Predefined subjects
}
```

**Features**:
- **Autocomplete**: Shows matching subjects as you type
- **Custom input**: Can enter any subject (not just predefined)
- **Keyboard navigation**: Arrow keys to select, Enter to confirm

**Example**:
```tsx
<SubjectInput
  value={subject}
  onChange={setSubject}
  suggestions={['Englanti', 'Matematiikka', 'Biologia', 'Historia']}
/>
```

---

### MaterialUpload

**Purpose**: Upload PDF, image, or paste text
**Location**: `src/components/create/MaterialUpload.tsx`

**Props**:
```tsx
interface MaterialUploadProps {
  onUpload: (file: File | string, type: 'pdf' | 'image' | 'text') => void;
  maxSize?: number; // MB, default: 30
}
```

**Features**:
- **Three input methods**: PDF upload, image upload, text paste
- **Drag & drop**: Drop files directly
- **File size validation**: Shows error if exceeds limit
- **Preview**: Shows uploaded filename/text preview

**Layout**:
```
┌────────────────────────────────────┐
│ [PDF] [Kuva] [Teksti] (Tabs)      │
│                                    │
│ Drag & Drop Area                   │
│ ┌────────────────────────────────┐ │
│ │  📄 Lataa PDF tai vedä tähän   │ │
│ │                                │ │
│ │  [Valitse tiedosto]            │ │
│ └────────────────────────────────┘ │
│                                    │
│ Max koko: 30 MB                    │
└────────────────────────────────────┘
```

**Example**:
```tsx
<MaterialUpload
  onUpload={(file, type) => handleUpload(file, type)}
  maxSize={30}
/>
```

---

### ParameterInputs

**Purpose**: Adjust pool size and exam length
**Location**: `src/components/create/ParameterInputs.tsx`

**Props**:
```tsx
interface ParameterInputsProps {
  poolSize: number;
  examLength: number;
  onPoolSizeChange: (size: number) => void;
  onExamLengthChange: (length: number) => void;
}
```

**Features**:
- **Range sliders**: Visual sliders with numeric display
- **Smart defaults**: 100 pool size, 15 exam length
- **Validation**: Pool size ≥ exam length
- **Help text**: Explains what each parameter means

**Example**:
```tsx
<ParameterInputs
  poolSize={100}
  examLength={15}
  onPoolSizeChange={setPoolSize}
  onExamLengthChange={setExamLength}
/>
```

---

### ShareCodeDisplay

**Purpose**: Display shareable codes with copy button
**Location**: `src/components/create/ShareCodeDisplay.tsx`

**Props**:
```tsx
interface ShareCodeDisplayProps {
  codes: Array<{
    code: string;
    difficulty: 'helppo' | 'normaali';
    mode: 'quiz' | 'flashcard';
  }>;
}
```

**Features**:
- **One-click copy**: Clipboard API with success toast
- **Visual grouping**: Group by mode (quiz, flashcard)
- **Difficulty badges**: Color-coded difficulty labels
- **QR codes** (future): Show QR code for mobile scanning

**Layout**:
```
┌────────────────────────────────────┐
│ Kysely-tila                        │
│ ┌────────────────┐  ┌────────────┐ │
│ │ ABC123         │  │ [📋 Kopioi]│ │
│ │ Helppo (100 Q) │  │            │ │
│ └────────────────┘  └────────────┘ │
│ ┌────────────────┐  ┌────────────┐ │
│ │ DEF456         │  │ [📋 Kopioi]│ │
│ │ Normaali (100Q)│  │            │ │
│ └────────────────┘  └────────────┘ │
│                                    │
│ Kortit                             │
│ ┌────────────────┐  ┌────────────┐ │
│ │ GHI789         │  │ [📋 Kopioi]│ │
│ │ Kortit (100 Q) │  │            │ │
│ └────────────────┘  └────────────┘ │
└────────────────────────────────────┘
```

**Example**:
```tsx
<ShareCodeDisplay
  codes={[
    { code: 'ABC123', difficulty: 'helppo', mode: 'quiz' },
    { code: 'DEF456', difficulty: 'normaali', mode: 'quiz' },
    { code: 'GHI789', difficulty: 'normaali', mode: 'flashcard' }
  ]}
/>
```

---

## Shared Components

### LoadByCode

**Purpose**: Input field to load question set by code
**Location**: `src/components/shared/LoadByCode.tsx`

**Props**:
```tsx
interface LoadByCodeProps {
  onSubmit: (code: string) => void;
  loading?: boolean;
}
```

**Features**:
- **Code input**: 6-character uppercase validation
- **Auto-uppercase**: Converts input to uppercase
- **Enter to submit**: Press Enter to submit
- **Loading state**: Disabled during fetch

**Example**:
```tsx
<LoadByCode
  onSubmit={(code) => fetchQuestionSet(code)}
  loading={isFetching}
/>
```

---

### Footer

**Purpose**: App footer with links
**Location**: `src/components/shared/Footer.tsx`

**Features**:
- **Simple links**: GitHub, license, version
- **Sticky footer**: Always at bottom of viewport
- **Dark mode support**: Proper contrast in both modes

**Example**:
```tsx
<Footer />
```

---

## shadcn/ui Primitives

### Button

**Variants**: default, outline, ghost, link
**Sizes**: sm, md (default), lg
**States**: default, hover, active, disabled

```tsx
<Button variant="default" size="md">
  Click me
</Button>
```

### Card

**Parts**: Card, CardHeader, CardTitle, CardContent, CardFooter

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Input

**Types**: text, number, email, password, file
**States**: default, focus, error, disabled

```tsx
<Input
  type="text"
  placeholder="Enter code..."
  className="w-full"
/>
```

### Modal

**Parts**: Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalFooter

```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <ModalContent>
    <ModalHeader>
      <ModalTitle>Title</ModalTitle>
    </ModalHeader>
    <ModalFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

---

## Component Development Guidelines

### Best Practices

1. **TypeScript**: All components must be typed
2. **Dark mode**: Support dark mode via Tailwind classes
3. **Accessibility**: Include ARIA labels, keyboard navigation
4. **Mobile-first**: Test on iPad/iPhone sizes
5. **Performance**: Use React.memo for expensive components
6. **Props validation**: Use TypeScript interfaces, not PropTypes

### Component Template

```tsx
import React from 'react';
import { IconName } from '@phosphor-icons/react';

interface ComponentNameProps {
  prop1: string;
  prop2: number;
  onAction: () => void;
}

export function ComponentName({ prop1, prop2, onAction }: ComponentNameProps) {
  return (
    <div className="component-wrapper">
      {/* Component content */}
    </div>
  );
}
```

### Testing Components

**Unit tests** (Vitest + React Testing Library):
```tsx
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName prop1="test" prop2={42} onAction={() => {}} />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

---

## Future Components

### Planned (Not Yet Implemented)

1. **Toast Notifications**: Success/error messages
2. **Loading Skeleton**: Shimmer effect during loading
3. **QR Code Generator**: For sharing codes
4. **Audio Player**: For pronunciation questions (English)
5. **Image Annotations**: Mark areas on images (future question type)
6. **Spaced Repetition Card**: Flashcard with "Easy/Medium/Hard" buttons

---

**Maintenance**:
- Update this document when adding new components
- Document props, features, and examples
- Include screenshots for complex components
- Keep component examples up to date with actual implementation
