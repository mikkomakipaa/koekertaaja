# Testing Guide - Exam Prepper

## 🎉 Application is Running!

**Local URL**: http://localhost:3000

The development server is running and ready for testing.

## Test Checklist

### 1. Landing Page Test

Visit: http://localhost:3000

**Expected:**
- ✓ Blue gradient background
- ✓ "Kielikokeen kertaaja" title with star icon
- ✓ "Luo uusi kysymyssarja" button (green)
- ✓ Code input field with "Lataa" button
- ✓ Info box explaining how it works

**Test Actions:**
- [ ] Click "Luo uusi kysymyssarja" → should navigate to `/create`
- [ ] Try entering a 6-character code (won't work yet, no sets exist)

---

### 2. Create Question Set Test

Visit: http://localhost:3000/create

**Form Fields:**
- [ ] **Name**: Enter "Test English Set"
- [ ] **Subject**: Click "Englanti" (should highlight)
- [ ] **Grade**: Select "4. luokka" (optional)
- [ ] **Difficulty**: Select "Normaali"
- [ ] **Question Count**: Use slider or input to set to **20** (faster for testing)
- [ ] **Material**: Paste sample English text

**Sample Material to Use:**
```
Hello and welcome! Today we will learn some basic English words.

Vocabulary:
- dog = koira
- cat = kissa
- house = talo
- car = auto
- tree = puu

Grammar:
I am a student.
You are a teacher.
He is happy.
She is sad.

Verbs:
to be, to have, to go, to eat, to sleep
```

**Test Actions:**
1. Fill in all required fields
2. Click "Luo 20 kysymystä"
3. **Wait 30-60 seconds** (loading screen should appear)
4. Should see success screen with:
   - Green "Kysymyssarja tallennettu!" header
   - 6-character code (e.g., "ABC123")
   - "Luotu 20 kysymystä!" message
   - "Pelaa nyt!" and "Palaa valikkoon" buttons

**Copy the generated code** - you'll need it for the next test!

---

### 3. Share Code Test

After creating a question set:

**Test Actions:**
- [ ] Click the copy button (clipboard icon)
- [ ] Verify "Kopioitu leikepöydälle!" message appears
- [ ] **Save/remember the 6-character code**

---

### 4. Play Quiz Test

**Option A: From Success Screen**
- [ ] Click "Pelaa nyt!" button

**Option B: From Landing Page**
- [ ] Go back to http://localhost:3000
- [ ] Enter the 6-character code
- [ ] Click "Lataa"

**Expected Gameplay:**
- Progress bar showing "Kysymys 1 / 15"
- Question in Finnish
- Answer options (could be multiple choice, fill-in-blank, true/false, or matching)
- "Tarkista vastaus" button

**Test Actions:**
1. [ ] Select/enter an answer
2. [ ] Click "Tarkista vastaus"
3. [ ] Should see:
   - Green highlight if correct OR red if wrong
   - Explanation in blue box
   - "Seuraava kysymys" button (green)
4. [ ] Click through **all 15 questions**
5. [ ] Answer some correctly and some incorrectly (to test scoring)

---

### 4b. Flagging & Admin Review Test

**Pupil flow (play mode):**
- [ ] After submitting an answer, click "Ilmoita virhe"
- [ ] Select a reason and optional note, then submit
- [ ] Expect success confirmation and the button to disable for that question
- [ ] Submit 3 flags total, then attempt a 4th → should show 429/limit message

**Admin flow (create page):**
- [ ] Go to http://localhost:3000/create while logged in as admin
- [ ] Open "Hallitse" → section "Ilmoitetut kysymykset"
- [ ] Click "Muokkaa" on a flagged question
- [ ] Update question text / answers and save
- [ ] Verify changes show up in play mode

### 4c. Concept Dependency Validation (Admin)

**Admin flow (create page):**
- [ ] Go to http://localhost:3000/create while logged in as admin
- [ ] Open "Hallitse" -> "Testaa kysymyksiä"
- [ ] Select a generated set for `math`, `finnish`, `chemistry`, `physics`, or `society`
- [ ] Verify dependency alert is visible above the question list
- [ ] Verify each question card shows a dependency badge:
  - `Perustava konsepti` for foundational concepts
  - `Vaatii` + prerequisite IDs for dependent concepts
- [ ] If violations are shown, confirm questions are still playable and ordering is corrected after re-generation

---

### 5. Results Screen Test

After completing all 15 questions:

**Expected:**
- Trophy icon
- "Hienoa työtä!" title
- Score: "X / 15 pistettä (X%)"
- Encouragement message based on score:
  - 80%+: "⭐ Erinomaista! ⭐"
  - 60-79%: "👍 Hyvä suoritus! 👍"
  - <60%: "💪 Harjoittele lisää! 💪"
- List of all answers with correct/incorrect indicators

**Test Actions:**
- [ ] Review answer summary
- [ ] Click "Pelaa uudestaan" → should restart with **new random 15 questions**
- [ ] Play through a few questions again
- [ ] Click "Palaa valikkoon" → should return to landing page

---

### 6. Different Question Types Test

The AI should generate different question types. You might see:

**Multiple Choice:**
```
Kysymys: Mikä on sanan 'dog' suomennos?
Options: koira, kissa, lintu, kala
```

**Fill in the Blank:**
```
Kysymys: Täydennä: "I ___ a student."
Input field for answer
```

**True/False:**
```
Kysymys: Totta vai tarua: 'Am' on verbin 'to be' muoto.
Options: Totta, Tarua
```

**Matching (less common):**
```
Left column: dog, cat, house
Right column: talo, koira, kissa
```

**Test Actions:**
- [ ] Try creating multiple question sets to see different types
- [ ] Verify each question type works correctly

---

### 7. Error Handling Test

**Test Invalid Inputs:**
- [ ] Try creating without entering a name → should show error
- [ ] Try creating without material → should show error
- [ ] Try loading with invalid code (e.g., "XXXXXX") → should show error
- [ ] Try entering 5-character code → "Lataa" button should be disabled

---

### 8. File Upload Test (Optional)

Instead of pasting text:

**Test Actions:**
- [ ] Create a simple .txt file with English vocabulary
- [ ] Upload via "Lataa tiedostoja" section
- [ ] Should show file name in green
- [ ] Generate questions from uploaded file
- [ ] Verify text input is disabled when file is uploaded

---

### 9. Different Difficulty Levels

Create multiple question sets with different difficulties:

**Test Actions:**
- [ ] Create set with "Helppo" → questions should be basic
- [ ] Create set with "Vaikea" → questions should be harder
- [ ] Create set with "Mahdoton" → questions should be very challenging

Compare the complexity of generated questions.

---

### 10. Question Count Variation

**Test Actions:**
- [ ] Create set with 20 questions (faster)
- [ ] Create set with 50 questions (moderate)
- [ ] Create set with 100 questions (slower, ~60 seconds)

Verify the count matches what was generated.

---

## Browser Console Check

Open browser DevTools (F12) and check Console tab:

**Should NOT see:**
- ❌ Red errors
- ❌ API key exposed errors
- ❌ CORS errors
- ❌ Database connection errors

**May see:**
- ✓ Info logs
- ✓ Component render logs (development mode)

---

## Performance Expectations

### Question Generation Time:
- 20 questions: ~30-45 seconds
- 50 questions: ~45-60 seconds
- 100 questions: ~60-90 seconds

### Page Load Times:
- Landing page: <1 second
- Create page: <1 second
- Play page: 1-2 seconds (loading from database)

---

## Provider Evaluation Dry-Run (Dev + Staging)

Use this when validating Anthropic vs OpenAI without changing production baseline behavior.

1. Enable dual-provider flags in the target environment:
   - `AI_ENABLE_OPENAI=true`
   - `AI_PROVIDER_SHADOW_MODE=true`
   - `AI_PROVIDER_CANARY_PERCENT=0`
2. Run the regression fixture checks:
   ```bash
   npm test -- tests/fixtures/provider-quality-regression.test.ts
   npm test -- tests/prompt-regression-evaluation.test.ts
   ```
3. Execute shadow dry-run for each task type (`topic_identification`, `flashcard_creation`, `question_generation`, `visual_questions`).
4. Record and compare:
   - JSON validity
   - Finnish grade-level clarity
   - latency p95
   - token cost per successful output
   - retry rate
5. Evaluate go/no-go using `docs/PROVIDER_EVALUATION_AND_ROLLOUT.md`.

The rollout must keep Claude as baseline unless all hard gates pass.

For prompt-specific gates and rollback thresholds, use:
- `docs/PROMPT_REGRESSION_EVALUATION_2026-02-12.md`

---

## Known Issues / Warnings

### Non-Critical:
- Webpack cache warning on first load (can ignore)
- npm deprecation warnings (dependencies will be updated later)

### If You See These, Report:
- ❌ "Missing Supabase environment variables"
- ❌ "Failed to fetch"
- ❌ 500 Internal Server Error
- ❌ Questions don't load
- ❌ Code doesn't work

---

## Success Criteria

Application is ready for deployment if:

- [x] Landing page loads
- [x] Can create question set (20+ questions)
- [x] Receive shareable code
- [x] Can load question set by code
- [x] Can play quiz (all 15 questions)
- [x] See results and score
- [x] Can play again with new random questions
- [x] No critical errors in console
- [x] All pages responsive on desktop

---

## Mobile Testing (Optional)

If you want to test on mobile:

1. Find your local IP: `ipconfig getifaddr en0` (Mac)
2. Visit: `http://YOUR_IP:3000` from phone
3. Test touch interactions
4. Verify responsive layout

---

## Next Steps After Testing

Once all tests pass:

1. **Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Exam Prepper MVP"
   ```

2. **Create GitHub Repo**
   - Go to github.com
   - Create new repository: `exam-prepper`
   - Push code

3. **Deploy to Vercel**
   - Import GitHub repository
   - Add environment variables
   - Deploy!

See **DEPLOYMENT_GUIDE.md** for detailed deployment instructions.

---

## Troubleshooting

### Dev Server Won't Start
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

### Questions Generation Fails
- Check Anthropic API key has credits
- Check console for detailed error
- Try with smaller question count (20)
- Verify material has enough content

### Database Connection Issues
- Verify Supabase migration ran successfully
- Check environment variables are correct
- Look at Supabase logs in dashboard

### Type Errors
```bash
npm run typecheck
```

---

**Happy Testing! 🎉**

Let me know if you encounter any issues or need help with any test case.
