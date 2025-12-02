import { Difficulty } from '@/types';

// FLASHCARD-OPTIMIZED QUESTION TYPE DISTRIBUTION
// Focused on active recall and memorization
const FLASHCARD_DISTRIBUTION = {
  fill_blank: 70,     // Best for math facts and formulas
  matching: 20,       // Concepts and definitions
  short_answer: 10,   // Explanations and reasoning
} as const;

export function getMathFlashcardsPrompt(
  questionCount: number,
  grade?: number,
  material?: string,
  identifiedTopics?: string[]
): string {
  // Finnish curriculum-based content for each grade
  const gradeContent = {
    4: `
VUOSILUOKKA 4 - OPETUSSUUNNITELMAN SISÄLTÖ:
- Lukualue: luvut 0-10 000
- Laskutoimitukset: yhteen-, vähennys-, kerto- ja jakolasku
- Kertotaulut: kertotaulut 6-9 opitaan, kertotaulut 1-10 hallitaan
- Desimaalijärjestelmä: kymmenjärjestelmän syventäminen
- Lukujen rakenne: lukujen yhteydet ja jaollisuus
- Perusgeometria: suorakulmio, neliö, kolmio, ympyrä
- Mittaaminen: pituus, massa, aika
- Päässälasku: päässälaskutaitojen harjoittelu`,
    5: `
VUOSILUOKKA 5 - OPETUSSUUNNITELMAN SISÄLTÖ:
- Lukualue: luvut 0-100 000
- Desimaaliluvut: desimaalilukujen käsittelyn syventäminen
- Murtoluvut: murtolukujen peruskäsitteet (1/2, 1/4, 1/3, 1/5, 1/10)
- Prosentit: prosentin käsitteen esittely
- Pinta-ala ja piiri: suorakulmio, neliö
- Tilavuus: kuutio, suorakulmainen särmiö (alkeet)
- Koordinaatisto: koordinaatiston perusteet
- Tilastot: tiedon esittäminen graafisesti`,
    6: `
VUOSILUOKKA 6 - OPETUSSUUNNITELMAN SISÄLTÖ:
- Negatiiviset luvut: negatiivisten lukujen esittely ja laskutoimitukset
- Suhde ja verranto: suhteen käsite, yksinkertaiset verrannot
- Prosentit: prosenttilaskenta (prosenttiyksikkö, prosenttiosuus, perusarvo)
- Yhtälöt: yksinkertaisten yhtälöiden ratkaiseminen
- Geometria: kulmat, kolmioiden ja nelikulmioiden ominaisuudet
- Tilavuus: tilavuuden laskeminen
- Tilastot ja todennäköisyys: keskiarvon laskeminen, todennäköisyyden alkeet`,
  };

  const gradeContext = grade && gradeContent[grade as 4 | 5 | 6]
    ? gradeContent[grade as 4 | 5 | 6]
    : '';

  const gradeNote = grade
    ? `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle ja perustua ${grade}. luokan opetussuunnitelmaan.`
    : '';

  // Format identified topics for the prompt
  const topicsText = identifiedTopics && identifiedTopics.length > 0
    ? identifiedTopics.map((topic, i) => `   ${i + 1}. "${topic}"`).join('\n')
    : '   (Ei aihealueita tunnistettu - käytä materiaalin perusteella tunnistettuja aihealueita)';

  const topicCount = identifiedTopics?.length || 3;
  const questionsPerTopic = Math.ceil(questionCount / topicCount);

  return `# Math Flash Card Creator

**Your Mission:** Create ${questionCount} math flash cards to help a ${grade ? `grade ${grade}` : 'middle-school'} student learn mathematics.

${material ? `**Material to Study:**\n${material}\n\n` : ''}---

## How Flash Cards Work

Flash cards help students **master math facts and formulas** through active recall.
Focus on:
- Remembering formulas and rules
- Understanding concepts
- Practicing calculations
- Clear step-by-step solutions

${gradeContent}
${gradeNote}

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
- **70% fill_blank** – Best for formulas, calculations, and rules
- **20% matching** – Connect concepts and definitions
- **10% short_answer** – Explain why and how

Each card must be one of these three types. See examples below.

---

## Card Type Examples

### 1. FILL_BLANK (Fill in the Blank) — Most Popular for Math!
Perfect for formulas, calculations, and rules.

**Structure:**
- Missing number, operation, or formula
- Context helps student solve it
- Answer is a NUMBER or SHORT MATH EXPRESSION

**Examples:**

**Calculation:**
\`\`\`
Question: "$$8 \\times 7 = ____$$"
Answer: "56"
Explanation: "Times table 7: 8 × 7 = 56. Memory trick: 7 × 8 is same as 7 × 10 - 7 × 2 = 70 - 14 = 56."
\`\`\`

**Formula:**
\`\`\`
Question: "Suorakulmion pinta-ala lasketaan kaavalla: Pinta-ala = ____ × ____"
Answer: "leveys × korkeus"
Also accept: ["leveys × korkeus", "l × k", "pituus × leveys", "$$l \\times k$$"]
Explanation: "Rectangle area = width × height. Example: if width is 5 cm and height is 3 cm, then area = 5 × 3 = 15 cm²."
\`\`\`

**Simple Equation:**
\`\`\`
Question: "Ratkaise: $$x + 5 = 12$$, niin $$x = ____$$"
Answer: "7"
Explanation: "Subtract 5 from both sides: x + 5 - 5 = 12 - 5, so x = 7. Check: 7 + 5 = 12 ✓"
\`\`\`

---

### 2. MATCHING (Matching Pairs)
Connect concepts and definitions.

**Structure:**
- Concepts and definitions
- Numbers and their properties
- Formulas and their names
- Use 3-6 pairs (not too many!)

**Example:**
\`\`\`
Question: "Yhdistä geometriset käsitteet niiden määritelmiin:"
Pairs: [
  {"left": "Suorakulmio", "right": "Neljä kulmaa, kaikki 90 astetta"},
  {"left": "Neliö", "right": "Neljä yhtä pitkää sivua, kaikki kulmat 90 astetta"},
  {"left": "Kolmio", "right": "Kolme kulmaa, kulmien summa 180 astetta"}
]
Explanation: "Basic geometric shapes. A square is a special rectangle where all sides are equal."
\`\`\`

---

### 3. SHORT_ANSWER
Explain the "why" and "how."

**Structure:**
- Explanations and reasoning
- "Why?" and "How?" questions
- Answer is 3-10 words

**Example:**
\`\`\`
Question: "Miksi kertolaskussa lukujen järjestyksellä ei ole väliä? (esim. 3 × 4 = 4 × 3)"
Answer: "Kertolaskun vaihdantalaki"
Explanation: "The commutative law of multiplication: a × b = b × a. This means 3 × 4 = 12 and 4 × 3 = 12. Think: 3 boxes with 4 apples = 4 boxes with 3 apples."
\`\`\`

---

## Handling Numeric Answers

**For flexible grading, include alternative formats:**
- Give main answer in `correct_answer`
- Add variants in `acceptable_answers`:
  * Decimals and fractions: `"0.5"` and `"$$\\frac{1}{2}$$"` and `"1/2"` and `"0,5"`
  * Percentages: `"50%"` and `"0.5"` and `"0,5"`
  * Different notations: `"3,14"` and `"3.14"`
  * Formula forms: `"a × b"` and `"ab"` and `"a * b"`

---

## Writing Great Explanations

Help students understand the process:
- Show CALCULATION STEPS
- Explain WHY we calculate this way
- Add MEMORY TRICKS when possible
- Include a CHECK at the end
- Keep it clear: 30-400 characters

---

## JSON Output Format

**Return ONLY a JSON array** (no other text):

\`\`\`json
[
  {
    "question": "Question text (can include LaTeX like $$2x + 3$$)",
    "type": "fill_blank" | "matching" | "short_answer",
    "topic": "Laskutoimitukset",  // Required! Use exact topic name from list above
    "correct_answer": "the right answer (number or math expression)",
    "acceptable_answers": ["alternative 1", "alternative 2"],  // optional
    "pairs": [{"left": "concept", "right": "definition"}],  // only for matching, 3-6 pairs
    "explanation": "Clear explanation with steps and memory tricks (30+ chars)"
  }
]
\`\`\`

---

## Quick Checklist

Before you respond, verify:
- ✓ Every card has a topic tag (exact spelling from list)
- ✓ Cards are balanced across topics (~10 per topic)
- ✓ Card types follow ratio: 70% fill_blank, 20% matching, 10% short_answer
- ✓ Created exactly ${questionCount} cards total
- ✓ Using LaTeX notation for math: `$$2x + 3$$`
- ✓ Showing CALCULATION STEPS in explanations (30+ chars)
- ✓ Output is pure JSON (no extra text)

**Remember:** Cards without topic tags will be rejected automatically.

---
`;
}