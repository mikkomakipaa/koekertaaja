# Subject, Difficulty, Grade & Template Mapping Diagram

**Last Updated:** 2026-02-11 (Revised)
**Purpose:** Complete mapping of subjects, difficulties, grade levels, and prompt templates used in question generation

⚠️ **Note:** This document describes the CURRENT system, which has known limitations. See "Known Issues & Planned Improvements" section at the end for upcoming changes.

---

## 📊 Overview

```
17 Subjects → 6 Subject Types → Multiple Templates → Question Generation
   ↓              ↓                    ↓
Grades 4-6    Helppo/Normaali    Core + Type + Subject + Skills
```

---

## 🎯 Subject → Subject Type Mapping

### **LANGUAGE (Kielet) - 3 subjects**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🇬🇧 ENGLISH (english)                                           │
├─────────────────────────────────────────────────────────────────┤
│ Type: language                                                   │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ✅ YES                                          │
│                                                                  │
│ Templates Used:                                                  │
│  ├─ Core: format.txt, topic-tagging.txt, skill-tagging.txt     │
│  ├─ Type: types/language.txt                                    │
│  ├─ Subject: subjects/english.json (grades 4,5,6 curriculum)    │
│  ├─ Skills: skills/language-skills.json                         │
│  └─ Distributions: grade-distributions.json [language]          │
│                                                                  │
│ Quiz Mode (Helppo/Normaali):                                    │
│  └─ Grade-specific distributions (4/5/6)                        │
│                                                                  │
│ Flashcard Mode:                                                  │
│  ├─ flashcard-rules.txt (general)                              │
│  ├─ language-flashcard-rules.txt (language-specific)           │
│  └─ ContentType: vocabulary | grammar | mixed                   │
│     ├─ vocabulary → Standard flashcard format                   │
│     └─ grammar → Rule-based format (isRuleBasedSubject=true)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🇫🇮 FINNISH (finnish) - Äidinkieli ja kirjallisuus             │
├─────────────────────────────────────────────────────────────────┤
│ Type: language                                                   │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ✅ YES                                          │
│                                                                  │
│ Templates: Same as English (language type)                      │
│  └─ Subject: subjects/finnish.json                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🇸🇪 SWEDISH (swedish) - Ruotsi                                 │
├─────────────────────────────────────────────────────────────────┤
│ Type: language                                                   │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ✅ YES                                          │
│                                                                  │
│ Templates: Same as English (language type)                      │
│  └─ Subject: No specific curriculum file (uses generic)         │
└─────────────────────────────────────────────────────────────────┘
```

---

### **MATH (Matematiikka & Luonnontieteet) - 4 subjects**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔢 MATH (math) - Matematiikka                                   │
├─────────────────────────────────────────────────────────────────┤
│ Type: math                                                       │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│ Rule-Based: ✅ ALWAYS (formulas, calculations)                  │
│                                                                  │
│ Templates Used:                                                  │
│  ├─ Core: format.txt, topic-tagging.txt, skill-tagging.txt     │
│  ├─ Type: types/math.txt                                        │
│  ├─ Subject: subjects/math.json (grades 4,5,6 curriculum)       │
│  ├─ Skills: skills/math-skills.json                             │
│  └─ Distributions: grade-distributions.json [math]              │
│                                                                  │
│ Quiz Mode (Helppo/Normaali):                                    │
│  └─ Grade-specific distributions (4/5/6)                        │
│                                                                  │
│ Flashcard Mode:                                                  │
│  ├─ flashcard-rules.txt → RULE-BASED FORMAT                    │
│  ├─ Questions: "Miten lasketaan...?" not "Laske 4+5"          │
│  └─ Answers: Rule + Example in explanation                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ⚛️ PHYSICS (physics) - Fysiikka                                 │
├─────────────────────────────────────────────────────────────────┤
│ Type: math (rule-based like math)                               │
│ Requires Grade: ✅ YES (7-9 typically)                          │
│ Grammar Support: ❌ NO                                           │
│ Rule-Based: ✅ ALWAYS (physics laws, formulas)                  │
│                                                                  │
│ Templates: Same as Math (math type)                             │
│  └─ Subject: No specific curriculum file                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🧪 CHEMISTRY (chemistry) - Kemia                                │
├─────────────────────────────────────────────────────────────────┤
│ Type: math (formula-based like math)                            │
│ Requires Grade: ✅ YES (7-9 typically)                          │
│ Grammar Support: ❌ NO                                           │
│ Rule-Based: ✅ ALWAYS (chemical equations, reactions)           │
│                                                                  │
│ Templates: Same as Math (math type)                             │
│  └─ Subject: No specific curriculum file                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔬 BIOLOGY (biology) - Biologia                                 │
├─────────────────────────────────────────────────────────────────┤
│ Type: written (fact-based, not formula-based)                   │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│ Rule-Based: ❌ NO (factual knowledge)                            │
│                                                                  │
│ Templates: See WRITTEN section below                            │
│  └─ Subject: subjects/biology.json                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### **WRITTEN (Teoria-aineet) - 4 subjects**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📜 HISTORY (history) - Historia                                 │
├─────────────────────────────────────────────────────────────────┤
│ Type: written                                                    │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates Used:                                                  │
│  ├─ Core: format.txt, topic-tagging.txt, skill-tagging.txt     │
│  ├─ Type: types/written.txt                                     │
│  ├─ Subject: subjects/history.json                              │
│  ├─ Skills: skills/written-skills.json                          │
│  └─ Distributions: grade-distributions.json [written]           │
│                                                                  │
│ Quiz Mode (Helppo/Normaali/Vaikea):                             │
│  └─ Grade-specific distributions (4/5/6)                        │
│  └─ Sequential questions for timelines (15% recommended)        │
│                                                                  │
│ Flashcard Mode:                                                  │
│  └─ flashcard-rules.txt (standard fact-based format)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🏛️ SOCIETY (society) - Yhteiskuntaoppi                         │
├─────────────────────────────────────────────────────────────────┤
│ Type: written                                                    │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates: Same as History (written type)                       │
│  └─ Subject: No specific curriculum file (society.json missing) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔬 BIOLOGY (biology) - Biologia                                 │
│ [See above in Math section - listed here for completeness]      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🌍 ENVIRONMENTAL STUDIES (environmental-studies) - Ympäristöoppi│
├─────────────────────────────────────────────────────────────────┤
│ Type: written                                                    │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates: Same as History (written type)                       │
│  └─ Subject: subjects/environmental-studies.json                │
└─────────────────────────────────────────────────────────────────┘
```

---

### **GEOGRAPHY (Maantieto) - 1 subject**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🗺️ GEOGRAPHY (geography) - Maantieto                           │
├─────────────────────────────────────────────────────────────────┤
│ Type: geography                                                  │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates Used:                                                  │
│  ├─ Core: format.txt, topic-tagging.txt, skill-tagging.txt     │
│  ├─ Type: types/geography.txt                                   │
│  ├─ Subject: subjects/geography.json                            │
│  ├─ Skills: skills/geography-skills.json                        │
│  └─ Distributions: grade-distributions.json [geography]         │
│                                                                  │
│ Quiz Mode (Helppo/Normaali):                                    │
│  └─ Grade-specific distributions (4/5/6)                        │
│                                                                  │
│ Flashcard Mode:                                                  │
│  └─ flashcard-rules.txt (location facts, capitals, etc.)       │
└─────────────────────────────────────────────────────────────────┘
```

---

### **CONCEPTS (Katsomusaineet) - 2 subjects**

```
┌─────────────────────────────────────────────────────────────────┐
│ ⛪ RELIGION (religion) - Uskonto                                │
├─────────────────────────────────────────────────────────────────┤
│ Type: concepts                                                   │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates Used:                                                  │
│  ├─ Core: format.txt, topic-tagging.txt, skill-tagging.txt     │
│  ├─ Type: types/concepts.txt                                    │
│  ├─ Subject: subjects/religion.json                             │
│  ├─ Skills: skills/concepts-skills.json                         │
│  └─ Distributions: grade-distributions.json [concepts]          │
│                                                                  │
│ Quiz Mode (Helppo/Normaali):                                    │
│  └─ Grade-specific distributions (4/5/6)                        │
│                                                                  │
│ Flashcard Mode:                                                  │
│  └─ flashcard-rules.txt (beliefs, traditions, concepts)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💭 ETHICS (ethics) - Elämänkatsomustieto                       │
├─────────────────────────────────────────────────────────────────┤
│ Type: concepts                                                   │
│ Requires Grade: ✅ YES (4, 5, 6)                                │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates: Same as Religion (concepts type)                     │
│  └─ Subject: subjects/ethics.json                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### **SKILLS (Taide ja taidot) - 3 subjects**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🎨 ART (art) - Kuvataide                                        │
├─────────────────────────────────────────────────────────────────┤
│ Type: skills                                                     │
│ Requires Grade: ❌ NO (less grade-dependent)                    │
│ Grammar Support: ❌ NO                                           │
│                                                                  │
│ Templates Used:                                                  │
│  ├─ Core: format.txt, topic-tagging.txt, skill-tagging.txt     │
│  ├─ Type: types/skills.txt                                      │
│  ├─ Subject: subjects/art.json                                  │
│  ├─ Skills: skills/skills-skills.json                           │
│  └─ Distributions: grade-distributions.json [skills]            │
│                                                                  │
│ Quiz Mode (Helppo/Normaali):                                    │
│  └─ Generic distributions (not grade-specific)                  │
│                                                                  │
│ Flashcard Mode:                                                  │
│  └─ flashcard-rules.txt (techniques, artists, art history)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🎵 MUSIC (music) - Musiikki                                     │
│ ⚽ PE (pe) - Liikunta                                           │
│ ✂️ CRAFTS (crafts) - Käsityö                                    │
├─────────────────────────────────────────────────────────────────┤
│ Same structure as Art (skills type)                             │
│  └─ Subjects: music.json, pe.json, (crafts.json missing)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Complete Template Assembly Flow

```
User Selects:
  ├─ Subject: "english"
  ├─ Grade: 5
  ├─ Mode: "flashcard"
  └─ ContentType: "grammar"
          ↓
System Loads:
  ├─ 1. Core Templates (ALWAYS)
  │    ├─ format.txt          → Question format rules
  │    ├─ topic-tagging.txt   → Topic taxonomy rules
  │    └─ skill-tagging.txt   → Skill classification rules
  │
  ├─ 2. Type Template (based on subject type)
  │    └─ types/language.txt  → Language-specific question types
  │
  ├─ 3. Skills Taxonomy (based on subject type)
  │    └─ skills/language-skills.json → Available skills list
  │
  ├─ 4. Subject Curriculum (if exists)
  │    └─ subjects/english.json["5"] → Grade 5 curriculum context
  │
  ├─ 5. Distribution Rules (based on type + grade + mode)
  │    └─ grade-distributions.json[language][flashcard][5]
  │        Result: fill_blank: 60%, short_answer: 30%, matching: 10%
  │
  └─ 6. Mode-Specific Rules
       ├─ flashcard-rules.txt → General flashcard format
       ├─ language-flashcard-rules.txt → Language flashcard specifics
       └─ Rule-based check:
           isRuleBasedSubject(english, topic, "grammar") = true
           → Add RULE-BASED FORMAT instructions

Final Prompt = Concatenation of all above modules
```

---

## 🎓 Grade & Difficulty Matrix

### **Quiz Mode Difficulties by Subject Type**

| Subject Type | Grade 4 | Grade 5 | Grade 6 | Supported Difficulties |
|-------------|---------|---------|---------|----------------------|
| **language** | ✅ | ✅ | ✅ | Helppo, Normaali |
| **math** | ✅ | ✅ | ✅ | Helppo, Normaali |
| **written** | ✅ | ✅ | ✅ | Helppo, Normaali, Vaikea |
| **geography** | ✅ | ✅ | ✅ | Helppo, Normaali |
| **concepts** | ✅ | ✅ | ✅ | Helppo, Normaali |
| **skills** | ❌ | ❌ | ❌ | Generic (no grade-specific) |

### **Flashcard Mode by Subject Type**

| Subject Type | Grade-Specific? | Distribution |
|-------------|----------------|--------------|
| **language** | ✅ YES (4,5,6) | fill_blank: 60%, short_answer: 30%, matching: 10% |
| **math** | ✅ YES (4,5,6) | fill_blank: 70%, matching: 20%, short_answer: 10% |
| **written** | ✅ YES (4,5,6) | fill_blank: 60%, short_answer: 30%, matching: 10% |
| **geography** | ✅ YES (4,5,6) | fill_blank: 60%, short_answer: 25%, matching: 15% |
| **concepts** | ✅ YES (4,5,6) | fill_blank: 60%, short_answer: 30%, matching: 10% |
| **skills** | ❌ Generic | fill_blank: 50%, short_answer: 35%, matching: 15% |

---

## 📂 Template File Structure

```
src/config/prompt-templates/
│
├── core/                              # Core rules (ALWAYS loaded)
│   ├── format.txt                     # Basic question format rules
│   ├── topic-tagging.txt              # Topic taxonomy rules
│   ├── skill-tagging.txt              # Skill classification
│   ├── flashcard-rules.txt            # General flashcard rules
│   ├── language-flashcard-rules.txt   # Language-specific flashcard rules
│   └── grade-distributions.json       # Question type distributions
│
├── types/                             # Subject type templates
│   ├── language.txt                   # For: english, finnish, swedish
│   ├── math.txt                       # For: math, physics, chemistry
│   ├── written.txt                    # For: history, biology, society, env-studies
│   ├── geography.txt                  # For: geography
│   ├── concepts.txt                   # For: religion, ethics
│   └── skills.txt                     # For: art, music, pe, crafts
│
├── subjects/                          # Grade-specific curriculum context
│   ├── english.json                   # Grades 4, 5, 6 (A1 English)
│   ├── finnish.json                   # Grades 4, 5, 6
│   ├── math.json                      # Grades 4, 5, 6
│   ├── history.json                   # Grades 4, 5, 6
│   ├── biology.json                   # Grades 4, 5, 6
│   ├── geography.json                 # Grades 4, 5, 6
│   ├── environmental-studies.json     # Grades 4, 5, 6
│   ├── religion.json                  # Grades 4, 5, 6
│   ├── ethics.json                    # Grades 4, 5, 6
│   ├── art.json                       # Generic
│   ├── music.json                     # Generic
│   └── pe.json                        # Generic
│
├── skills/                            # Skill taxonomy per type
│   ├── language-skills.json           # verb_tenses, word_meaning, etc.
│   ├── math-skills.json               # arithmetic, geometry, etc.
│   ├── written-skills.json            # analysis, recall, etc.
│   ├── geography-skills.json          # location, map_reading, etc.
│   ├── concepts-skills.json           # understanding, comparison, etc.
│   └── skills-skills.json             # technique, creativity, etc.
│
└── metadata/                          # Additional metadata
    ├── difficulty-instructions.json   # Difficulty-specific guidance
    ├── english-grade-content.json     # English curriculum details
    └── math-grade-content.json        # Math curriculum details
```

---

## 🔄 Question Type Distribution Examples

### **English (language) - Grade 5 - Normaali - Quiz**
```
multiple_choice: 35%
fill_blank: 30%
true_false: 15%
sequential: 10%
short_answer: 10%
```

### **English (language) - Grade 5 - Flashcard**
```
fill_blank: 60%
short_answer: 30%
matching: 10%
```

### **Math - Grade 6 - Normaali - Quiz**
```
fill_blank: 50%
multiple_choice: 25%
sequential: 10%
true_false: 10%
matching: 5%
```

### **Math - Grade 5 - Flashcard (Rule-Based)**
```
fill_blank: 70%  → "Miten lasketaan...?"
matching: 20%     → Formula pairs
short_answer: 10% → "Mikä on kaava...?"
```

---

## 🎯 Special Rules & Exceptions

### **Rule-Based Flashcards**
**ALWAYS rule-based:**
- Math (all modes)
- Physics (all modes)
- Chemistry (all modes)

**Conditional rule-based (language subjects):**
- English + flashcard + contentType="grammar" ✅
- English + flashcard + contentType="vocabulary" ❌
- English + quiz → ❌ (never rule-based)

### **Sequential Questions (Timeline)**
**Preferred for:**
- History (15% recommended in quiz mode)
- Any subject with chronological events

**Format:**
- Simple: Array of strings to order
- Timeline: Array of {text, year} objects

---

## 📊 Summary Statistics

- **Total Subjects:** 17
- **Subject Types:** 6 (language, math, written, geography, concepts, skills)
- **Supported Grades:** 4, 5, 6 (primary school) + 7, 8, 9 (physics/chemistry)
- **Difficulties:** Helppo, Normaali, Vaikea (written only)
- **Quiz Question Types:** 6 (multiple_choice, true_false, fill_blank, matching, short_answer, sequential)
- **Flashcard Question Types:** 3 currently (fill_blank, short_answer, matching) → Will be simplified to 1 (flashcard) per task-131
- **Core Templates:** 6 files
- **Type Templates:** 6 files
- **Subject Curricula:** 12 files (5 subjects missing - see tasks 125-129)
- **Skill Taxonomies:** 6 files

---

## 🚨 Missing Template Files (To Create)

1. `subjects/society.json` - Yhteiskuntaoppi curriculum
2. `subjects/swedish.json` - Swedish language curriculum
3. `subjects/physics.json` - Physics curriculum (grades 7-9)
4. `subjects/chemistry.json` - Chemistry curriculum (grades 7-9)
5. `subjects/crafts.json` - Käsityö curriculum

**System gracefully handles missing files** - uses generic type templates as fallback.

---

## 🔍 How to Trace Template Usage

**Example: Creating English Grammar Flashcards, Grade 5**

```bash
# 1. User selections
Subject: english
SubjectType: language (derived from english)
Grade: 5
Mode: flashcard
ContentType: grammar

# 2. Template loading order
PromptLoader.loadModules([
  'core/format.txt',                    # ✅ Loaded
  'core/topic-tagging.txt',             # ✅ Loaded
  'core/skill-tagging.txt',             # ✅ Loaded
  'types/language.txt',                 # ✅ Loaded (from subjectType)
])

PromptBuilder.loadSkillTaxonomy('language')
  → 'skills/language-skills.json'       # ✅ Loaded

PromptBuilder.loadCurriculum('english', 5)
  → 'subjects/english.json'["5"]        # ✅ Loaded

PromptBuilder.loadDistributions('english', 'language', 5, 'normaali', 'flashcard')
  → 'core/grade-distributions.json'     # ✅ Loaded
  → Lookup: [language][flashcard][5]    # ✅ Found
  → Returns: fill_blank 60%, short_answer 30%, matching 10%

# Because mode === 'flashcard':
PromptLoader.loadModule('core/flashcard-rules.txt')  # ✅ Loaded

# Because isRuleBasedSubject('english', topic, 'grammar') === true:
PromptBuilder adds rule-based emphasis:
  "⚠️ TÄRKEÄÄ: Tämä on sääntöpohjainen aihe (kielioppi).
   Sinun TÄYTYY käyttää SÄÄNTÖPOHJAISTA FLASHCARD-MUOTOA..."

# 3. Final prompt assembly
Concatenates all modules + substitutes variables
  → Sends to Claude AI
```

---

## ⚠️ Current Question Type Distribution System (Known Limitations)

### **How It Currently Works**

The system currently uses **rigid, pre-defined percentage distributions** from `grade-distributions.json`:

```json
{
  "language": {
    "flashcard": {
      "4": {
        "fill_blank": 60,
        "short_answer": 30,
        "matching": 10
      }
    },
    "quiz": {
      "4": {
        "helppo": {
          "multiple_choice": 50,
          "true_false": 30,
          "fill_blank": 20
        }
      }
    }
  }
}
```

**Process:**
1. System loads distribution percentages based on subject type, grade, difficulty, and mode
2. Prompt instructs AI: "YOU MUST generate EXACTLY 60% fill_blank, 30% short_answer, 10% matching"
3. AI is forced to match these percentages, even if inappropriate for the content
4. Result: Questions sometimes feel "forced" into wrong formats to meet quotas

### **Problems with Current System**

#### **Problem 1: Rigid Enforcement**
- AI must hit exact percentages, even when content doesn't fit
- Example: Timeline content forced into fill_blank format instead of natural sequential format
- Sequential questions artificially limited to 15% even when material is mostly chronological

#### **Problem 2: Flashcard Over-Complication**
- Flashcards split into 3 types: fill_blank, short_answer, matching
- All three ask the same thing in different formats
- Doesn't match traditional flashcard UX (simple Q&A flip cards)
- Adds unnecessary rendering complexity

#### **Problem 3: Content Mismatch**
- System doesn't analyze whether content fits question type
- Forces "What year did X happen?" into multiple_choice when true_false might be better
- Can't naturally adapt to material structure

#### **Problem 4: Maintenance Burden**
- Requires tuning distributions for each subject × grade × difficulty × mode combination
- Hard to add new question types (requires updating all distributions)
- Percentage tweaking is arbitrary and not data-driven

### **Why This Exists**

The rigid distribution system was originally created to:
- Ensure variety (avoid all questions being same type)
- Provide consistent UX (predictable question mix)
- Guide AI when it didn't understand question type nuances

However, modern AI models (Claude Sonnet 4.5) are sophisticated enough to:
- Choose appropriate question types based on content analysis
- Maintain variety naturally without forced percentages
- Understand when sequential/timeline format is better than fill_blank

### **Available Question Types**

**Quiz Mode:**
1. `multiple_choice` - Select one answer from options
2. `true_false` - Verify fact correctness
3. `fill_blank` - Complete missing word/phrase
4. `short_answer` - Free text explanation
5. `matching` - Pair related items
6. `sequential` - Order items chronologically or logically

**Flashcard Mode (Currently):**
1. `fill_blank` - "The capital is ___" → "Helsinki"
2. `short_answer` - "What is the capital?" → "Helsinki"
3. `matching` - "Match: Finland - ?" → "Helsinki"

**Flashcard Mode (Planned):**
- Single type: `flashcard` - Simple Q&A pairs with flip interaction

---

## 🚀 Known Issues & Planned Improvements

### **Issue 1: Map Question Type Reference (FIXED)**
- **Problem:** Documentation referenced removed "map" question type
- **Status:** ✅ Fixed - Removed from this document
- **Impact:** Documentation now accurate

### **Issue 2: Rigid Distribution System**
- **Problem:** AI forced to match exact percentages, leading to awkward questions
- **Solution:** task-130-redesign-question-type-distribution.md
- **Status:** 📋 Planned
- **Impact:** AI will choose most appropriate question type for each piece of content
- **Approach:**
  - Remove percentage enforcement from prompts
  - Provide guidance on when each question type works best
  - Let AI decide based on content analysis
  - Add post-generation variety validation (warn if >80% one type)

### **Issue 3: Flashcard Over-Complication**
- **Problem:** Flashcards artificially split into 3 types instead of simple Q&A
- **Solution:** task-131-simplify-flashcard-question-types.md
- **Status:** 📋 Planned
- **Impact:** Flashcards return to traditional flip-card format
- **Approach:**
  - All flashcards become type "flashcard" (not fill_blank/short_answer/matching)
  - UI displays as flip cards (front = question, back = answer)
  - Self-scoring (Easy/Medium/Hard) for spaced repetition
  - Rule-based flashcards include formula + explanation + example

### **Issue 4: Sequential Underutilization**
- **Problem:** Sequential questions limited to 15% even when material is mostly timelines/processes
- **Solution:** Included in task-130 (AI-driven type selection)
- **Status:** 📋 Planned
- **Impact:** Timeline content naturally uses sequential format

### **Issue 5: Missing Curriculum Files**
- **Problem:** 5 subjects lack curriculum files (society, swedish, physics, chemistry, crafts)
- **Solution:**
  - task-125-add-society-curriculum.md
  - task-126-add-swedish-curriculum.md
  - task-127-add-physics-curriculum.md
  - task-128-add-chemistry-curriculum.md
  - task-129-add-crafts-curriculum.md
- **Status:** 📋 Planned
- **Impact:** Better grade-appropriate questions for these subjects

### **Migration Path**

**Phase 1: Fix Documentation** ✅ DONE
- Remove map question references
- Document current system accurately
- Add improvement tasks

**Phase 2: AI-Driven Distributions** 📋 PLANNED (task-130)
- Remove rigid percentages
- Add question type guidance
- Test with real content

**Phase 3: Simplify Flashcards** 📋 PLANNED (task-131)
- Convert to simple Q&A format
- Update UI to flip cards
- Maintain backward compatibility

**Phase 4: Add Missing Curricula** 📋 PLANNED (tasks 125-129)
- Create curriculum files for 5 subjects
- Test with real question generation

---

## 📝 Notes

- **Backward Compatibility:** System supports both new subject IDs ('english') and old free-text ('Englanti', 'English')
- **Fallback Behavior:** If curriculum file missing, system continues without grade-specific context
- **Grade Independence:** Skills subjects (art, music, pe) don't require grade selection
- **Rule Detection:** Grammar flashcards require explicit contentType selection (no more keyword fragility)
- **Distribution Flexibility:** Written subjects have 3 difficulties (Helppo/Normaali/Vaikea), others have 2

---

**For Developers:**
- See `src/lib/prompts/PromptBuilder.ts` for assembly logic
- See `src/lib/prompts/PromptLoader.ts` for module loading
- See `src/config/subjects.ts` for subject definitions (after task-123)
