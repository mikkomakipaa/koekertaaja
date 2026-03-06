# Fraction Answer Entry UX Plan

## Feature Scope and Assumptions

- Feature statement:
  Improve open-answer handling for fraction and mixed-number questions so grade 4-6 students can answer correctly without having to guess the app's preferred notation.
- Primary persona:
  Emma, a grade 5 student who is comfortable on iPad but gets discouraged by math question formatting friction.
- Secondary personas:
  Parents reviewing mistakes after practice and teachers validating whether generated questions are usable as-is.
- Core use cases:
  - Student answers a fraction-format short-answer question on iPad.
  - Student sees the allowed answer shape before submitting.
  - Student recovers quickly after a format-related miss.
- Assumptions:
  - The main problem is not answer checking strictness alone; it is low input affordance for fraction notation.
  - The current generic `Textarea` in short-answer mode is too open-ended for structured numeric answers.
  - We should improve confidence and clarity without introducing a math editor or keyboard-heavy workflow in v1.

## Repository-Grounded Constraints

- Persona fit:
  `DWF/PERSONAS.md` says Emma prefers touch-first interaction, short sessions, and abandons confusing flows quickly.
- Journey fit:
  `DWF/USER_JOURNEYS.md` emphasizes instant confidence, low frustration after mistakes, and clear recovery after incorrect answers.
- UI fit:
  `DWF/DESIGN_GUIDELINES.md` requires large touch targets, 16px+ text, mobile-first interaction, and positive feedback without shaming.
- Existing flow:
  [ShortAnswer.tsx](/Users/mikko.makipaa/koekertaaja/src/components/questions/ShortAnswer.tsx) currently uses a generic `Textarea` with a generic placeholder.
  [page.tsx](/Users/mikko.makipaa/koekertaaja/src/app/play/[code]/page.tsx) passes only broad question-type placeholder hints.

## Problem Definition

Current friction for fraction-based open answers:

- The student must infer the expected input shape from the question text alone.
- A large `Textarea` implies a prose answer even when the expected answer is a compact math form like `4/3`.
- After submitting, the UI explains the answer, but recovery comes too late.
- The generic blue example-answer box is informative but does not teach the expected notation before submission.

Observed mismatch from the example screen:

- Question asks for a mixed-number conversion.
- Student is shown a large freeform text area instead of a structured math-friendly input.
- The app marks the answer as incorrect/uncertain in a way that feels like content failure, even when the real issue may be notation or confidence.

## UX Hypothesis

If fraction-like short-answer questions expose the expected answer shape before submission and use a more compact structured response surface, students will:

- submit faster
- make fewer format-driven mistakes
- feel more confident in math practice
- need less post-answer explanation for notation alone

## Recommended Design Direction

### Direction

Keep the current answer-checking model, but add a fraction-aware answer entry pattern for structured math answers.

### Proposed interaction model

For fraction and mixed-number short-answer / fill-blank questions:

1. Replace the large default `Textarea` with a compact math answer composer.
2. Show a visible notation hint above the input:
   - `Kirjoita murtoluku muodossa 4/3`
   - or `Voit kirjoittaa myös sekalukuna 1 1/3`, when allowed.
3. Offer quick-entry chips when the answer shape is obvious:
   - `a/b`
   - `sekalukuna`
   - `desimaalina`
4. Use a single-line input by default for structured numeric answers.
5. Show accepted formats before submit, not only after submit.
6. In feedback state, separate:
   - content correctness
   - accepted notation guidance

### Explicit non-goals for v1

- No full visual fraction keypad
- No rich math editor
- No OCR-like parsing of arbitrary handwritten text
- No answer-evaluation rewrite unless required by UX validation

## Journey Design

### Journey A: Emma answers a fraction conversion question

1. Entry trigger
- Action: Emma opens a math question in normal play.
- Touchpoint: `/play/[code]` question card.
- Thought: "I know the math, but how should I write it here?"
- Emotion: slightly uncertain.
- Friction: current textarea suggests prose, not notation.
- Opportunity: pre-answer notation hint.

2. Understand step
- Action: Emma reads the prompt and sees the answer box.
- Touchpoint: short-answer component.
- Thought: "Ahaa, tähän kuuluu kirjoittaa 4/3."
- Emotion: more confident.
- Friction risk: if hint is hidden or too subtle, confidence does not improve.
- Opportunity: explicit notation helper text and examples.

3. Commitment step
- Action: Emma taps the compact input and types `4/3`.
- Touchpoint: focused math input.
- Thought: "This feels like a math answer, not an essay."
- Emotion: in control.
- Friction risk: multiline box still feels too heavy on iPad.
- Opportunity: single-line structured input with larger text.

4. Core interaction loop
- Action: Emma submits.
- Touchpoint: primary CTA + answer validation.
- Thought: "Now I can see whether the math was right."
- Emotion: neutral to hopeful.
- Friction risk: format and correctness are mixed into one generic failure state.
- Opportunity: distinct messaging for "oikea idea, eri esitystapa" if needed.

5. Feedback and recovery
- Action: Emma sees feedback.
- Touchpoint: answer feedback panel.
- Thought: "If wrong, I understand whether it was the math or the format."
- Emotion: less discouraged.
- Friction risk: current feedback feels binary.
- Opportunity: clearer error framing for notation mismatch.

6. Completion and continuation
- Action: Emma moves to next question.
- Touchpoint: next-question CTA.
- Thought: "I know how to answer these now."
- Emotion: steady confidence.
- Opportunity: reduced drop-off in math sessions.

### Edge path

- Student enters `1 1/3` when canonical answer is `4/3`.
- Desired behavior:
  accepted when pedagogically valid, or clearly marked as an allowed alternative shape if evaluation remains strict.

## Validation Findings

### P0

- `ShortAnswer` currently uses a large generic textarea for all open responses.
  Evidence: [ShortAnswer.tsx](/Users/mikko.makipaa/koekertaaja/src/components/questions/ShortAnswer.tsx)
  Impact: poor fit for structured numeric/fraction answers on mobile.
  Confidence: high.

### P1

- Placeholder hints are driven only by broad question type, not answer shape.
  Evidence: [page.tsx](/Users/mikko.makipaa/koekertaaja/src/app/play/[code]/page.tsx)
  Impact: students do not learn expected notation until after submission.
  Confidence: high.

### P1

- The current feedback pattern over-emphasizes post-answer example comparison.
  Evidence: [ShortAnswer.tsx](/Users/mikko.makipaa/koekertaaja/src/components/questions/ShortAnswer.tsx), `DWF/USER_JOURNEYS.md`
  Impact: recovery is delayed and feels more like correction than guidance.
  Confidence: medium.

### P2

- There is no explicit design contract for structured math answers vs prose answers.
  Evidence: current shared short-answer component architecture.
  Impact: similar friction will recur for decimals, percentages, and unit conversions.
  Confidence: high.

## Open Questions to Validate

1. Resolved: mixed-number and improper-fraction forms are both accepted by default when they are numerically equivalent for grade 4-6 open math answers.
2. Resolved: the UI infers expected answer format from answer candidates first, with question-text heuristics as a fallback.
3. Open for later iteration: segmented numerator/denominator fields are still deferred until manual QA proves the single-line input is insufficient on iPad.
4. Resolved: the UI shows the preferred canonical form plus equivalent accepted forms before submit whenever they are pedagogically valid.
5. Resolved for v1: structured fraction affordances apply anywhere the accepted-answer set looks like structured math, not only in math subject sets.

## Resolved Product Decision

- Canonical display:
  The primary `correct_answer` remains the preferred display form shown in hints and explanations.
- Placeholder rule:
  If a helper example contains LaTeX delimiters such as `$$\frac{4}{3}$$`, helper cards render the math with `MathText`, but the compact input placeholder falls back to plain text such as `Esim. 4/3` so raw LaTeX never appears inside the field.
- Equivalent acceptance:
  Fractions, mixed numbers, decimals, and percentages are accepted across equivalent forms when the values match numerically.
- Hint policy:
  Pre-submit hints show the preferred form first and list alternate accepted notation when available.
- Feedback policy:
  Incorrect structured-math submissions keep a notation hint visible after grading so students can distinguish formatting friction from concept mistakes.
- Guardrail:
  We still reject numerically different answers even when the notation style is valid.

## Instrumentation Decision

- Structured math submissions now emit a single `Structured math answer submission` log event from `/play/[code]`.
- Logged fields:
  `submitLatencyMs`, `answerEditCount`, `answerClearCount`, `notationHintShown`, `acceptedFormats`, `matchType`, `userNotation`, `expectedNotations`, `notationFrictionSignal`, `acceptedEquivalentForm`.
- Friction signal meanings:
  `accepted_equivalent` = the answer was correct but used a different equivalent notation.
  `likely_format_issue` = the student attempted math notation, but the input shape was malformed.
  `content_misunderstanding` = the answer used valid math notation but the value was still wrong.

## Regression Matrix

| Expected answer | User answer | Expected result | Signal |
|---|---|---|---|
| `4/3` | `1 1/3` | accepted | `accepted_equivalent` |
| `1 1/3` | `4/3` | accepted | `accepted_equivalent` |
| `0,25` | `25%` | accepted | `accepted_equivalent` |
| `25%` | `1/4` | accepted | `accepted_equivalent` |
| `3/4` | `0.75` | accepted | `accepted_equivalent` |
| `4/3` | `1//3` | rejected | `likely_format_issue` |
| `4/3` | `5/3` | rejected | `content_misunderstanding` |
| prose answer | prose variant | existing lenient behavior | `none` |

## Manual QA Still Required

- iPad soft keyboard:
  Confirm `/` and `%` entry is obvious in both portrait and landscape orientations.
- Mobile correction loop:
  Confirm the notation hint remains visible after an incorrect fraction answer without pushing the primary CTA off-screen.
- Mixed-number spacing:
  Confirm `1 1/3` with one space is easy to enter on iPad and that accidental double spaces are tolerated.
- Decimal locale:
  Confirm both `0,25` and `0.25` feel discoverable when the question expects a decimal answer.
- Accessibility:
  Confirm screen readers announce notation hints before the answer field for compact structured-math inputs.

## Recommended Incremental Approach

### Phase 1

- Add a fraction-aware answer mode for `short_answer` and `fill_blank`.
- Detect likely structured math answers via lightweight heuristics.
- Swap textarea to single-line input for those cases.
- Show pre-submit notation help and accepted examples.

### Implementation note (2026-03-02)

- v1 detects structured fraction entry from answer candidates first, with question-text keyword fallback for fraction and mixed-number prompts.
- When both improper-fraction and mixed-number examples exist, the UI shows both before submit and repeats the notation guidance after an incorrect attempt.

### Phase 2

- Add optional answer-form chips:
  - `murtolukuna`
  - `sekalukuna`
  - `desimaalina`
- Improve feedback wording for notation mismatch.

### Phase 3

- If needed, add segmented fraction input for younger users on iPad.

## Validation Plan

### UX checks

- Student can tell expected notation before typing.
- Student can enter `4/3` quickly on iPad without scrolling or multiline editing friction.
- Wrong-answer feedback distinguishes math misunderstanding from notation mismatch.

### Product metrics to instrument

- fraction-question submit time
- clear-answer / rewrite count before submit
- incorrect-to-correct recovery rate on fraction questions
- share of fraction-question misses caused by equivalent-form mismatch

### Test plan

- Component tests for structured math input rendering.
- Unit tests for answer-format detection heuristics.
- Integration tests for accepted equivalent fraction forms.
- Manual mobile QA on iPad-sized viewport for mixed numbers, fractions, and decimals.

## Recommended Implementation Tasks

1. Define the fraction-answer interaction contract and implement the fraction-aware input variant.
2. Add validation, instrumentation, and regression coverage for fraction-format flows.
