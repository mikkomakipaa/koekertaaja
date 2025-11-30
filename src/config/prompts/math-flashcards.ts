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
  material?: string
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

  return `Analysoi ${material ? 'seuraava materiaali' : 'nämä dokumentit'} ja luo ${questionCount} matematiikan kysymystä KORTTIOPETTELUA VARTEN (flashcard-muoto).

KORTTITILAN TAVOITE:
Kysymykset on optimoitu OPPIMISEEN JA MUISTAMISEEN, ei testaamiseen. Keskity:
- MATEMAATTISTEN FAKTOJEN MUISTAMISEEN (kaavat, säännöt)
- KÄSITTEIDEN YMMÄRTÄMISEEN
- LASKUTAITOJEN HARJOITTAMISEEN
- SELKEISIIN ESIMERKKEIHIN JA VAIHEISIIN

${gradeContext}

KYSYMYSTYYPPIEN JAKAUMA (Korttitila):
- ${FLASHCARD_DISTRIBUTION.fill_blank}% fill_blank (täydennä - kaavat, laskut, säännöt)
- ${FLASHCARD_DISTRIBUTION.matching}% matching (parit - käsitteet ja määritelmät)
- ${FLASHCARD_DISTRIBUTION.short_answer}% short_answer (selitykset ja perusteel
ut)
${gradeNote}

ÄLÄ KÄYTÄ:
- multiple_choice (passiivinen tunnistaminen)
- true_false (arvaaminen)
- sequential (ei toimi korttina)

${material ? `MATERIAALI:\n${material}\n\n` : ''}KRIITTINEN VAATIMUS - AIHEIDEN TASAPAINO:
1. ANALYSOI materiaali ja TUNNISTA 3-5 korkeantason aihealuetta (esim. "Laskutoimitukset", "Geometria", "Luvut")
2. JAKA kysymykset TASAISESTI kaikkien tunnistettujen aihealueiden kesken
3. MERKITSE jokainen kysymys sen pääaihealueella "topic"-kenttään
4. VARMISTA että kaikki aihealueet saavat tasapuolisen määrän kysymyksiä

TÄRKEÄÄ - KORTTIEN MUOTO:

1. FILL_BLANK (täydennä - SUOSITUIN matematiikassa):
   - Puuttuva luku, laskutoimitus tai kaava
   - Konteksti auttaa ratkaisemaan
   - Vastaus on NUMERO tai LYHYT MATEMAATTINEN ILMAISU

   Esimerkkejä:

   Lasku:
   Kysymys: "$$8 \\times 7 = \_\_\_\_$$"
   Vastaus: "56"
   Selitys: "Kertotaulu 7: 8 × 7 = 56. Muistisääntö: 7 × 8 on sama kuin 7 × 10 - 7 × 2 = 70 - 14 = 56."

   Kaava:
   Kysymys: "Suorakulmion pinta-ala lasketaan kaavalla: Pinta-ala = \_\_\_\_ × \_\_\_\_"
   Vastaus: "leveys × korkeus" tai "$$l \\times k$$"
   Hyväksytyt: ["leveys × korkeus", "l × k", "pituus × leveys"]
   Selitys: "Suorakulmion pinta-ala = leveys × korkeus. Esimerkiksi jos leveys on 5 cm ja korkeus 3 cm, niin pinta-ala = 5 × 3 = 15 cm²."

   Yksinkertainen yhtälö:
   Kysymys: "Ratkaise: $$x + 5 = 12$$, niin $$x = \_\_\_\_$$"
   Vastaus: "7"
   Selitys: "Vähennetään molemmilta puolilta 5: x + 5 - 5 = 12 - 5, joten x = 7. Tarkistus: 7 + 5 = 12 ✓"

2. MATCHING (parit):
   - Käsitteet ja määritelmät
   - Luvut ja niiden ominaisuudet
   - Kaavat ja niiden nimet
   - VÄHINTÄÄN 3 paria, ENINTÄÄN 6 paria

   Esimerkki:
   Kysymys: "Yhdistä geometriset käsitteet niiden määritelmiin:"
   Parit: [
     {"left": "Suorakulmio", "right": "Neljä kulmaa, kaikki 90 astetta"},
     {"left": "Neliö", "right": "Neljä yhtä pitkää sivua, kaikki kulmat 90 astetta"},
     {"left": "Kolmio", "right": "Kolme kulmaa, kulmien summa 180 astetta"}
   ]
   Selitys: "Perusgeometriset muodot. Neliö on erikoistapaus suorakulmiosta, jossa kaikki sivut ovat yhtä pitkiä."

3. SHORT_ANSWER (lyhyt vastaus - harvinaisempi):
   - Selitykset ja perustelut
   - "Miksi?" ja "Miten?" kysymykset
   - Vastaus 3-10 sanaa

   Esimerkki:
   Kysymys: "Miksi kertolaskussa lukujen järjestyksellä ei ole väliä? (esim. 3 × 4 = 4 × 3)"
   Vastaus: "Kertolaskun vaihdantalaki"
   Selitys: "Kertolaskussa on voimassa vaihdantalaki: a × b = b × a. Tämä tarkoittaa, että 3 × 4 = 12 ja 4 × 3 = 12. Voit ajatella: 3 laatikkoa joissa 4 omenaa = 4 laatikkoa joissa 3 omenaa."

NUMEERISTEN VASTAUSTEN KÄSITTELY:
- Anna pääasiallinen oikea vastaus "correct_answer" -kentässä
- Lisää "acceptable_answers" -taulukkoon vaihtoehtoiset hyväksyttävät muodot:
  * Desimaaliluvut ja murtoluvut: "0.5" ja "$$\\frac{1}{2}$$" ja "1/2" ja "0,5"
  * Prosentit: "50%" ja "0.5" ja "0,5"
  * Eri merkitsemistavat: "3,14" ja "3.14"
  * Kaavat eri muodoissa: "a × b" ja "ab" ja "a * b"

SELITYSTEN KIRJOITTAMINEN:
- Näytä LASKUVAIHEET
- Selitä MIKSI näin lasketaan
- Anna MUISTISÄÄNTÖ jos mahdollista
- Lisää TARKISTUS lopuksi
- Vähintään 30 merkkiä, enintään 400 merkkiä

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti (voi sisältää LaTeX-merkintää $$...$$)",
    "type": "fill_blank" | "matching" | "short_answer",
    "topic": "Laskutoimitukset" | "Geometria" | "Luvut", // PAKOLLINEN - korkeantason aihealue (3-5 aihealuetta)
    "correct_answer": "oikea vastaus (numero tai matemaattinen ilmaisu)",
    "acceptable_answers": ["vaihtoehtoinen muoto 1", "vaihtoehtoinen muoto 2"], // vapaaehtoinen
    "pairs": [{"left": "käsite", "right": "määritelmä"}], // vain matching-tyypille, 3-6 paria
    "explanation": "Selkeä selitys laskuvaiheilla ja muistisäännöillä (vähintään 30 merkkiä)"
  }
]

MUISTA:
- NOUDATA TARKASTI kysymystyyppien jakaumaa (70/20/10)
- Luo TÄSMÄLLEEN ${questionCount} kysymystä
- Käytä LaTeX-merkintää matematiikalle: $$2x + 3$$
- Jokainen kysymys keskittyy YHTEEN ASIAAN
- Näytä LASKUVAIHEET selityksissä
- ÄLÄ käytä multiple_choice, true_false tai sequential
`;
}