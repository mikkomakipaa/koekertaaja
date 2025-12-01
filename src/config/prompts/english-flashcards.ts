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
  material?: string
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

  return `Analysoi ${material ? 'seuraava materiaali' : 'nämä dokumentit'} ja luo ${questionCount} kysymystä KORTTIOPETTELUA VARTEN (flashcard-muoto).

KORTTITILAN TAVOITE:
Kysymykset on optimoitu OPPIMISEEN JA MUISTAMISEEN, ei testaamiseen. Keskity:
- AKTIIVISEEN PALAUTUKSEEN (active recall)
- SELKEISIIN YHDEN ASIAN KYSYMYKSIIN
- YMMÄRRETTÄVIIN JA MUISTETTAVIIN VASTAUKSIIN
- HYÖDYLLISIIN SELITYKSIIN JA ESIMERKKEIHIN

${gradeContext}

KYSYMYSTYYPPIEN JAKAUMA (Korttitila):
- ${FLASHCARD_DISTRIBUTION.fill_blank}% fill_blank (täydennä - paras muistamiselle)
- ${FLASHCARD_DISTRIBUTION.short_answer}% short_answer (lyhyt vastaus - syvä oppiminen)
- ${FLASHCARD_DISTRIBUTION.matching}% matching (parit - yhteyksien oppiminen)
${gradeNote}

ÄLÄ KÄYTÄ:
- multiple_choice (passiivinen tunnistaminen, ei aktiivista muistamista)
- true_false (arvaaminen, ei todellista palautusta)
- sequential (ei toimi korttina)

${material ? `MATERIAALI:\n${material}\n\n` : ''}════════════════════════════════════════════════════════════════
⚠️  KRIITTISET VAATIMUKSET - PAKOLLISIA, EI NEUVOTELTAVISSA ⚠️
════════════════════════════════════════════════════════════════

1. AIHEIDEN TASAPAINO (TOPIC BALANCING):
   • ANALYSOI materiaali ja TUNNISTA 3-5 korkeantason aihealuetta
   • Esimerkkejä: "Grammar", "Vocabulary", "Pronunciation", "Reading"
   • JOKA IKINEN kysymys TÄYTYY sisältää "topic"-kenttä
   • JAKA kysymykset TASAISESTI kaikkien aihealueiden kesken
   • Jos 3 aihetta + 15 kysymystä = 5 kysymystä per aihealue
   • VARMISTA että JOKAINEN kysymys on merkitty aihealueella

2. KYSYMYSTYYPPIEN RAJOITUKSET (FLASHCARD MODE):
   • SALLITUT tyypit: fill_blank, short_answer, matching
   • KIELLETYT tyypit: multiple_choice, true_false, sequential
   • ⛔ ÄLÄ KOSKAAN luo multiple_choice kysymyksiä
   • ⛔ ÄLÄ KOSKAAN luo true_false kysymyksiä
   • ⛔ ÄLÄ KOSKAAN luo sequential kysymyksiä
   • Nämä tyypit HYLÄTÄÄN automaattisesti validoinnissa

════════════════════════════════════════════════════════════════

TÄRKEÄÄ - KORTTIEN MUOTO:

1. FILL_BLANK (täydennä):
   - Yksi selkeä puuttuva kohta
   - Konteksti auttaa muistamaan
   - Vastaus on YKSI SANA tai LYHYT ILMAISU

   Esimerkki:
   Kysymys: "I ___ (mennä) to school every day."
   Vastaus: "go"
   Hyväksytyt: ["go", "walk", "drive"] (jos sopii kontekstiin)
   Selitys: "Preesensmuoto. 'I' -pronominin kanssa käytetään verbin perusmuotoa."

2. SHORT_ANSWER (lyhyt vastaus):
   - Avoin kysymys joka vaatii tuottamista
   - Vastaus on 1-3 sanaa tai lyhyt lause
   - Testaa ymmärrystä ja kykyä muodostaa vastaus

   Esimerkki:
   Kysymys: "Miten muodostetaan kysymyslause verbillä 'do'?"
   Vastaus: "Do/Does + subject + verb"
   Selitys: "Kysymyslauseessa aputermi 'do/does' tulee ensimmäiseksi, sitten subjekti ja lopuksi pääverbi perusmuodossa."

3. MATCHING (parit):
   - Sanat ja niiden määritelmät/käännökset
   - Verbit ja niiden muodot
   - Lauseet ja niiden käännökset
   - VÄHINTÄÄN 3 paria, ENINTÄÄN 6 paria

   Esimerkki:
   Kysymys: "Yhdistä englanninkieliset sanat suomenkielisiin käännöksiin:"
   Parit: [
     {"left": "happy", "right": "iloinen"},
     {"left": "sad", "right": "surullinen"},
     {"left": "angry", "right": "vihainen"}
   ]
   Selitys: "Perustunteiden sanasto. Nämä ovat yleisimpiä adjektiiveja tunteiden ilmaisuun."

SELITYSTEN KIRJOITTAMINEN:
- Selitä MIKSI vastaus on oikea
- Anna KONTEKSTI ja ESIMERKKEJÄ
- Käytä MUISTISÄÄNTÖJÄ kun mahdollista
- Liitä OPETUSSUUNNITELMAN AIHEESEEN
- Vähintään 20 merkkiä, enintään 300 merkkiä

VASTAUSVAIHTOEHTOJEN KIELI:
- Sanaston käännökset: vastaukset ENGLANNIKSI tai SUOMEKSI (riippuen käännössuunnasta)
- Verbimuodot/sanojen valinta lauseeseen: vastaukset ENGLANNIKSI
- Kielioppisäännöt ja teoria: vastaukset SUOMEKSI

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

MUISTA:
- NOUDATA TARKASTI kysymystyyppien jakaumaa (60/30/10)
- Luo TÄSMÄLLEEN ${questionCount} kysymystä
- Jokainen kysymys keskittyy YHTEEN ASIAAN
- Selitykset ovat OPETTAVAISIA ja MUISTAMISEN TUKENA
- ÄLÄ käytä multiple_choice, true_false tai sequential
`;
}