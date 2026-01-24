# User Journey Maps

**Version**: 1.0
**Last Updated**: 2026-01-18
**Purpose**: Map critical user journeys to identify friction points and optimization opportunities for Koekertaaja

---

## Overview

User journeys document the step-by-step experience users have when accomplishing key tasks. Each journey includes:
- **Steps**: Actions the user takes
- **Touchpoints**: Where the interaction happens (app, device, browser)
- **Thoughts**: What the user is thinking
- **Emotions**: How the user feels
- **Pain Points**: Frustrations or blockers
- **Opportunities**: Where we can improve

---

## Journey 1: Teacher Creates First Question Set (Activation)

**Actor**: Maria (Supportive Teacher persona)
**Goal**: Upload textbook material and generate practice questions for students
**Success Metric**: Teacher creates question set + shares code with students within 10 minutes
**Duration**: 5-10 minutes (first time), 3-5 minutes (subsequent)

### Journey Map

| Step | Action | Touchpoint | Thoughts | Emotions | Pain Points | Opportunities |
|------|--------|------------|----------|----------|-------------|---------------|
| **1** | Opens Koekertaaja website | Laptop browser (home) | "Let me try this AI question generator" | 🙂 Curious | None yet | Clear value proposition on landing page |
| **2** | Clicks "Luo tenttiavlue" | Landing page | "Looks simple enough" | 🙂 Confident | None | Good - prominent CTA |
| **3** | Enters subject and grade | Create form | "Grade 5 English, that's what I teach" | 😊 Satisfied | None | Auto-suggestions help |
| **4** | Chooses to upload PDF | Create form | "I'll upload chapter 4 from the textbook" | 🙂 Focused | None | Multiple input options (PDF, image, text) |
| **5** | Selects PDF file (textbook chapter) | File picker | "This should cover past tense verbs" | 😐 Slightly anxious | File size warning (30MB limit) | Add progress indicator during upload |
| **6** | Waits for file upload (5 seconds) | Create form | "Is it working?" | 😐 Waiting | No visual feedback during upload | Add loading spinner + upload progress |
| **7** | Adjusts pool size (default 100 OK) | Create form | "100 questions sounds good" | 🙂 Confident | None | Smart defaults work well |
| **8** | Adjusts exam length (default 15 OK) | Create form | "15 questions per session is perfect" | 🙂 Satisfied | None | Smart defaults work well |
| **9** | Checks flashcard checkbox | Create form | "Yes, I want flashcards too" | 😊 Pleased | None | Good - optional feature clearly explained |
| **10** | Clicks "Luo kysymykset" | Create form | "Let's see what it creates..." | 😐 Anxious | None | Clear CTA |
| **11** | Sees loading screen "AI luo kysymyksiä..." | Loading page | "This is taking a while..." | 😟 Worried | 20-30 second wait feels long | Add progress messages ("Analyzing material...", "Creating questions...") |
| **12** | Sees success page with 3 codes | Results page | "It worked! 3 different sets!" | 😊 Relieved | None | Great - instant value |
| **13** | Reviews example questions | Results page | "These look good enough to share" | 😊 Satisfied | Can't edit questions before sharing | Future: Preview + edit mode |
| **14** | Copies "Helppo" code | Results page | "I'll share the easy one with struggling students" | 🙂 Focused | Manual copy-paste (no "copy" button) | Add one-click copy button |
| **15** | Posts code in Google Classroom | Google Classroom | "Done! Students can practice now." | 😊 Accomplished | Switching between apps | Future: Google Classroom integration |
| **16** | Shares code with Emma's mom via email | Email | "Emma's mom asked for extra practice" | 🙂 Helpful | None | Good - shareable codes work across contexts |

### Critical Moments

**Critical Moment 1: Step 11** - AI Generation Wait Time
- **Risk**: Teacher abandons if wait feels too long (high drop-off risk)
- **Intervention**:
  - Add progress messages ("Analyzing material...", "Identifying topics...", "Generating questions...")
  - Show estimated time remaining (e.g., "About 20 seconds left...")
  - Display fun facts about learning while waiting
- **Success Criteria**: <10% abandon rate during generation

**Critical Moment 2: Step 13** - Question Quality Check
- **Risk**: Teacher shares low-quality questions with students (damages trust)
- **Intervention**:
  - Show 3-5 example questions before generating full set
  - Add "Preview all questions" link
  - Future: Allow editing before finalizing
- **Success Criteria**: >90% teacher satisfaction with question quality

### Emotions Over Time

```
😊 Satisfied     |    ╱──╲       ╱────╲
😐 Neutral       | ╱──╯  ╰─────╯      ╲─╮
😕 Frustrated    |╯                     ╰─
😟 Anxious       |        ╲
                 └────────────────────────
                  1  3  5  7  9  11 13 15
                        Steps
```

**Emotion Peaks**:
- **High**: Steps 3-4 (easy setup), 12 (success), 14-16 (sharing)
- **Low**: Steps 5-6 (upload anxiety), 11 (long wait)

### Improvement Opportunities

| Opportunity | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Progress messages during generation | High | Low | **P0** |
| One-click copy button for codes | Medium | Low | **P1** |
| Upload progress indicator | Medium | Low | **P1** |
| Preview questions before finalizing | High | High | **P2** |
| Google Classroom integration | Low | Very High | **P3** |

---

## Journey 2: Student Practices Questions (Core Usage)

**Actor**: Emma (Eager Learner persona)
**Goal**: Practice English vocabulary using teacher's question set
**Success Metric**: Complete session + feel motivated to practice again
**Duration**: 10-15 minutes per session

### Journey Map

| Step | Action | Touchpoint | Thoughts | Emotions | Pain Points | Opportunities |
|------|--------|------------|----------|----------|-------------|---------------|
| **1** | Opens Koekertaaja on iPad | Safari (iPad) | "Mom said I should practice English" | 😐 Neutral | None | Good - works on mobile |
| **2** | Taps "Pelaa" button | Landing page | "Where do I enter the code?" | 🙂 Curious | None | Clear navigation |
| **3** | Enters code from Google Classroom | Play page | "Let me type: ABC123" | 🙂 Focused | Code input could be easier (manual typing) | Future: QR code scanning |
| **4** | Sees question set details | Code input result | "Grade 5 English - Helppo. Perfect!" | 😊 Confident | None | Good - shows difficulty/subject |
| **5** | Taps "Aloita harjoittelu" | Question set page | "Let's try it!" | 😊 Excited | None | Good - clear CTA |
| **6** | Reads first question (multiple choice) | Question 1/15 | "This looks easy!" | 😊 Confident | None | Good - starts easy |
| **7** | Taps answer option B | Question UI | "I think it's B..." | 😐 Thinking | None | Good - large touch targets |
| **8** | Sees green checkmark + explanation | Feedback | "Yay! I got it right!" | 😊 Happy | None | Instant feedback works great |
| **9** | Sees points +10, streak 1 | Progress bar | "Cool, I got 10 points!" | 😊 Motivated | None | Gamification working |
| **10** | Answers questions 2-4 correctly | Questions 2-4 | "I'm on a streak!" | 😊 Excited | None | Streak bonus engaging |
| **11** | Answers question 5 incorrectly | Question 5 | "Oh no, I got it wrong..." | 😕 Disappointed | Feels bad about breaking streak | Soften negative feedback |
| **12** | Reads explanation for wrong answer | Feedback | "Oh, I see why it's wrong" | 🙂 Learning | None | Good - explanations help |
| **13** | Continues through questions 6-10 | Questions 6-10 | "I'm getting better!" | 😊 Confident | None | Good rhythm established |
| **14** | Finishes question 15 | Question 15 | "That was fun!" | 😊 Satisfied | None | Good - 15 questions is right length |
| **15** | Sees results screen (80% correct) | Results page | "I got 80%! That's good!" | 😊 Proud | None | Positive framing |
| **16** | Sees badges unlocked (3 new!) | Results page | "Whoa, I unlocked 3 badges!" | 😊 Excited | None | Badge system very motivating |
| **17** | Sees personal best (first session) | Results page | "This is my personal best so far!" | 😊 Accomplished | None | Personal best tracking works |
| **18** | Taps "Harjoittele uudelleen" | Results page | "Let me try to beat my score!" | 😊 Motivated | None | Great - encourages repeat practice |

### Critical Moments

**Critical Moment 1: Step 11** - First Wrong Answer
- **Risk**: Student feels discouraged and quits (medium drop-off risk)
- **Intervention**:
  - Use neutral/encouraging language ("Let's learn together!")
  - Show "You got 4 in a row correct! Great job so far!"
  - Emphasize learning opportunity, not failure
- **Success Criteria**: <15% abandon rate after first wrong answer

**Critical Moment 2: Step 16** - Badge Unlocking
- **Risk**: If badges don't unlock, students lose motivation
- **Intervention**:
  - Ensure badge criteria are achievable (not too hard)
  - Show progress toward next badge ("2 more sessions for next badge!")
  - Celebrate unlocked badges with animations and sounds
- **Success Criteria**: >80% of students unlock ≥1 badge in first session

### Emotions Over Time

```
😊 Happy         | ╱──╲  ╱────────────╲
😐 Neutral       |╯    ╲╯             ╰─╮
😕 Disappointed  |      ╲                ╰
                 └────────────────────────
                  1  3  5  7  9  11 13 15 17
                        Steps
```

**Emotion Peaks**:
- **High**: Steps 6-10 (early success), 16-18 (results + badges)
- **Low**: Step 11 (wrong answer disappointment)

### Improvement Opportunities

| Opportunity | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Soften negative feedback for wrong answers | High | Low | **P0** |
| Show progress toward next badge | Medium | Medium | **P1** |
| QR code scanning for easier code entry | Medium | Medium | **P2** |
| Sound effects for correct answers | Low | Low | **P2** |
| Celebration animations for badges | Medium | Medium | **P2** |

---

## Journey 3: Parent Helps Student Practice (Support Flow)

**Actor**: Mikko (Involved Parent persona)
**Goal**: Help Emma practice for upcoming English test
**Success Metric**: Emma practices independently while Mikko helps younger child
**Duration**: 30-45 minutes (including setup + practice + review)

### Journey Map

| Step | Action | Touchpoint | Thoughts | Emotions | Pain Points | Opportunities |
|------|--------|------------|----------|----------|-------------|---------------|
| **1** | Asks Emma to practice English | Kitchen | "Emma, you have a test Friday. Practice on your iPad." | 😐 Routine | None | Good - iPad already approved |
| **2** | Emma opens Koekertaaja | iPad (living room) | "Does she need help?" | 🙂 Observing | None | Good - Emma knows the app |
| **3** | Emma enters code | iPad | "She remembers the code from class" | 😊 Pleased | None | Good - no parental help needed |
| **4** | Emma starts practicing | iPad | "Great, she's doing it herself!" | 😊 Relieved | Can't see Emma's progress | Future: Parent dashboard |
| **5** | Helps younger son with homework | Dining table | "Perfect, I can focus on Aaro now" | 😊 Productive | None | App enables multitasking |
| **6** | Hears Emma groan "Oh no!" | Living room | "Did she get frustrated?" | 😟 Concerned | Can't see what happened | Real-time progress monitoring |
| **7** | Checks on Emma | Living room | "How's it going?" | 😐 Checking | Interrupting Emma's flow | Non-intrusive progress check |
| **8** | Emma shows iPad screen (75% done) | iPad | "Almost done, Dad! I got 9 right so far!" | 😊 Proud | None | Good - Emma self-reports progress |
| **9** | Returns to helping son | Dining table | "She's doing great on her own" | 😊 Satisfied | None | Independent practice working |
| **10** | Emma finishes session | Living room | "I'm done! I got 3 badges!" | 😊 Excited | None | Badge motivation working |
| **11** | Reviews results with Emma | Living room | "Let me see..." | 🙂 Engaged | Results screen overwhelming | Simplify parent-focused view |
| **12** | Looks at incorrect answers | Results page | "You missed 3 questions. Let's review." | 🙂 Teaching | Have to expand each one manually | Show all incorrect answers expanded |
| **13** | Explains photosynthesis concept | Verbal | "So plants need sunlight to make food..." | 🙂 Helpful | App explanation wasn't clear enough | Improve AI explanations |
| **14** | Encourages Emma to try again | Living room | "Try the normal difficulty now!" | 😊 Encouraging | None | Good - multiple difficulty levels |
| **15** | Emma practices normal difficulty | iPad | "She's motivated to improve!" | 😊 Satisfied | None | Progression system working |

### Critical Moments

**Critical Moment 1: Step 6** - Parent Can't Monitor Progress
- **Risk**: Parent feels disconnected, interrupts Emma's flow
- **Intervention**:
  - Future: Optional parent dashboard (email link to view results)
  - Real-time progress bar visible from across room
  - Notification when session completes
- **Success Criteria**: >70% of parents feel informed without being intrusive

**Critical Moment 2: Step 13** - Explanation Not Clear Enough
- **Risk**: Parent has to re-explain concepts (defeats purpose)
- **Intervention**:
  - Improve AI prompt for clearer, age-appropriate explanations
  - Add "Explain like I'm 10" constraint
  - Include examples in explanations
- **Success Criteria**: >80% of parents say explanations are sufficient

### Improvement Opportunities

| Opportunity | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Parent dashboard (email link to results) | High | High | **P2** |
| Auto-expand incorrect answers on results | Medium | Low | **P1** |
| Improve AI explanation clarity | High | Medium | **P0** |
| Session completion notification | Medium | Medium | **P2** |

---

## Journey 4: Student Uses Flashcards Mode (Memorization)

**Actor**: Emma (Eager Learner persona)
**Goal**: Memorize biology terms using flashcard mode
**Success Metric**: Complete flashcard session + remember concepts
**Duration**: 10-12 minutes per session

### Journey Map

| Step | Action | Touchpoint | Thoughts | Emotions | Pain Points | Opportunities |
|------|--------|------------|----------|----------|-------------|---------------|
| **1** | Opens flashcard code (Biology - Kortit) | iPad | "Teacher said to use the flashcards" | 🙂 Curious | None | Clear distinction from quiz mode |
| **2** | Sees 3 topics: Photosynthesis, Ecosystems, Food Chains | Topic selection | "Which should I practice?" | 😐 Choosing | Too many choices? | Good - topic-specific practice |
| **3** | Taps "Kaikki aiheet" | Topic selection | "I'll practice all of them" | 🙂 Confident | None | Good - "All topics" option |
| **4** | Sees first flashcard (fill-blank question) | Flashcard UI | "Cool, it flips like a real card!" | 😊 Engaged | None | 3D flip animation working |
| **5** | Types answer "fotosynteesin" | Text input | "Is that right?" | 😐 Uncertain | Spelling worry | Lenient matching helps |
| **6** | Sees green checkmark (answer accepted) | Feedback | "Yay! Even though I forgot the 'i'!" | 😊 Relieved | None | Lenient matching working great |
| **7** | Reads explanation | Flashcard back | "Oh, I see how it works now" | 🙂 Learning | None | Clear explanations |
| **8** | Taps "Seuraava" | Flashcard UI | "Next card!" | 🙂 Focused | None | Good flow |
| **9** | Continues through 10 cards | Cards 2-10 | "I'm learning a lot!" | 😊 Satisfied | None | Good rhythm |
| **10** | Finishes flashcard set | Results page | "That was helpful!" | 😊 Accomplished | Results page same as quiz (confusing) | Simplify flashcard results |
| **11** | Sees only explanations (no scores) | Results page | "Just the explanations. Nice!" | 🙂 Focused | None | Good - less pressure than quiz |
| **12** | Taps "Harjoittele uudelleen" | Results page | "Let me try again to remember better" | 😊 Motivated | None | Repeat practice encouraged |

### Improvement Opportunities

| Opportunity | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Differentiate flashcard results from quiz | Medium | Low | **P1** |
| Add spaced repetition algorithm | High | High | **P3** |
| Track "mastered" vs "needs practice" cards | High | Medium | **P2** |
| Show topic mastery progress | Medium | Medium | **P2** |

---

## Journey 5: Teacher Extends Question Set (Iteration)

**Actor**: Maria (Supportive Teacher persona)
**Goal**: Add 50 more questions to existing question set
**Success Metric**: Successfully extend set with additional material
**Duration**: 5 minutes

### Journey Map

| Step | Action | Touchpoint | Thoughts | Emotions | Pain Points | Opportunities |
|------|--------|------------|----------|----------|-------------|---------------|
| **1** | Students say "We finished all 100 questions!" | Classroom | "They need more practice questions" | 😐 Thoughtful | Creating from scratch takes time | Good - can extend existing |
| **2** | Opens Koekertaaja | Laptop | "I'll add more questions" | 🙂 Confident | None | Good - knows the flow |
| **3** | Enters existing code | Search/browse page | "What's the code again?" | 😐 Searching | Can't easily find own question sets | Need "My Question Sets" page |
| **4** | Taps "Lisää kysymyksiä" | Question set page | "Perfect, this is what I need" | 😊 Pleased | Button not prominent enough | Make "Extend" button more visible |
| **5** | Uploads additional PDF (chapter 5) | Extend form | "Chapter 5 covers future tense" | 🙂 Focused | None | Simple form works |
| **6** | Sets +50 questions | Extend form | "50 more should be enough" | 🙂 Confident | None | Good - adjustable amount |
| **7** | Waits for generation | Loading page | "This is faster than creating new" | 😊 Satisfied | Still ~15 second wait | Add progress messages here too |
| **8** | Sees success message | Results page | "Done! Same code, more questions!" | 😊 Accomplished | None | Great - seamless extension |
| **9** | Tells students in class | Classroom | "You can keep using the same code!" | 😊 Efficient | None | Good UX - no code change |

### Improvement Opportunities

| Opportunity | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| "My Question Sets" teacher dashboard | High | High | **P2** |
| Make "Extend" button more prominent | Medium | Low | **P1** |
| Show question count after extension | Low | Low | **P2** |

---

## Cross-Journey Insights

### Common Friction Points Across Journeys

1. **AI Generation Wait Time** (Journeys 1, 5)
   - 20-30 seconds feels long without feedback
   - Fix: Progress messages, estimated time, fun facts

2. **Code Entry** (Journeys 2, 3)
   - Manual typing on mobile is tedious
   - Future: QR codes, "My Sets" dashboard

3. **Finding Own Question Sets** (Journey 5)
   - Teachers can't easily find their created sets
   - Fix: "My Question Sets" dashboard (requires auth)

4. **Explanation Clarity** (Journeys 2, 3)
   - Parents sometimes need to re-explain concepts
   - Fix: Improve AI prompts for age-appropriate language

### Success Patterns Across Journeys

1. **Instant Feedback** (Journey 2)
   - Students love seeing points/streaks immediately
   - Keep and enhance

2. **Badge System** (Journeys 2, 4)
   - Highly motivating for students
   - Expand badge variety

3. **Multiple Difficulty Levels** (Journeys 1, 3)
   - Teachers appreciate differentiation options
   - Students like progression from easy → normal

4. **Independent Practice** (Journey 3)
   - Parents love that students can self-study
   - Emphasize this in marketing

---

## Priority Improvements Based on Journey Analysis

### P0 - Critical (Do Immediately)
1. Add progress messages during AI generation (Journeys 1, 5)
2. Soften negative feedback for wrong answers (Journey 2)
3. Improve AI explanation clarity (Journeys 2, 3)

### P1 - Important (Do Soon)
1. One-click copy button for codes (Journey 1)
2. Auto-expand incorrect answers on results (Journey 3)
3. Make "Extend" button more prominent (Journey 5)
4. Differentiate flashcard results from quiz (Journey 4)

### P2 - Nice to Have (Future)
1. "My Question Sets" teacher dashboard (Journeys 5, 3)
2. QR code scanning (Journey 2)
3. Parent dashboard/progress monitoring (Journey 3)
4. Track topic mastery in flashcards (Journey 4)

### P3 - Long-term Vision
1. Google Classroom integration (Journey 1)
2. Spaced repetition algorithm (Journey 4)

---

**Next Steps**:
1. Validate these journeys with 5 teachers, 5 students, 5 parents
2. Prioritize P0 improvements for next sprint
3. Track metrics per journey (completion rates, time to complete, NPS)
4. Update journeys quarterly based on user feedback
