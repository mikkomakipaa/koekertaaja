# Feature Proposal: Anonymous Student Profiles

**Date**: 2026-02-09
**Status**: Planning & Evaluation
**Priority**: High Impact - Requires Architectural Changes
**Effort**: Large (8-12 weeks)

---

## Executive Summary

Proposal to add **optional, anonymous student profiles** to enable learning progress tracking while maintaining privacy. Profiles would use **alias + password** authentication (no email/PII required).

**Core Principle**: Profiles are 100% optional. All existing features continue to work without authentication.

---

## Current Architecture

### What We Have Today

**Authentication**: None required
- Users access via shareable 6-character codes (`/play/ABC123`)
- No user accounts, no sessions stored
- Maximum privacy, zero friction

**Data Storage**:
- `question_sets` - Question sets with codes (public read via RLS)
- `questions` - Questions linked to sets (public read via RLS)
- `question_flags` - User-reported issues (public write)

**Session Management**:
- In-memory only (React state via `useGameSession` hook)
- Progress lost on page refresh
- No cross-device continuity
- No historical tracking

**User Flow**:
```
1. User lands on site
2. Enters code or creates question set
3. Plays questions (state in memory)
4. Views results
5. [Session ends - all data lost]
```

---

## Proposed Feature: Anonymous Student Profiles

### Design Principles

1. **Privacy First**: No email, no PII, no tracking beyond learning data
2. **Optional**: All features work without profile
3. **Anonymous**: Alias only (e.g., "PandaLearner42")
4. **Portable**: Export/delete data anytime
5. **Simple**: Minimal onboarding friction

### Authentication Model

**Alias + Password Only**:
```typescript
interface StudentProfile {
  id: string;              // UUID
  alias: string;           // User-chosen nickname (unique)
  password_hash: string;   // Hashed password (bcrypt/argon2)
  created_at: timestamp;
  last_login: timestamp;
}
```

**No Storage of**:
- ❌ Email addresses
- ❌ Real names
- ❌ Phone numbers
- ❌ Location data
- ❌ IP addresses (beyond rate limiting)
- ❌ Device fingerprints

**Recovery Options**:
- Export progress data as JSON (before forgetting password)
- Password reset via memorable Q&A (user-defined)
- OR: Accept data loss if password forgotten (emphasis on anonymity)

---

## Learning & Tracking Capabilities

### What Profiles Enable

#### 1. **Progress Tracking**
```typescript
interface SessionHistory {
  id: string;
  student_profile_id: string;
  question_set_id: string;
  started_at: timestamp;
  completed_at: timestamp;
  score: number;              // 0-100
  correct_count: number;
  total_count: number;
  time_spent_seconds: number;
}
```

**Features**:
- View all past sessions
- See score history over time
- Track time spent learning
- Identify frequently played sets

---

#### 2. **Mistake Tracking**
```typescript
interface MistakeLog {
  id: string;
  student_profile_id: string;
  question_id: string;
  session_id: string;
  user_answer: jsonb;
  correct_answer: jsonb;
  mistake_type: string;       // "incorrect" | "skipped" | "flagged"
  timestamp: timestamp;
}
```

**Features**:
- Review all past mistakes
- Practice specific weak areas
- See patterns in errors (e.g., always gets verb tenses wrong)
- "Review Mistakes" mode with personalized question selection

---

#### 3. **Topic Mastery Tracking**
```typescript
interface TopicMastery {
  id: string;
  student_profile_id: string;
  subject: string;            // "english", "math", etc.
  topic: string;              // "Grammar", "Algebra", etc.
  skill?: string;             // "verb_tenses", "addition", etc.

  // Performance metrics
  total_attempts: number;
  correct_count: number;
  mastery_percentage: number; // 0-100

  // Trend data
  recent_sessions: jsonb[];   // Last 5 sessions
  last_practiced: timestamp;

  // Spaced repetition
  next_review_date: timestamp;
  difficulty_rating: number;  // 1-5 (user-reported or calculated)
}
```

**Features**:
- Dashboard showing mastery % per topic/skill
- Visual progress bars (e.g., "Grammar: 78% mastery")
- Identify weak topics (< 50% mastery)
- Adaptive practice (prioritize weak topics)
- Spaced repetition reminders

---

#### 4. **Learning Streaks & Motivation**
```typescript
interface LearningStats {
  id: string;
  student_profile_id: string;

  // Streaks
  current_streak_days: number;
  longest_streak_days: number;
  last_practice_date: date;

  // Totals
  total_sessions: number;
  total_questions_answered: number;
  total_time_minutes: number;

  // Achievements (simple)
  questions_milestone: number;    // 100, 500, 1000, etc.
  streak_milestone: number;       // 7, 30, 100 days
  mastery_milestone: number;      // 3, 5, 10 topics > 80%
}
```

**Features**:
- Daily streak counter
- Simple achievement badges
- Progress graphs (questions/day, score over time)
- Motivation through visible progress

---

#### 5. **Cross-Device Continuity**
- Resume sessions across devices
- Consistent progress tracking
- Bookmark favorite question sets
- Access mistake reviews anywhere

---

## Pros & Cons Analysis

### ✅ Pros

#### **For Students**
1. **Track Progress**: See improvement over time, identify weak areas
2. **Personalized Learning**: Review past mistakes, focus on weak topics
3. **Motivation**: Streaks, achievements, visible progress
4. **Cross-Device**: Resume anywhere, no data loss
5. **Privacy**: No PII required, full control over data

#### **For Teachers/Parents**
6. **Better Insights**: Understand student struggles (if student shares alias)
7. **Targeted Help**: See which topics need reinforcement
8. **Progress Reports**: Export data for parent-teacher meetings

#### **For Product**
9. **Engagement**: Users return more often (streaks, unfinished goals)
10. **Retention**: Logged-in users less likely to abandon
11. **Quality**: Better mistake tracking improves question quality
12. **Monetization**: Foundation for future premium features (progress reports, adaptive learning)

#### **For AI Features**
13. **Adaptive Difficulty**: Adjust based on historical performance
14. **Personalized Question Selection**: Prioritize weak topics/skills
15. **Better Explanations**: Contextualize based on past mistakes

---

### ❌ Cons

#### **Development Complexity**
1. **Auth System**: Add Supabase Auth (or custom), password reset flow
2. **Database Schema**: 4-6 new tables, complex queries
3. **Data Migration**: Existing users can't retroactively track past sessions
4. **State Management**: Merge session state with profile state
5. **Testing**: Auth flows, RLS policies, data privacy

#### **Maintenance Burden**
6. **Security**: Password security, rate limiting, account lockout
7. **Privacy Compliance**: GDPR (data export), user data deletion
8. **Support**: Password recovery, account issues, data conflicts

#### **UX Challenges**
9. **Onboarding Friction**: Sign-up flow adds steps (even if optional)
10. **Dual Flows**: Maintain both authenticated + unauthenticated experiences
11. **Password Fatigue**: Users forget passwords, lose access to data
12. **Recovery Trade-off**: Strong anonymity vs. account recovery (can't have both)

#### **Performance**
13. **Database Load**: More writes per session (session_history, mistake_log)
14. **Query Complexity**: JOIN-heavy queries for progress dashboards
15. **RLS Overhead**: More complex policies (profile-owned data)

#### **Risk of Scope Creep**
16. **Feature Bloat**: Pressure to add social features (leaderboards, sharing)
17. **Premium Pressure**: Temptation to paywall progress tracking
18. **Privacy Erosion**: Future features might compromise anonymity

---

## Open Questions to Validate

### 1. **User Need & Demand**
- ❓ How many users would actually create profiles?
- ❓ Is lack of progress tracking a common complaint?
- ❓ Would students use this independently, or only if required by teachers?
- ❓ What % of current users return for multiple sessions?

**Validation**: User survey, analytics (return rate, session length)

---

### 2. **Privacy vs. Recovery Trade-off**
- ❓ If password is forgotten, should data be lost (strong anonymity)?
- ❓ OR: Allow memorable Q&A recovery (weaker anonymity)?
- ❓ OR: Require "backup alias" known only to user (compromise)?

**Options**:
```
A. No Recovery (Maximum Anonymity)
   - Emphasize data export before forgetting password
   - Clear warnings during sign-up
   - Simple implementation

B. Security Questions (Balanced)
   - User-defined questions (not standard "mother's maiden name")
   - E.g., "What's your favorite fictional character?"
   - Medium implementation complexity

C. Backup Code (Compromise)
   - Generate 6-word recovery phrase at sign-up
   - User must save it securely
   - Medium implementation complexity
```

**Recommendation**: Start with Option A (no recovery), add Option C if user feedback demands it

---

### 3. **Onboarding Flow**
- ❓ When should we prompt users to create a profile?
- ❓ After first session? After 3rd session? On landing page?
- ❓ How do we explain benefits without sounding salesy?

**Options**:
```
A. Immediate (Landing Page)
   - "Create Profile" vs "Continue as Guest" buttons
   - Risk: High friction, lower conversion

B. Deferred (After First Session)
   - Show what they would have tracked ("You scored 85%! Create profile to track progress")
   - Lower friction, demonstrates value
   - Risk: Users might not return

C. Smart Prompt (After 3rd Anonymous Session)
   - Detected returning user (browser fingerprint, optional)
   - "Looks like you're a returning learner! Save your progress?"
   - Lowest friction, highest intent
   - Risk: Delayed value realization
```

**Recommendation**: Option B (after first session) with dismissible banner for returning visitors

---

### 4. **Data Ownership & Export**
- ❓ Should users be able to export all their data as JSON?
- ❓ GDPR compliance - do we need to support this even for anonymous profiles?
- ❓ Should users be able to delete their profile + all data?

**Answer**: **YES to all** - Privacy-first means full control
- Export: JSON download with all sessions, mistakes, stats
- Delete: Complete data wipe, irreversible (with confirmation)
- GDPR: Even anonymous data may fall under GDPR if it's "personal data"

---

### 5. **Teachers & Classroom Use**
- ❓ Should teachers be able to create accounts separate from students?
- ❓ Should teachers be able to link student profiles (with student consent)?
- ❓ Should there be "class codes" to group students?

**Decision Point**: This is **Phase 6** from CONSOLIDATED_ROADMAP.md
- **Phase 1 (This Proposal)**: Student profiles only, no teacher features
- **Phase 2 (Future)**: Teacher accounts, class management if validated

**Recommendation**: Start with student profiles only. Validate use case before building teacher features.

---

### 6. **Adaptive Learning & AI Personalization**
- ❓ Should the system automatically generate personalized practice sets?
- ❓ Should difficulty auto-adjust based on performance?
- ❓ Should we prioritize weak topics in question selection?

**Options**:
```
A. Manual Only
   - User chooses "Review Mistakes" or "Practice Weak Topics"
   - System shows data, user controls actions
   - Simple, transparent

B. Suggested Practice
   - System suggests practice sets: "Try these Grammar questions (62% mastery)"
   - User clicks to accept or ignore
   - Medium complexity

C. Auto-Generated Adaptive
   - System auto-generates personalized practice sets daily
   - Difficulty adjusts per-question based on performance
   - High complexity, requires ML/heuristics
```

**Recommendation**: Start with Option A (manual), add Option B if data shows users want guidance

---

### 7. **Mistake Review Mode**
- ❓ Should users be able to practice ONLY past mistakes?
- ❓ Should mistakes be grouped by topic/skill?
- ❓ Should we re-ask the exact same question, or generate new ones on the same concept?

**Options**:
```
A. Exact Question Replay
   - Show the exact question they got wrong
   - Pro: Easy to implement
   - Con: Users might memorize answer, not learn concept

B. Similar Question Generation
   - AI generates new questions on the same topic/skill
   - Pro: Tests understanding, not memory
   - Con: Requires AI API call, complexity

C. Hybrid
   - First review: Show exact question
   - Later reviews: Generate similar questions
   - Pro: Best of both worlds
   - Con: Most complex
```

**Recommendation**: Option A (exact replay) for MVP, add Option B if validated

---

### 8. **Performance & Scale**
- ❓ How much will this increase database writes per session?
- ❓ Can we handle 1000+ concurrent users with profile tracking?
- ❓ Should we batch writes (e.g., save after every 5 questions vs. every question)?

**Current**: ~0 writes per session (except question flags)
**With Profiles**:
- 1 write on session start (`session_history` insert)
- 1 write per question answered (`mistake_log` insert if wrong)
- 1 write on session end (`session_history` update)
- N writes for topic mastery recalculations

**Optimization Strategies**:
```
A. Batch Writes
   - Save all answers in-memory during session
   - Bulk insert at session end
   - Pro: Fewer DB hits
   - Con: Data loss if user closes tab mid-session

B. Async Background Jobs
   - Write critical data immediately (session start/end)
   - Calculate topic mastery asynchronously (Vercel Edge Functions / Supabase Functions)
   - Pro: Fast UX, offloaded computation
   - Con: More infrastructure complexity

C. Real-time Writes (Simple)
   - Write after each answer
   - Pro: No data loss, simple
   - Con: More DB load
```

**Recommendation**: Option C (real-time) for MVP, optimize to Option B if scale requires

---

### 9. **Gamification & Motivation**
- ❓ Should we add badges, points, leaderboards?
- ❓ Would gamification increase engagement or create unhealthy competition?
- ❓ Is simple progress tracking (%, streaks) enough?

**Considerations**:
- **Target Audience**: Elementary students (ages 10-12)
- **Risk**: Leaderboards can demotivate struggling students
- **Privacy**: Leaderboards conflict with anonymity

**Recommendation**:
- ✅ **YES**: Streaks, personal milestones, progress bars
- ❌ **NO**: Public leaderboards, points, competitive features
- Keep it **cooperative, not competitive**

---

### 10. **Migration Path for Existing Users**
- ❓ Can current anonymous users claim their past sessions if they create a profile later?
- ❓ How do we handle users who've already used the app 10+ times?

**Answer**: **NO - Cannot retroactively link sessions**
- Sessions are anonymous (no user ID)
- Creating a profile starts tracking from that point forward
- Clear messaging: "Your future progress will be saved. Past sessions can't be recovered."

---

## Architectural Impact

### Database Schema Changes

#### New Tables

**1. student_profiles**
```sql
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW(),

  -- Recovery (optional, Phase 2)
  recovery_question TEXT,
  recovery_answer_hash TEXT,

  -- Data export
  data_exported_at TIMESTAMPTZ,

  CONSTRAINT alias_length CHECK (char_length(alias) >= 3),
  CONSTRAINT alias_format CHECK (alias ~* '^[a-z0-9_]+$')
);

CREATE INDEX idx_student_profiles_alias ON student_profiles(alias);
```

**2. session_history**
```sql
CREATE TABLE session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  score INTEGER,                    -- 0-100
  correct_count INTEGER DEFAULT 0,
  total_count INTEGER NOT NULL,
  time_spent_seconds INTEGER,

  mode VARCHAR(20) NOT NULL,        -- "quiz" | "flashcard"

  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
  CONSTRAINT valid_counts CHECK (correct_count <= total_count)
);

CREATE INDEX idx_session_history_student ON session_history(student_profile_id, completed_at DESC);
CREATE INDEX idx_session_history_set ON session_history(question_set_id);
```

**3. mistake_log**
```sql
CREATE TABLE mistake_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES session_history(id) ON DELETE CASCADE,

  user_answer JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  was_correct BOOLEAN NOT NULL DEFAULT FALSE,
  was_skipped BOOLEAN DEFAULT FALSE,

  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mistake_log_student ON mistake_log(student_profile_id, timestamp DESC);
CREATE INDEX idx_mistake_log_question ON mistake_log(question_id);
CREATE INDEX idx_mistake_log_incorrect ON mistake_log(student_profile_id, was_correct) WHERE was_correct = FALSE;
```

**4. topic_mastery**
```sql
CREATE TABLE topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,

  subject VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  skill VARCHAR(100),

  total_attempts INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  mastery_percentage INTEGER DEFAULT 0,

  last_practiced TIMESTAMPTZ,
  next_review_date TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_profile_id, subject, topic, skill),
  CONSTRAINT valid_mastery CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100)
);

CREATE INDEX idx_topic_mastery_student ON topic_mastery(student_profile_id, mastery_percentage ASC);
CREATE INDEX idx_topic_mastery_subject ON topic_mastery(student_profile_id, subject);
CREATE INDEX idx_topic_mastery_review ON topic_mastery(student_profile_id, next_review_date) WHERE next_review_date IS NOT NULL;
```

**5. learning_stats**
```sql
CREATE TABLE learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,

  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_practice_date DATE,

  total_sessions INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,

  questions_milestone INTEGER DEFAULT 0,
  streak_milestone INTEGER DEFAULT 0,
  mastery_milestone INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_stats_streak ON learning_stats(student_profile_id, current_streak_days DESC);
```

---

### RLS Policies

**student_profiles**:
```sql
-- Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = id);
```

**session_history, mistake_log, topic_mastery, learning_stats**:
```sql
-- All tables follow same pattern: user can only access their own data
CREATE POLICY "Users can view own data"
  ON [table_name] FOR SELECT
  USING (student_profile_id = auth.uid());

CREATE POLICY "Users can insert own data"
  ON [table_name] FOR INSERT
  WITH CHECK (student_profile_id = auth.uid());
```

---

### API Routes (New)

**Authentication**:
- `POST /api/auth/signup` - Create profile (alias + password)
- `POST /api/auth/login` - Login with alias + password
- `POST /api/auth/logout` - Clear session
- `POST /api/auth/delete-account` - Delete profile + all data (irreversible)

**Profile Management**:
- `GET /api/profile` - Get current user's profile
- `PATCH /api/profile` - Update alias or password
- `GET /api/profile/export` - Download all data as JSON

**Session Tracking**:
- `POST /api/sessions/start` - Create session_history record
- `PATCH /api/sessions/:id/end` - Update with final score, time
- `POST /api/sessions/:id/answers` - Log answer (mistake_log if wrong)

**Progress & Analytics**:
- `GET /api/progress/dashboard` - Overview (stats, mastery, recent sessions)
- `GET /api/progress/sessions` - Paginated session history
- `GET /api/progress/mistakes` - Paginated mistake log, filterable by topic/skill
- `GET /api/progress/mastery` - Topic mastery breakdown
- `GET /api/progress/stats` - Learning stats (streaks, totals, achievements)

**Adaptive Practice** (Phase 2):
- `GET /api/practice/weak-topics` - Suggest topics < 60% mastery
- `POST /api/practice/review-mistakes` - Generate practice set from mistakes
- `GET /api/practice/spaced-repetition` - Topics due for review

---

### Frontend Changes

**New Pages**:
- `/signup` - Create profile
- `/login` - Login page
- `/profile` - View profile, stats, export/delete
- `/progress` - Dashboard with mastery, sessions, mistakes
- `/practice/mistakes` - Review mistakes mode

**Updated Components**:
- **Header**: Show login/signup buttons (if not logged in) or profile dropdown (if logged in)
- **useGameSession Hook**: Integrate profile tracking (save to DB if logged in)
- **Results Screen**: Show "Create profile to save progress" CTA if anonymous
- **Landing Page**: Subtle profile benefits messaging

**New Components**:
- **ProfileDropdown**: Access profile, progress, logout
- **ProgressDashboard**: Stats, graphs, mastery breakdown
- **MistakeReviewer**: Browse past mistakes, filter by topic
- **StreakBadge**: Visual streak indicator in header
- **MasteryChart**: Topic mastery visualization

---

## Implementation Phases

### Phase 1: Core Profile System (4-6 weeks)
**Goal**: Working profile creation, login, basic tracking

**Tasks**:
1. **Week 1-2: Database & Auth**
   - Create 5 new tables (migrations)
   - Set up Supabase Auth (alias + password)
   - Write RLS policies
   - API routes: signup, login, logout

2. **Week 3-4: Session Tracking**
   - Modify `useGameSession` to save to DB if logged in
   - API routes: start session, log answers, end session
   - Mistake log population
   - Topic mastery calculation (basic)

3. **Week 5-6: UI & Profile Pages**
   - Signup/login pages
   - Profile page (view stats, export, delete)
   - Header integration (login/profile dropdown)
   - Results screen CTA ("Save your progress!")

**Deliverables**:
- ✅ Users can create anonymous profiles
- ✅ Sessions are tracked when logged in
- ✅ Mistakes are logged
- ✅ Basic profile page with export/delete

---

### Phase 2: Progress Dashboard (2-3 weeks)
**Goal**: Visualize learning progress

**Tasks**:
1. **Week 1: Data Aggregation**
   - Build queries for dashboard (sessions, mastery, stats)
   - Calculate streaks, totals, milestones
   - API routes: GET /api/progress/*

2. **Week 2-3: Dashboard UI**
   - Progress dashboard page
   - Mastery charts (per subject, per topic)
   - Session history table
   - Streak badge in header

**Deliverables**:
- ✅ Progress dashboard with stats and charts
- ✅ Topic mastery visualization
- ✅ Streak tracking

---

### Phase 3: Mistake Review & Adaptive Practice (3-4 weeks)
**Goal**: Enable personalized practice

**Tasks**:
1. **Week 1-2: Mistake Review**
   - Mistake browser page (filter by topic/skill)
   - "Review Mistakes" mode (exact question replay)
   - Mistake analytics (most common errors)

2. **Week 3-4: Smart Practice**
   - "Practice Weak Topics" suggestions
   - Spaced repetition reminders (optional)
   - Auto-prioritize weak topics in question selection

**Deliverables**:
- ✅ Review mistakes mode
- ✅ Practice weak topics recommendations
- ✅ Basic adaptive learning

---

### Phase 4: Polish & Optimization (2 weeks)
**Goal**: Production-ready, performant, secure

**Tasks**:
1. **Testing**: Auth flows, RLS policies, data privacy
2. **Performance**: Query optimization, caching, batch writes
3. **Security**: Rate limiting, password complexity, account lockout
4. **UX**: Onboarding flow, tooltips, help text
5. **Docs**: Update CLAUDE.md, create USER_GUIDE.md

**Deliverables**:
- ✅ Production-ready profile system
- ✅ Comprehensive tests
- ✅ Documentation

---

**Total Estimated Time**: 11-15 weeks (3-4 months)

---

## Success Metrics

### Adoption
- [ ] % of users who create profiles (target: 30-40% after 3 months)
- [ ] % of logged-in users who return (target: >50% vs. <10% anonymous)
- [ ] Average sessions per logged-in user (target: >5)

### Engagement
- [ ] Increase in daily active users (target: +25%)
- [ ] Increase in average session duration (target: +15%)
- [ ] Streak retention (target: 40% maintain 7-day streak)

### Learning Outcomes
- [ ] Score improvement over time (target: +10% from session 1 to session 10)
- [ ] Mistake reduction on repeated topics (target: 50% fewer mistakes on review)
- [ ] Topic mastery progression (target: 60% of topics reach >70% mastery)

### Privacy & Security
- [ ] Zero data breaches
- [ ] <5% account recovery requests (validates "no recovery" approach)
- [ ] 100% compliance with data export/deletion requests

---

## Risks & Mitigation

### Risk 1: Low Adoption (<20%)
**Likelihood**: Medium
**Impact**: High (wasted effort if nobody uses profiles)

**Mitigation**:
- Validate with user survey BEFORE building
- A/B test signup flow (immediate vs. deferred)
- Offer clear value prop ("Track mistakes", "See progress")
- Make onboarding dead simple (3 fields: alias, password, confirm)

---

### Risk 2: Password Recovery Hell
**Likelihood**: High
**Impact**: High (support burden, user frustration)

**Mitigation**:
- Start with "No Recovery" + data export emphasis
- Clear warnings at signup: "No email = can't recover password"
- Add backup code recovery in Phase 2 if validated

---

### Risk 3: Performance Degradation
**Likelihood**: Medium
**Impact**: Medium (slow UX, higher costs)

**Mitigation**:
- Start with simple real-time writes
- Optimize queries (indexes, EXPLAIN ANALYZE)
- Move heavy computation to background jobs (Supabase Functions)
- Monitor Supabase metrics, set up alerts

---

### Risk 4: Scope Creep (Social Features, Teacher Features)
**Likelihood**: High
**Impact**: High (delays, complexity)

**Mitigation**:
- Strict scope: Student profiles ONLY in Phase 1-3
- No leaderboards, no social features, no teacher accounts
- Document "Future Phases" clearly to resist pressure
- Validate need before building Phase 6 (Teacher Features)

---

### Risk 5: Privacy Concerns
**Likelihood**: Low (if done right)
**Impact**: Critical (reputation damage, legal issues)

**Mitigation**:
- No PII collection (alias only)
- Clear privacy policy (what we store, why, how to delete)
- GDPR compliance (data export, deletion)
- Regular security audits (auth system, RLS policies)
- Open-source privacy practices (build trust)

---

## Alternative Approaches

### Option A: Browser-Only Storage (LocalStorage)
**Description**: Store progress in browser LocalStorage, no server accounts

**Pros**:
- ✅ Zero server writes (no cost, no scale issues)
- ✅ Maximum privacy (data never leaves device)
- ✅ No auth system needed (simpler)

**Cons**:
- ❌ Data lost if browser cache cleared
- ❌ No cross-device sync
- ❌ No mistake review across question sets (data siloed)
- ❌ Can't aggregate analytics across users

**Verdict**: **Not recommended** - Limited value, major UX limitations

---

### Option B: Session-Based Tracking (No Profiles)
**Description**: Track progress via session cookies, no explicit profiles

**Pros**:
- ✅ Simpler than full auth system
- ✅ Works for single-device users
- ✅ Gradual onboarding (auto-tracked from first session)

**Cons**:
- ❌ Sessions expire (7-30 days)
- ❌ No cross-device sync
- ❌ Can't distinguish users (analytics limited)
- ❌ Privacy concerns (tracking without consent?)

**Verdict**: **Not recommended** - Worst of both worlds (tracking without benefits)

---

### Option C: Optional Email (Weak Anonymity)
**Description**: Allow optional email for recovery, but not required

**Pros**:
- ✅ Solves password recovery issue
- ✅ Still fairly anonymous (email not public)
- ✅ Easier onboarding (familiar pattern)

**Cons**:
- ❌ Violates "no PII" principle
- ❌ Trust issues (parents worry about email collection)
- ❌ Spam concerns (email used for marketing?)
- ❌ GDPR implications (email = PII)

**Verdict**: **Maybe in Phase 2** - Only if password recovery is a major pain point

---

## Recommendation

### Should We Build This?

**YES - WITH CAVEATS**

**Why Build**:
1. **High Impact**: Enables personalized learning, mistake review, progress tracking
2. **Competitive**: Most learning platforms have profiles (expected feature)
3. **Engagement**: Tracked progress increases retention
4. **Monetization**: Foundation for premium features (adaptive learning, progress reports)
5. **User Request**: Likely a top feature request (validate with survey)

**Caveats**:
1. **Validate First**: User survey (10 questions, 100+ responses)
   - "Would you create a profile to track your progress?"
   - "How important is cross-device sync?"
   - "Would you trust a password-only (no email) system?"
2. **Start Small**: Phase 1 only (core profiles + session tracking)
3. **Monitor Adoption**: If <20% create profiles after 3 months, pivot
4. **No Scope Creep**: Resist social features, teacher features until validated

---

## Next Steps

### Immediate (Before Starting Development)

1. **User Validation** (1-2 weeks)
   - [ ] Create user survey (10 questions)
   - [ ] Distribute to current users (email list, in-app banner)
   - [ ] Target: 100+ responses
   - [ ] Analyze results (adoption likelihood, feature priorities)

2. **Technical Spike** (1 week)
   - [ ] Prototype Supabase Auth with alias-only accounts
   - [ ] Test RLS policy performance with 10k rows
   - [ ] Estimate database costs (writes per session)

3. **Design Mockups** (1 week)
   - [ ] Signup/login flows (mobile + desktop)
   - [ ] Profile page wireframes
   - [ ] Progress dashboard mockups
   - [ ] Onboarding flow (when to prompt signup)

4. **Decision Point** (1 day)
   - [ ] Review survey results
   - [ ] Review technical feasibility
   - [ ] Review mockups
   - [ ] **GO / NO-GO decision**

---

### If GO Decision

5. **Phase 1 Implementation** (6 weeks)
   - [ ] Week 1-2: Database + Auth
   - [ ] Week 3-4: Session tracking
   - [ ] Week 5-6: UI + Profile pages

6. **Alpha Testing** (1 week)
   - [ ] Internal testing (5-10 users)
   - [ ] Bug fixes, UX refinements

7. **Beta Launch** (2 weeks)
   - [ ] Invite 50-100 users to create profiles
   - [ ] Monitor adoption, engagement, issues
   - [ ] Iterate based on feedback

8. **Full Rollout** (1 day)
   - [ ] Enable for all users
   - [ ] Monitor metrics (adoption %, return rate)

9. **Phase 2 & 3** (If validated)
   - [ ] Progress dashboard (2-3 weeks)
   - [ ] Mistake review & adaptive practice (3-4 weeks)

---

## Open Questions Summary

| # | Question | Priority | Decision Method |
|---|----------|----------|-----------------|
| 1 | User demand for profiles? | **High** | User survey (100+ responses) |
| 2 | Password recovery approach? | **High** | Start with "No Recovery", add backup codes if needed |
| 3 | Onboarding timing? | **Medium** | A/B test (immediate vs. after first session) |
| 4 | Data export/delete? | **High** | YES - Required for GDPR/privacy |
| 5 | Teacher features? | **Low** | Defer to Phase 6, validate separately |
| 6 | Adaptive learning? | **Medium** | Start manual (Phase 1), add suggestions (Phase 2-3) |
| 7 | Mistake review mode? | **Medium** | Exact replay first, similar questions later |
| 8 | Performance optimization? | **Medium** | Real-time writes first, optimize if needed |
| 9 | Gamification level? | **Low** | Streaks + personal milestones only (no leaderboards) |
| 10 | Migration for existing users? | **Low** | No - New profiles start fresh |

---

## Conclusion

Anonymous student profiles are a **high-value, high-effort feature** that aligns with product vision and user needs. The feature enables personalized learning, progress tracking, and adaptive practice while maintaining privacy.

**Key Success Factors**:
1. ✅ Validate demand with user survey (>30% say "definitely would use")
2. ✅ Keep profiles 100% optional (don't break existing flow)
3. ✅ Start with simple Phase 1 (core tracking), validate before building Phase 2-3
4. ✅ Resist scope creep (no social features, no teacher features until validated)
5. ✅ Monitor adoption closely (if <20% after 3 months, pivot)

**Recommendation**: **Proceed with user validation (survey + mockups), then make GO/NO-GO decision.**

---

**Next Steps**: Create user survey and technical spike (see "Immediate" section above)

**Estimated Total Effort**: 11-15 weeks (if GO decision)
**Estimated Cost Impact**: +$50-100/month (database writes, auth)
**Expected ROI**: +25% DAU, +50% return rate, foundation for premium features

---

**Status**: ⏳ Awaiting User Validation & GO/NO-GO Decision
**Owner**: Product Team
**Timeline**: Survey results by Week 2, decision by Week 3
