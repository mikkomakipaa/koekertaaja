import { Difficulty } from '@/types';

// FLASHCARD-OPTIMIZED QUESTION TYPE DISTRIBUTION
// Balanced for content subjects (history, biology, environmental studies, society, etc.)
const FLASHCARD_DISTRIBUTION = {
  fill_blank: 50,      // Facts, definitions, key terms
  short_answer: 30,    // Explanations, understanding
  matching: 20,        // Relationships, connections
} as const;

export function getGenericFlashcardsPrompt(
  questionCount: number,
  grade?: number,
  material?: string,
  identifiedTopics?: string[]
): string {
  // Generic grade-based guidance
  const gradeGuidance = grade
    ? `
GRADE ${grade} GUIDANCE:
${grade <= 5 ? '- Use simple vocabulary and short sentences\n- Focus on concrete examples and basic facts\n- Keep explanations clear and straightforward' : ''}
${grade === 6 ? '- Balance concrete and abstract concepts\n- Introduce causal relationships gently\n- Use age-appropriate terminology with explanations' : ''}
${grade >= 7 ? '- Allow more depth and detail\n- Include causal reasoning and analysis\n- Use subject-specific terminology appropriately' : ''}
`
    : '';

  const gradeNote = grade
    ? `\nCards should match grade ${grade} difficulty level - age-appropriate vocabulary and complexity.`
    : '';

  // Format identified topics for the prompt
  const topicsText = identifiedTopics && identifiedTopics.length > 0
    ? identifiedTopics.map((topic, i) => `   ${i + 1}. "${topic}"`).join('\n')
    : '   (No topics identified - distribute evenly across material themes)';

  const topicCount = identifiedTopics?.length || 3;

  return `# Flash Card Creator

**Your Mission:** Create ${questionCount} flash cards to help a ${grade ? `grade ${grade}` : 'middle-school'} student learn this material.

${material ? `**Material to Study:**\n${material}\n\n` : ''}---

## How Flash Cards Work

Flash cards help students **actively recall** what they've learned (not just recognize answers).
Focus on:
- Key facts and concepts students truly need to remember
- Clear, simple questions with helpful explanations
- Connections between ideas
- Real-world examples when possible

${gradeGuidance}${gradeNote}

---

## Topics You'll Cover

Create **exactly 10 cards per topic** to ensure balanced practice:

${topicsText}

**Important:**
- Tag every card with its topic (copy the exact spelling from above)
- Distribute cards evenly: ~10 per topic (you can vary by ±1 if needed)
- Don't invent new topics—stick to the list above

---

## Card Types (Use Only These 3)

**You'll create 3 types of cards in this ratio:**
- **50% fill_blank** – Best for facts, definitions, and key terms
- **30% short_answer** – For understanding and explanations
- **20% matching** – Connect related concepts

Each card must be one of these three types. See examples below.

---

## Card Type Examples

### 1. FILL_BLANK (Fill in the Blank)
Perfect for key facts and definitions.

**Structure:**
- One clear blank to fill
- Context helps student remember
- Answer is ONE WORD or SHORT PHRASE

**Example:**
\`\`\`
Question: "Fotosynteesin avulla kasvit muuttavat auringon valon ja hiilidioksidin ____ ja hapeksi."
Answer: "glukoosiksi"
Also accept: ["sokeriksi", "energiaksi"]
Explanation: "Photosynthesis converts sunlight and CO₂ into glucose (sugar) and oxygen. This is how plants make their own food and release oxygen for us to breathe."
\`\`\`

---

### 2. SHORT_ANSWER
Tests understanding and explanation.

**Structure:**
- Open question requiring thought
- Answer is 1-3 sentences or key phrase
- Student must construct the answer

**Example:**
\`\`\`
Question: "Miksi dinosaurukset kuolivat sukupuuttoon noin 65 miljoonaa vuotta sitten?"
Answer: "Asteroidin törmäys ja ilmastonmuutos"
Also accept: ["Asteroidi osui maahan", "Suuri tulivuoritoiminta ja ilmaston muutos"]
Explanation: "A massive asteroid hit Earth, causing dust clouds that blocked the sun. This led to climate change, plant death, and eventually dinosaur extinction. Only smaller animals survived."
\`\`\`

---

### 3. MATCHING (Matching Pairs)
Connect related concepts and relationships.

**Structure:**
- Concepts and definitions
- Causes and effects
- People and achievements
- Places and characteristics
- Use 3-6 pairs (not too many!)

**Example:**
\`\`\`
Question: "Yhdistä Pohjoismaiden pääkaupungit oikeisiin maihin:"
Pairs: [
  {"left": "Helsinki", "right": "Suomi"},
  {"left": "Tukholma", "right": "Ruotsi"},
  {"left": "Oslo", "right": "Norja"},
  {"left": "Kööpenhamina", "right": "Tanska"}
]
Explanation: "Nordic countries and their capitals. These five nations share cultural and historical ties in Northern Europe."
\`\`\`

---

## Writing Great Explanations

Help students understand WHY, not just WHAT:
- Explain why the answer is correct
- Give context and real-world examples
- Connect to bigger concepts when possible
- Use memory tricks or analogies
- Keep it friendly and clear: 20-300 characters

**Tone:**
- Friendly and encouraging
- No jargon unless explained
- Stick strictly to provided material
- No scary or overly complex language

---

## JSON Output Format

**Return ONLY a JSON array** (no other text):

\`\`\`json
[
  {
    "question": "Question text in Finnish",
    "type": "fill_blank" | "short_answer" | "matching",
    "topic": "Topic name",  // Required! Use exact topic name from list above
    "correct_answer": "the right answer",
    "acceptable_answers": ["alternative 1", "alternative 2"],  // optional
    "pairs": [{"left": "item1", "right": "item2"}],  // only for matching, 3-6 pairs
    "explanation": "Clear, helpful explanation (20-300 chars). Include context and examples."
  }
]
\`\`\`

---

## Quick Checklist

Before you respond, verify:
- ✓ Every card has a topic tag (exact spelling from list)
- ✓ Cards are balanced across topics (~10 per topic)
- ✓ Card types follow ratio: 50% fill_blank, 30% short_answer, 20% matching
- ✓ Created exactly ${questionCount} cards total
- ✓ Each question focuses on ONE concept
- ✓ Explanations are helpful and age-appropriate (20+ chars)
- ✓ Output is pure JSON (no extra text)
- ✓ Stuck to provided material (no new facts added)

**Remember:** Cards without topic tags will be rejected automatically.

---
`;
}
