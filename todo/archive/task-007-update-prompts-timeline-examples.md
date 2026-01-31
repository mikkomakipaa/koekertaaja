# Task: Update AI Prompts with Timeline Examples

## Context

- Why this is needed:
  - AI needs examples of sequential questions with year indicators
  - Timeline questions work best with chronological context
  - User wants timeline support across all subjects (not history-only)
  - Examples guide AI to generate better timeline-compatible questions

- Related docs/links:
  - `/src/config/prompt-templates/quiz/english-quiz.txt` (has basic sequential examples)
  - `/src/config/prompt-templates/quiz/math-quiz.txt` (needs timeline examples)
  - `/src/config/prompt-templates/quiz/generic-quiz.txt` (needs timeline examples)
  - User decision: Timeline support flexible per question, not subject-specific

- Related files:
  - `/src/config/prompt-templates/quiz/english-quiz.txt` (update)
  - `/src/config/prompt-templates/quiz/math-quiz.txt` (update)
  - `/src/config/prompt-templates/quiz/generic-quiz.txt` (update)
  - `/src/config/prompt-templates/metadata/*.json` (distributions unchanged)

## Scope

- In scope:
  - Add 2-3 timeline examples with year indicators to each quiz prompt
  - Show both timeline format (with years) and standard format (without years)
  - Update JSON schema examples to include `year` field
  - Add guidance on when to use timeline vs standard sequential
  - Keep existing sequential examples for backward compatibility
  - Add examples across all subjects (history, science, math, literature)

- Out of scope:
  - Changing distribution percentages (10% sequential stays the same)
  - Flashcard prompts (sequential excluded from flashcards)
  - Database changes
  - Component implementation

## Changes

- [ ] Update `/src/config/prompt-templates/quiz/english-quiz.txt`:
  - Add timeline example: Literary timeline (author's life events, publication dates)
  - Add timeline example: Story events with years (historical fiction)
  - Keep existing dialogue ordering example (no years)

- [ ] Update `/src/config/prompt-templates/quiz/math-quiz.txt`:
  - Add timeline example: Mathematical discoveries timeline
  - Add timeline example: Number system evolution (Arabic numerals, zero invention)
  - Keep existing calculation steps example (no years)

- [ ] Update `/src/config/prompt-templates/quiz/generic-quiz.txt`:
  - Add timeline example: Historical events (Finnish history, world history)
  - Add timeline example: Scientific discoveries/inventions
  - Add timeline example: Life cycle events (biology with stages/ages)
  - Keep existing process steps example (no years)

- [ ] Update JSON schema examples in all prompts:
  - Show new `items` format with `text` and `year` fields
  - Show backward-compatible `items` format (strings only)
  - Clarify when to include years vs when to omit

- [ ] Add guidance section: "When to Use Timeline Format"
  - Use years: Historical events, scientific discoveries, biographical timelines
  - Omit years: Process steps, dialogue, text ordering, logical sequences

## Acceptance Criteria

- [ ] Each quiz prompt has at least 2 timeline examples with years
- [ ] Each quiz prompt has at least 1 standard sequential example without years
- [ ] JSON schema shows both item formats (with/without years)
- [ ] Examples cover diverse subjects (history, science, math, literature, biology)
- [ ] Guidance clearly explains when to use timeline format
- [ ] Year values are historically accurate in examples
- [ ] Item text is in Finnish (matching existing prompt language)
- [ ] Examples follow existing prompt structure and formatting

## Testing

- [ ] Tests to run:
  - Generate questions with english-quiz.txt (verify timeline examples work)
  - Generate questions with math-quiz.txt (verify timeline examples work)
  - Generate questions with generic-quiz.txt (verify timeline examples work)
  - Check AI generates questions with year fields when appropriate
  - Check AI generates questions without years for non-chronological topics

- [ ] New/updated tests:
  - Manual: Generate history questions → should include years
  - Manual: Generate process questions → should NOT include years
  - Manual: Verify year values are reasonable (not negative, not year 5000)

## Implementation Notes

### English Prompt Examples

**Add after line 141 (existing sequential example):**

```
   Timeline Format - Literary Events (with years):
   Kysymys: "Järjestä nämä kirjallisen historian tapahtumat aikajärjestykseen:"
   items: [
     {"text": "J.R.R. Tolkien julkaisi Taru sormusten herrasta", "year": 1954},
     {"text": "J.K. Rowling julkaisi ensimmäisen Harry Potter -kirjan", "year": 1997},
     {"text": "William Shakespeare kirjoitti Hamletin", "year": 1600},
     {"text": "Charles Dickens julkaisi Oliver Twistin", "year": 1838}
   ]
   correct_order: [2, 3, 0, 1]  // 1600 -> 1838 -> 1954 -> 1997

   Timeline Format - Historical Fiction Events:
   Kysymys: "Järjestä nämä Second World War -aikakirjan tapahtumat aikajärjestykseen:"
   items: [
     {"text": "World War II ended", "year": 1945},
     {"text": "World War II began", "year": 1939},
     {"text": "D-Day landings in Normandy", "year": 1944},
     {"text": "Pearl Harbor was attacked", "year": 1941}
   ]
   correct_order: [1, 3, 2, 0]  // 1939 -> 1941 -> 1944 -> 1945
```

### Math Prompt Examples

**Add sequential section (currently missing detailed examples):**

```
6. SEQUENTIAL (järjestys):
   - Sopii: matemaattisten löytöjen aikajärjestys, laskutoimituksen vaiheet, algoritmin askeleet
   - Käytä normaali tasolla
   - Normaali taso: 4-6 kohtaa

   Timeline Format - Matemaattiset löydökset (with years):
   Kysymys: "Järjestä nämä matematiikan historian tapahtumat aikajärjestykseen:"
   items: [
     {"text": "Pythagoras todisti suorakulmaisen kolmion lauseen", "year": -530},
     {"text": "René Descartes kehitti koordinaatiston", "year": 1637},
     {"text": "Isaac Newton julkaisi Principia Mathematican", "year": 1687},
     {"text": "Keksittiin nolla ja paikkajärjestelmä Intiassa", "year": 628}
   ]
   correct_order: [0, 3, 1, 2]  // -530 -> 628 -> 1637 -> 1687

   Standard Format - Laskutoimituksen vaiheet (without years):
   Kysymys: "Järjestä nämä vaiheet oikeaan järjestykseen laskeaksesi (3 + 5) × 2:"
   items: [
     "Kerro tulos kahdella: 8 × 2 = 16",
     "Laske sulkujen sisällä: 3 + 5 = 8",
     "Kirjoita vastaus: 16",
     "Lue tehtävä: (3 + 5) × 2"
   ]
   correct_order: [3, 1, 0, 2]  // Read -> Calculate -> Multiply -> Write answer
```

### Generic Prompt Examples

**Update existing sequential section (lines 89-122):**

```
6. SEQUENTIAL (järjestys):
   - Sopii: historialliset tapahtumat, tieteelliset löydöt, prosessien vaiheet, kronologinen järjestys
   - Käytä helppo ja normaali tasoilla
   - Helppo taso: 4 vaihetta, Normaali taso: 5-6 vaihetta

   Timeline Format - Suomen historia (with years):
   Kysymys: "Järjestä nämä Suomen historian tapahtumat aikajärjestykseen:"
   items: [
     {"text": "Suomi liittyi Euroopan unioniin", "year": 1995},
     {"text": "Suomi julistautui itsenäiseksi", "year": 1917},
     {"text": "Talvisota alkoi", "year": 1939},
     {"text": "Helsinki järjesti olympialaiset", "year": 1952}
   ]
   correct_order: [1, 2, 3, 0]  // 1917 -> 1939 -> 1952 -> 1995

   Timeline Format - Tieteelliset keksinnöt (with years):
   Kysymys: "Järjestä nämä keksinnöt aikajärjestykseen:"
   items: [
     {"text": "Alexander Fleming löysi penisilliinin", "year": 1928},
     {"text": "Louis Pasteur kehitti pastöroinnin", "year": 1864},
     {"text": "Marie Curie sai Nobelin radiumtutkimuksesta", "year": 1903},
     {"text": "Watson ja Crick löysivät DNA:n rakenteen", "year": 1953}
   ]
   correct_order: [1, 2, 0, 3]  // 1864 -> 1903 -> 1928 -> 1953

   Timeline Format - Elinkaaren vaiheet (with ages, not years):
   Kysymys: "Järjestä perhosen elinkaaren vaiheet oikeaan järjestykseen:"
   items: [
     {"text": "Aikuinen perhonen (3-4 viikkoa)", "year": 4},
     {"text": "Muna (3-5 päivää)", "year": 1},
     {"text": "Toukka (2-3 viikkoa)", "year": 2},
     {"text": "Kotelo (1-2 viikkoa)", "year": 3}
   ]
   correct_order: [1, 2, 3, 0]  // Muna -> Toukka -> Kotelo -> Perhonen
   Huom: year-kenttä voi olla myös elinkaaren vaihenumero, ei pakollisesti kalenterivuosi

   Standard Format - Prosessin vaiheet (without years):
   Kysymys: "Järjestä nämä fotosynteesiprosessin vaiheet oikeaan järjestykseen:"
   items: [
     "Kasvi tuottaa happea sivutuotteena",
     "Kasvi imee vettä juurillaan",
     "Kasvi ottaa vastaan auringonvaloa lehdissään",
     "Kasvi tuottaa glukoosia energiaksi"
   ]
   correct_order: [1, 2, 3, 0]  // Vesi -> Valo -> Glukoosi -> Happi
```

### JSON Schema Update (All Prompts)

**Update JSON example sections to show both formats:**

```json
// Timeline format (with years)
{
  "question": "Järjestä tapahtumat aikajärjestykseen:",
  "type": "sequential",
  "topic": "Historia",
  "items": [
    {"text": "Tapahtuma 1 kuvaus", "year": 1917},
    {"text": "Tapahtuma 2 kuvaus", "year": 1939},
    {"text": "Tapahtuma 3 kuvaus", "year": 1952},
    {"text": "Tapahtuma 4 kuvaus", "year": 1995}
  ],
  "correct_order": [0, 1, 2, 3],
  "explanation": "Selitys kronologisesta järjestyksestä"
}

// Standard format (without years) - BACKWARD COMPATIBLE
{
  "question": "Järjestä vaiheet oikeaan järjestykseen:",
  "type": "sequential",
  "topic": "Tiede",
  "items": [
    {"text": "Vaihe 1 kuvaus"},
    {"text": "Vaihe 2 kuvaus"},
    {"text": "Vaihe 3 kuvaus"},
    {"text": "Vaihe 4 kuvaus"}
  ],
  "correct_order": [0, 1, 2, 3],
  "explanation": "Selitys prosessin vaiheista"
}
```

### Guidance Section to Add

```
MILLOIN KÄYTTÄÄ TIMELINE-MUOTOA (year-kentän kanssa):
✅ Historialliset tapahtumat (vuosiluvut)
✅ Tieteelliset löydöt ja keksinnöt (vuosiluvut)
✅ Kirjalliset julkaisut (julkaisuvuodet)
✅ Elämäkerralliset tapahtumat (ikävuodet tai kalenterivuodet)
✅ Elinkaaren vaiheet (vaihenumero year-kentässä)

MILLOIN KÄYTTÄÄ TAVALLISTA MUOTOA (ilman year-kenttää):
✅ Prosessien vaiheet (ei aikajärjestystä)
✅ Laskutoimituksen askeleet
✅ Dialogin järjestys
✅ Lauseiden järjestäminen kappaleeksi
✅ Loogiset sarjat (ei kronologiset)
```

**Year Field Guidelines:**
- Use for chronological ordering (historical events, discoveries, publications)
- Use stage numbers for life cycles (1, 2, 3, 4 instead of years)
- Use ages for biographical timelines (5 years old, 18 years old)
- Omit for logical sequences, processes, and non-temporal ordering
- Validate years are reasonable: -3000 to 3000 range (BC to far future)
