import { Difficulty } from '@/types';

// FLASHCARD-OPTIMIZED QUESTION TYPE DISTRIBUTION
// Focused on active recall and memorization
const FLASHCARD_DISTRIBUTION = {
  fill_blank: 60,      // Best for cued recall
  short_answer: 30,    // Deep learning, active production
  matching: 10,        // Relational learning
} as const;

export function getEnglishFlashcardsPrompt(
  questionCount: number,
  grade?: number,
  material?: string,
  identifiedTopics?: string[]
): string {
  // Finnish curriculum-based content for A1-English
  const gradeContent = {
    4: `
VUOSILUOKKA 4 - A1-ENGLANNIN OPETUSSUUNNITELMA:
- Sanasto: perussanasto (itsestä, perheestä, koulusta ja harrastuksista), n. 200-300 sanaa
- Aikamuodot: preesens (yksinkertainen nykyaika)
- Lauserakenteet: yksinkertaiset lyhyet lauseet
- Kulttuurinen osaaminen: englanninkieliset maat, tervehdykset
- Viestintätilanteet: esittäytyminen, tervehtiminen, yksinkertaiset kysymykset`,
    5: `
VUOSILUOKKA 5 - A1-ENGLANNIN OPETUSSUUNNITELMA:
- Sanasto: laajennettu perussanasto, n. 400-600 sanaa
- Aikamuodot: preesens ja imperfekti (yksinkertainen menneisyys)
- Kielioppi: monikko, omistusmuodot, prepositiot
- Lauserakenteet: yhdyslauseet (and, but, or)
- Viestintätilanteet: kertominen, yksinkertainen kuvaus, mielipiteen ilmaisu
- Kulttuurinen osaaminen: englanninkielisten maiden tavat`,
    6: `
VUOSILUOKKA 6 - A1-ENGLANNIN OPETUSSUUNNITELMA:
- Sanasto: monipuolinen sanasto, n. 600-800 sanaa
- Aikamuodot: preesens, imperfekti, perfekti (alkeet)
- Kielioppi: modaaliverbit (can, must, should), vertailumuodot
- Lauserakenteet: monimutkaisemmat lauseet, sivulauseet (because, when, if)
- Viestintätilanteet: argumentointi, selittäminen, keskustelu
- Kulttuurinen osaaminen: elämä englanninkielisissä maissa`,
  };

  const gradeContext = grade && gradeContent[grade as 4 | 5 | 6]
    ? gradeContent[grade as 4 | 5 | 6]
    : '';

  const gradeNote = grade
    ? `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle ja perustua ${grade}. luokan A1-englannin opetussuunnitelman sisältöön.`
    : '';

  // Format identified topics for the prompt
  const topicsText = identifiedTopics && identifiedTopics.length > 0
    ? identifiedTopics.map((topic, i) => `   ${i + 1}. "${topic}"`).join('\n')
    : '   (Ei aihealueita tunnistettu - käytä materiaalin perusteella tunnistettuja aihealueita)';

  const topicCount = identifiedTopics?.length || 3;
  const questionsPerTopic = Math.ceil(questionCount / topicCount);

  return `# English Flash Card Creator

**Your Mission:** Create ${questionCount} flash cards to help a ${grade ? `grade ${grade}` : 'middle-school'} student learn English.

${material ? `**Material to Study:**\n${material}\n\n` : ''}---

## How Flash Cards Work

Flash cards help students **actively recall** what they've learned (not just recognize answers).
Keep questions simple, focused on ONE thing at a time, and give helpful explanations.

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
- **60% fill_blank** – Best for vocabulary and grammar practice
- **30% short_answer** – Deep understanding, requires production
- **10% matching** – Connect related concepts

Each card must be one of these three types. See examples below.

---

## Card Type Examples

### 1. FILL_BLANK (Fill in the Blank)
Perfect for vocabulary and grammar practice.

**Structure:**
- One clear blank to fill
- Context helps student remember
- Answer is ONE WORD or SHORT PHRASE

**Example:**
```
Question: "I ___ (mennä) to school every day."
Answer: "go"
Also accept: ["go", "walk", "drive"] (if contextually correct)
Explanation: "Present tense form. With 'I' we use the base verb form."
```

---

### 2. SHORT_ANSWER
Tests deeper understanding and active production.

**Structure:**
- Open question requiring thought
- Answer is 1-3 words or short sentence
- Student must construct the answer

**Example:**
```
Question: "Miten muodostetaan kysymyslause verbillä 'do'?"
Answer: "Do/Does + subject + verb"
Explanation: "In questions, the auxiliary 'do/does' comes first, then subject, then main verb in base form."
```

---

### 3. MATCHING (Matching Pairs)
Connects related concepts.

**Structure:**
- Words and definitions/translations
- Verb forms
- Sentences and translations
- Use 3-6 pairs (not too many!)

**Example:**
```
Question: "Yhdistä englanninkieliset sanat suomenkielisiin käännöksiin:"
Pairs: [
  {"left": "happy", "right": "iloinen"},
  {"left": "sad", "right": "surullinen"},
  {"left": "angry", "right": "vihainen"}
]
Explanation: "Basic emotions vocabulary. These are the most common adjectives for expressing feelings."
```

---

## Writing Great Explanations

Help students understand WHY, not just WHAT:
- Explain why the answer is correct
- Give context and examples
- Add memory tricks when possible
- Connect to curriculum topics
- Keep it friendly: 20-300 characters

**Answer Language:**
- Vocabulary translations: English OR Finnish (depending on direction)
- Verb forms/sentence completion: English
- Grammar rules/theory: Finnish

════════════════════════════════════════════════════════════════
📋 JSON VASTAUSMUOTO - NOUDATA TARKASTI
════════════════════════════════════════════════════════════════

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti suomeksi (voi sisältää LaTeX-merkintää)",
    "type": "fill_blank" | "short_answer" | "matching",  // VAIN NÄMÄ KOLME TYYPPIÄ
    "topic": "Grammar" | "Vocabulary" | "Pronunciation", // ⚠️ PAKOLLINEN - JOKA kysymyksessä
    "correct_answer": "oikea vastaus",
    "acceptable_answers": ["vaihtoehtoinen muoto 1", "vaihtoehtoinen muoto 2"], // vapaaehtoinen
    "pairs": [{"left": "kohta1", "right": "kohta2"}], // vain matching-tyypille, 3-6 paria
    "explanation": "Selkeä ja opettavainen selitys (vähintään 20 merkkiä). Sisällytä esimerkkejä ja kontekstia."
  }
]

════════════════════════════════════════════════════════════════
✅ TARKISTUSLISTA ENNEN VASTAAMISTA
════════════════════════════════════════════════════════════════

Varmista että:
✓ JOKAINEN kysymys sisältää "topic"-kentän (ei yhtään tyhjää!)
✓ Kysymykset jakautuvat TASAISESTI aihealueiden kesken
✓ JOKA kysymys on tyypiltään: fill_blank (60%), short_answer (30%), TAI matching (10%)
✓ Loit TÄSMÄLLEEN ${questionCount} kysymystä
✓ Jokainen kysymys keskittyy YHTEEN ASIAAN
✓ Selitykset ovat OPETTAVAISIA (vähintään 20 merkkiä)
✓ Vastaat PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä

⚠️ KYSYMYKSET ILMAN TOPIC-KENTTÄÄ HYLÄTÄÄN AUTOMAATTISESTI

════════════════════════════════════════════════════════════════
`;
}