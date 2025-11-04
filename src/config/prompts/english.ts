import { Difficulty } from '@/types';

export function getEnglishPrompt(
  difficulty: Difficulty,
  questionCount: number,
  grade?: number,
  material?: string
): string {
  const difficultyInstructions = {
    helppo: `
- Perus sanasto (yleisimmät sanat ja ilmaisut)
- Yksinkertaiset kielioppisäännöt (preesens, imperfekti)
- Selkeät ja suorat kysymykset
- Yleisimmät verbit ja substantiivit`,
    normaali: `
- Monipuolinen sanasto (yleiset ja keskitason sanat)
- Keskitason kielioppi (aikamuodot, modaaliverbit, prepositiot)
- Vaihtelevat kysymystyypit
- Lauserakenteet ja sanajärjestys`,
    vaikea: `
- Laaja sanasto (myös harvinaisempia sanoja ja idiomeja)
- Monimutkaiset kielioppisäännöt (perfekti, konditionaali, passiiivi)
- Haastavat kysymykset
- Epäsäännölliset verbit ja poikkeukset`,
    mahdoton: `
- Erittäin haastava sanasto (idiomit, slängi, erikoistermit)
- Edistyneet kielioppisäännöt (subjunktiivi, epäsuorat kysymykset)
- Monimutkaisia rakenteita ja vivahteet
- Kulttuuriset viittaukset ja sananparret`,
  };

  const gradeContext = grade ? `Kysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle.` : '';

  return `Analysoi ${material ? 'seuraava materiaali' : 'nämä dokumentit'} ja luo ${questionCount} monipuolista kysymystä englannin koevalmistautumiseen.

VAIKEUSTASO: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}

${gradeContext}

VAIKEUSTASON OHJEET:
${difficultyInstructions[difficulty]}

${material ? `MATERIAALI:\n${material}\n\n` : ''}TÄRKEÄÄ - KYSYMYSTEN MUOTO:
- Kysymykset esitetään SUOMEKSI
- Vain englanninkieliset sanat, lauseet ja JOTKUT vastausvaihtoehdot ovat englanniksi
- Painota SANASTOA ja KIELIOPPIA
- Vaihtele kysymystyyppejä
- Luo TÄSMÄLLEEN ${questionCount} kysymystä

VASTAUSVAIHTOEHTOJEN KIELI:
- Sanaston käännökset: vastaukset ENGLANNIKSI tai SUOMEKSI (riippuen käännössuunnasta)
- Verbimuodot/sanojen valinta lauseeseen: vastaukset ENGLANNIKSI
- Kielioppisäännöt ja teoria: vastaukset SUOMEKSI

KYSYMYSTYYPIT JA ESIMERKIT:

1. Sanaston käännökset (suomesta englanniksi):
   Kysymys: "Mikä on sanan 'koira' englanninkielinen käännös?"
   Vaihtoehdot: ["dog", "cat", "bird", "fish"] (ENGLANNIKSI)

2. Sanaston käännökset (englannista suomeksi):
   Kysymys: "Mitä sana 'happy' tarkoittaa suomeksi?"
   Vaihtoehdot: ["iloinen", "surullinen", "vihainen", "väsynyt"] (SUOMEKSI)

3. Kielioppi - oikea verbimuoto:
   Kysymys: "Valitse oikea verbimuoto: 'She ___ to school every day.'"
   Vaihtoehdot: ["goes", "go", "going", "went"] (ENGLANNIKSI)

4. Kielioppisääntö - teoria:
   Kysymys: "Mitä aikamuotoa käytetään kun puhutaan säännöllisesti toistuvasta toiminnasta?"
   Vaihtoehdot: ["preesens", "imperfekti", "perfekti", "pluskvamperfekti"] (SUOMEKSI)

5. Totta/Epätotta kysymykset:
   Kysymys: "Totta vai tarua: Englannin kielessä käytetään artikkelia 'an' ennen ääntä alkavaa sanaa."
   Vastaus: true

6. Täydennä lause:
   Kysymys: "Täydennä lause oikealla sanalla: 'I ___ breakfast every morning at 7 am.'"
   Vastaus: "have" tai "eat"

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti suomeksi",
    "type": "multiple_choice" | "fill_blank" | "true_false",
    "options": ["vaihtoehto1", "vaihtoehto2", "vaihtoehto3", "vaihtoehto4"], // vain multiple_choice
    "correct_answer": "oikea vastaus",
    "acceptable_answers": ["vaihtoehtoinen vastaus"], // vain fill_blank, vapaaehtoinen
    "explanation": "selitys suomeksi"
  }
]

Varmista että:
- Jokainen kysymys on uniikki
- Väärät vastaukset ovat uskottavia
- Selitykset ovat informatiivisia
- Kysymykset kattavat materiaalin laajasti`;
}
