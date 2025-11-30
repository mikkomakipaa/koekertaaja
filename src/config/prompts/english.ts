import { Difficulty } from '@/types';

// GRADE-SPECIFIC QUESTION TYPE DISTRIBUTIONS
// Easy to modify - adjust percentages as needed
const GRADE_DISTRIBUTIONS = {
  4: {
    helppo: {
      multiple_choice: 60,
      true_false: 25,
      fill_blank: 15,
    },
    normaali: {
      multiple_choice: 45,
      fill_blank: 25,
      true_false: 15,
      sequential: 10,
      short_answer: 5,
    },
  },
  5: {
    helppo: {
      multiple_choice: 50,
      true_false: 20,
      fill_blank: 20,
      matching: 10,
    },
    normaali: {
      multiple_choice: 35,
      fill_blank: 30,
      true_false: 15,
      sequential: 10,
      short_answer: 10,
    },
  },
  6: {
    helppo: {
      multiple_choice: 45,
      true_false: 15,
      fill_blank: 30,
      matching: 10,
    },
    normaali: {
      multiple_choice: 25,
      fill_blank: 40,
      true_false: 10,
      sequential: 10,
      short_answer: 15,
    },
  },
} as const;

export function getEnglishPrompt(
  difficulty: Difficulty,
  questionCount: number,
  grade?: number,
  material?: string
): string {
  // Finnish curriculum-based content for A1-English
  const gradeContent = {
    4: `
VUOSILUOKKA 4 - A1-ENGLANNIN OPETUSSUUNNITELMA:
- Sanasto: perussanasto (itsestä, perheestä, koulustaja harrastuksista), n. 200-300 sanaa
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

  // Difficulty-specific instructions with question type guidance
  const difficultyInstructions = {
    helppo: `
VAIKEUSTASO: Helppo
- Perussanasto ja yksinkertaiset kielioppisäännöt
- Selkeät ja suorat kysymykset
- Yleisimmät sanat ja perusrakenteet
- Keskittyminen tunnistamiseen ja perusymmärrykseen

KYSYMYSTYYPPIEN JAKAUMA (Helppo):
- 55% multiple_choice (monivalinta - sanaston tunnistaminen, yksinkertaiset kielioppivalinnat)
- 20% true_false (totta/tarua - yksinkertaiset väitteet)
- 15% fill_blank (täydennä - yksi puuttuva sana)
- 10% sequential (järjestys - 4 kohtaa)
- ÄLÄ käytä short_answer tai matching`,
    normaali: `
VAIKEUSTASO: Normaali
- Monipuolinen sanasto ja keskitason kielioppi
- Vaatii ymmärrystä ja soveltamista
- Lauserakenteet ja kontekstin ymmärtäminen
- Käytännön viestintätilanteet

KYSYMYSTYYPPIEN JAKAUMA (Normaali):
- 40% multiple_choice (monivalinta)
- 25% fill_blank (täydennä - sanat tai lyhyet ilmaisut)
- 15% true_false (totta/tarua)
- 10% sequential (järjestys - 5-6 kohtaa)
- 5% matching (parit - esim. sanat ja määritelmät)
- 5% short_answer (lyhyt vastaus - 1-2 sanaa tai lyhyt lause)`,
    vaikea: `
VAIKEUSTASO: Vaikea
- Laaja sanasto ja monimutkaiset rakenteet
- Vaatii syvällistä ymmärrystä ja tuottamista
- Kontekstin tulkinta ja soveltaminen
- Viestintä ja ilmaisu englanniksi

KYSYMYSTYYPPIEN JAKAUMA (Vaikea):
- 35% short_answer (avoin vastaus - lauseiden muodostus, selitykset)
- 30% multiple_choice (monimutkaisempi konteksti)
- 20% fill_blank (täydennä - useita sanoja tai lauserakenteet)
- 15% matching (parit - monimutkaisemmat yhteydet)
- Suosi kysymyksiä jotka vaativat TUOTTAMISTA ja SOVELTAMISTA`,
  };

  const gradeContext = grade && gradeContent[grade as 4 | 5 | 6]
    ? gradeContent[grade as 4 | 5 | 6]
    : '';

  const gradeNote = grade
    ? `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle ja perustua ${grade}. luokan A1-englannin opetussuunnitelman sisältöön.`
    : '';

  return `Analysoi ${material ? 'seuraava materiaali' : 'nämä dokumentit'} ja luo ${questionCount} monipuolista kysymystä englannin koevalmistautumiseen.

${gradeContext}

${difficultyInstructions[difficulty]}
${gradeNote}

${material ? `MATERIAALI:\n${material}\n\n` : ''}TÄRKEÄÄ - KYSYMYSTEN MUOTO:
- Kysymykset esitetään SUOMEKSI
- Vain englanninkieliset sanat, lauseet ja JOTKUT vastausvaihtoehdot ovat englanniksi
- Painota SANASTOA ja KIELIOPPIA
- Vaihtele kysymystyyppejä
- Luo TÄSMÄLLEEN ${questionCount} kysymystä
- NOUDATA TARKASTI vaikeustason kysymystyyppien jakaumaa
- PERUSTA kysymykset annettuun materiaaliin ${gradeContext ? `ja ${grade}. luokan opetussuunnitelmaan` : ''}

VASTAUSVAIHTOEHTOJEN KIELI:
- Sanaston käännökset: vastaukset ENGLANNIKSI tai SUOMEKSI (riippuen käännössuunnasta)
- Verbimuodot/sanojen valinta lauseeseen: vastaukset ENGLANNIKSI
- Kielioppisäännöt ja teoria: vastaukset SUOMEKSI

KYSYMYSTYYPPIEN KÄYTTÖOHJEET:

1. MULTIPLE_CHOICE (monivalinta):
   *** PAKOLLINEN: Jokaisessa multiple_choice kysymyksessä TÄYTYY olla TASAN 4 vaihtoehtoa ***

   Sanaston käännös (suomesta englanniksi):
   Kysymys: "Mikä on sanan 'koira' englanninkielinen käännös?"
   Vaihtoehdot: ["dog", "cat", "bird", "fish"] (ENGLANNIKSI - 4 vaihtoehtoa)

   Sanaston käännös (englannista suomeksi):
   Kysymys: "Mitä sana 'happy' tarkoittaa suomeksi?"
   Vaihtoehdot: ["iloinen", "surullinen", "vihainen", "väsynyt"] (SUOMEKSI - 4 vaihtoehtoa)

   Kielioppi - oikea verbimuoto:
   Kysymys: "Valitse oikea verbimuoto: 'She ___ to school every day.'"
   Vaihtoehdot: ["goes", "go", "going", "went"] (ENGLANNIKSI - 4 vaihtoehtoa)

   Kielioppisääntö - teoria:
   Kysymys: "Mitä aikamuotoa käytetään kun puhutaan säännöllisesti toistuvasta toiminnasta?"
   Vaihtoehdot: ["preesens", "imperfekti", "perfekti", "futuuri"] (SUOMEKSI - 4 vaihtoehtoa)

2. TRUE_FALSE (totta/tarua):
   Kysymys: "Totta vai tarua: Englannin kielessä käytetään artikkelia 'an' ennen vokaalia alkavaa sanaa."
   correct_answer: true (boolean, EI "totta"/"tarua")

   Kysymys: "Totta vai tarua: Sana 'child' on monikossa 'childs'."
   correct_answer: false (boolean, EI "totta"/"tarua")

3. FILL_BLANK (täydennä):
   - Helppo: yksi puuttuva sana
   Kysymys: "Täydennä lause: 'I ___ breakfast every morning.' (syödä)"
   Vastaus: "eat" tai "have"

   - Normaali/Vaikea: useampia sanoja tai rakenne
   Kysymys: "Täydennä lause oikealla verbimuodolla: 'She ___ (go) to London last week.'"
   Vastaus: "went"

   Anna acceptable_answers listaan vaihtoehtoiset hyväksyttävät vastaukset

4. SHORT_ANSWER (lyhyt avoin vastaus):
   - VAIN normaali ja vaikea vaikeustasoilla
   - Vaatii tuottamista englanniksi

   Normaali taso:
   Kysymys: "Kirjoita lause englanniksi: 'Minä pidän koirista.'"
   Vastaus: "I like dogs." tai "I love dogs."

   Vaikea taso:
   Kysymys: "Kirjoita 2-3 lausetta englanniksi: Kerro mitä teit viikonloppuna."
   Vastaus: "I went to the park on Saturday. I played football with my friends. On Sunday, I stayed at home."

   Anna acceptable_answers listaan erilaisia hyväksyttäviä vastausmuotoja

5. MATCHING (parit):
   - Sopii: sanat ja käännökset, verbit ja muodot, kysymykset ja vastaukset
   - Käytä normaali ja vaikea tasoilla
   *** PAKOLLINEN: Jokaisessa matching kysymyksessä TÄYTYY olla VÄHINTÄÄN 4 paria ***

   Esim: Yhdistä englanninkielinen sana suomenkieliseen käännökseen
   Parit: [{"left": "happy", "right": "iloinen"}, {"left": "sad", "right": "surullinen"}, {"left": "angry", "right": "vihainen"}, {"left": "tired", "right": "väsynyt"}]

6. SEQUENTIAL (järjestys):
   - Sopii: lauseiden järjestäminen kappaleeksi, tapahtumien aikajärjestys, dialogin järjestys
   - Käytä helppo ja normaali tasoilla
   *** PAKOLLINEN: Helppo taso 4 kohtaa, Normaali taso 5-6 kohtaa ***

   Helppo taso - Lauseet järjestykseen:
   Kysymys: "Järjestä nämä lauseet oikeaan järjestykseen muodostaaksesi loogisen tarinan:"
   items: [
     "I ate my breakfast.",
     "I woke up at 7 o'clock.",
     "I went to school.",
     "I brushed my teeth."
   ]
   correct_order: [1, 3, 0, 2]  // Oikea järjestys: woke up -> brushed teeth -> ate breakfast -> went to school
   Huom: correct_order sisältää ALKUPERÄISTEN kohtien indeksit (0-pohjainen) oikeassa järjestyksessä

   Normaali taso - Dialogi järjestykseen:
   Kysymys: "Järjestä nämä vuorosanatloogiseksi keskusteluksi:"
   items: [
     "Nice to meet you too!",
     "I'm fine, thank you. And you?",
     "Hello! How are you?",
     "My name is Sarah. What's your name?",
     "I'm doing well, thanks!",
     "I'm John."
   ]
   correct_order: [2, 1, 4, 3, 5, 0]

   Normaali taso - Ohjeiden järjestäminen:
   Kysymys: "Järjestä nämä ohjeet oikeaan järjestykseen:"
   items: [
     "Put the bread in the toaster.",
     "Wait for the bread to become brown.",
     "Take a slice of bread.",
     "Put butter on the toast.",
     "Take the toast out of the toaster."
   ]
   correct_order: [2, 0, 1, 4, 3]

VÄÄRÄT VASTAUKSET (multiple_choice):
Väärät vastaukset tulee olla uskottavia:
- Samaan aihealueeseen liittyviä sanoja
- Yleisiä kielioppivirheitä (esim. "go" kun pitäisi olla "goes")
- Sekoitettavia muotoja (esim. "their/there/they're")
- Samanlaisia sanoja (esim. "weather/whether")

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti suomeksi",
    "type": "multiple_choice" | "fill_blank" | "true_false" | "short_answer" | "matching" | "sequential",
    "options": ["vaihtoehto1", "vaihtoehto2", "vaihtoehto3", "vaihtoehto4"], // PAKOLLINEN multiple_choice kysymyksille, TÄYTYY olla 4 vaihtoehtoa
    "pairs": [{"left": "vasen", "right": "oikea"}], // PAKOLLINEN matching kysymyksille, TÄYTYY olla vähintään 4 paria
    "items": ["kohta1", "kohta2", "kohta3", "kohta4"], // PAKOLLINEN sequential kysymyksille
    "correct_order": [1, 3, 0, 2], // PAKOLLINEN sequential kysymyksille - indeksit (0-based) oikeassa järjestyksessä
    "correct_answer": "oikea vastaus",  // EI käytetä sequential kysymyksissä
    "acceptable_answers": ["vaihtoehtoinen vastaus"], // vapaaehtoinen, käytä fill_blank ja short_answer
    "explanation": "selitys suomeksi miksi tämä on oikea vastaus"
  }
]

Varmista että:
- Jokainen kysymys on uniikki
- Väärät vastaukset ovat uskottavia
- Selitykset ovat informatiivisia ja suomeksi
- Kysymykset perustuvat annettuun materiaaliin ${gradeContext ? `ja ${grade}. luokan opetussuunnitelmaan` : ''}
- Sanaston vaikeustaso vastaa ${grade ? `${grade}. luokkaa` : 'asetettua tasoa'}
- KYSYMYSTYYPPIEN JAKAUMA vastaa vaikeustason ohjeita`;
}
