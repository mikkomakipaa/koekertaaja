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
      fill_blank: 30,
      true_false: 15,
      sequential: 10,
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
      fill_blank: 40,
      true_false: 15,
      sequential: 10,
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
      fill_blank: 50,
      true_false: 10,
      sequential: 10,
      matching: 5,
    },
  },
} as const;

export function getMathPrompt(
  difficulty: Difficulty,
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

  // Get grade-specific distribution or use defaults
  const getDistribution = () => {
    if (grade && GRADE_DISTRIBUTIONS[grade as 4 | 5 | 6]) {
      const dist = GRADE_DISTRIBUTIONS[grade as 4 | 5 | 6][difficulty];
      return Object.entries(dist)
        .map(([type, percent]) => `- ${percent}% ${type}`)
        .join('\n');
    }
    // Default fallback if grade not specified
    return difficulty === 'helppo'
      ? '- 60% multiple_choice\n- 25% true_false\n- 15% fill_blank'
      : '- 45% multiple_choice\n- 30% fill_blank\n- 15% true_false\n- 10% sequential';
  };

  // Difficulty-specific instructions
  const difficultyInstructions = {
    helppo: `
VAIKEUSTASO: Helppo
- Peruslaskutoimitukset ja yksinkertaiset ongelmat
- Selkeät ja suorat kysymykset ilman monimutkaisia välivaiheita
- Pääpaino: YMMÄRRYKSEN TESTAAMINEN perusasioissa
- Yksivaiheiset laskut ja selkeät tehtävät

KYSYMYSTYYPPIEN JAKAUMA (Luokka ${grade}, Helppo):
${getDistribution()}
- ÄLÄ käytä short_answer helppo-tasolla`,
    normaali: `
VAIKEUSTASO: Normaali
- Monivaiheinen laskenta ja yhdistelmätehtävät
- Vaatii soveltamista ja ymmärrystä
- Sanallisia tehtäviä ja käytännön sovelluksia
- 2-3 vaiheen ongelmat

KYSYMYSTYYPPIEN JAKAUMA (Luokka ${grade}, Normaali):
${getDistribution()}
- ÄLÄ käytä short_answer (liian epämääräinen matematiikassa)`,
  };

  const gradeContext = grade && gradeContent[grade as 4 | 5 | 6]
    ? gradeContent[grade as 4 | 5 | 6]
    : '';

  const gradeNote = grade
    ? `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle ja perustua ${grade}. luokan opetussuunnitelman sisältöön.`
    : '';

  return `Analysoi ${material ? 'seuraava materiaali' : 'nämä dokumentit'} ja luo ${questionCount} monipuolista matematiikan kysymystä koevalmistautumiseen.

${gradeContext}

${difficultyInstructions[difficulty]}
${gradeNote}

${material ? `MATERIAALI:\n${material}\n\n` : ''}════════════════════════════════════════════════════════════════
⚠️  KRIITTINEN VAATIMUS - AIHEIDEN TASAPAINO ⚠️
════════════════════════════════════════════════════════════════

TOPIC BALANCING (PAKOLLINEN):
1. ANALYSOI materiaali ja TUNNISTA 3-5 korkeantason aihealuetta
   Esimerkkejä: "Laskutoimitukset", "Geometria", "Luvut", "Murtoluvut"
2. JOKA IKINEN kysymys TÄYTYY sisältää "topic"-kenttä
3. JAKA kysymykset TASAISESTI kaikkien aihealueiden kesken
   Jos 3 aihetta + 15 kysymystä = 5 kysymystä per aihealue
4. VARMISTA että JOKAINEN kysymys on merkitty aihealueella

⚠️ KYSYMYKSET ILMAN TOPIC-KENTTÄÄ HYLÄTÄÄN AUTOMAATTISESTI

════════════════════════════════════════════════════════════════

TÄRKEÄÄ - KYSYMYSTEN MUOTO:
- Kysymykset ja selitykset esitetään SUOMEKSI
- Käytä LaTeX-merkintää matematiikan kaavoille ja symboleille
- Vaihtele kysymystyyppejä JA aiheita opetussuunnitelman mukaan
- Luo TÄSMÄLLEEN ${questionCount} kysymystä
- Varmista että laskut ovat oikein
- NOUDATA TARKASTI vaikeustason kysymystyyppien jakaumaa
- PERUSTA kysymykset annettuun materiaaliin ${gradeContext ? `ja ${grade}. luokan opetussuunnitelmaan` : ''}

MATEMAATTINEN MERKINTÄTAPA:
- Käytä LaTeX-merkintää: $$formula$$  (esim. $$x^2 + 2x + 1 = 0$$)
- Inline-kaavat: $$x + 5$$ tai $$\\frac{1}{2}$$
- Murtoluvut: $$\\frac{osoittaja}{nimittäjä}$$
- Neliöjuuri: $$\\sqrt{x}$$ tai $$\\sqrt[3]{x}$$ (kuutiojuuri)
- Potenssi: $$x^2$$ tai $$2^{10}$$
- Kreikkalaiset kirjaimet: $$\\pi$$, $$\\alpha$$, $$\\theta$$
- Trigonometria: $$\\sin(x)$$, $$\\cos(x)$$, $$\\tan(x)$$
- Erikoismerkit: $$\\times$$ (kertomerkki), $$\\div$$ (jakomerkki), $$\\pm$$ (plus-miinus)
- TÄRKEÄÄ: Käytä AINA $$\\div$$ jakolaskuissa yhtälöissä, ÄLÄ käytä / -merkkiä

KYSYMYSTYYPPIEN KÄYTTÖOHJEET:

1. MULTIPLE_CHOICE (monivalinta):
   - Sopii: laskutehtävät, yhtälöt, geometria, käsitteiden tunnistaminen
   - Esim: "Laske: $$15 \\times 8 + 12$$"
   - Vaihtoehdot: 4 kpl, yksi oikea vastaus
   - Väärät vastaukset: yleisiä laskuvirheitä (unohdettu termi, väärä laskujärjestys, etc)

2. TRUE_FALSE (totta/tarua):
   - Sopii: käsitteiden ymmärtäminen, sääntöjen tunnistaminen
   - Esim: "Totta vai tarua: Neliön kaikki sivut ovat yhtä pitkiä."
   - correct_answer: true tai false (boolean, EI "totta"/"tarua")

3. FILL_BLANK (täydennä):
   - Helppo: yksinkertainen numeerinen vastaus
   - Normaali/Vaikea: vaatii laskemista
   - Esim: "Laske: $$7^2 - 5 \\times 3$$ = ___"
   - Esim: "Laske: $$20 \\div 4 + 3$$ = ___"
   - Anna acceptable_answers listaan vaihtoehtoiset muodot

4. MATCHING (paritus):
   - Sopii: termit ja määritelmät, kaavat ja nimet
   - Käytä säästeliäästi, vain jos aihe sopii

5. SEQUENTIAL (järjestys):
   - Sopii: ratkaisun vaiheet, laskujärjestys, ongelman ratkaisuprosessi
   - Käytä helppo ja normaali tasoilla
   - Helppo taso: 4 vaihetta, Normaali taso: 5-6 vaihetta

   Helppo taso - Laskujärjestys:
   Kysymys: "Järjestä nämä laskun vaiheet oikeaan järjestykseen laskettaessa $$3 + 4 \\times 5$$:"
   items: [
     "Laske kertolasku: $$4 \\times 5 = 20$$",
     "Laske yhteenlasku: $$3 + 20 = 23$$",
     "Tunnista operaatiot: yhteenlasku ja kertolasku",
     "Vastaus on 23"
   ]
   correct_order: [2, 0, 1, 3]

   Normaali taso - Yhtälön ratkaisu:
   Kysymys: "Järjestä nämä vaiheet oikeaan järjestykseen kun ratkaistaan yhtälö $$2x + 6 = 14$$:"
   items: [
     "Vähennä molemmilta puolilta 6: $$2x = 8$$",
     "Jaa molemmat puolet luvulla 2: $$x = 4$$",
     "Tarkista vastaus: $$2 \\times 4 + 6 = 14$$ ✓",
     "Aloitetilanne: $$2x + 6 = 14$$",
     "Vastaus on $$x = 4$$"
   ]
   correct_order: [3, 0, 1, 4, 2]

   Normaali taso - Pinta-alan laskeminen:
   Kysymys: "Järjestä nämä vaiheet oikeaan järjestykseen kun lasketaan suorakulmion pinta-ala (leveys 5 cm, korkeus 8 cm):"
   items: [
     "Pinta-ala = $$5 \\times 8 = 40$$ neliösenttimetriä",
     "Käytetään kaavaa: Pinta-ala = leveys $$\\times$$ korkeus",
     "Tunnetaan mitat: leveys = 5 cm, korkeus = 8 cm",
     "Sijoitetaan arvot kaavaan"
   ]
   correct_order: [2, 1, 3, 0]

NUMEERISTEN VASTAUSTEN KÄSITTELY:
- Anna pääasiallinen oikea vastaus "correct_answer" -kentässä
- Lisää "acceptable_answers" -taulukkoon vaihtoehtoiset hyväksyttävät muodot:
  * Desimaaliluvut ja murtoluvut: "0.5" ja "$$\\frac{1}{2}$$" ja "1/2" ja "0,5"
  * Prosentit: "50%" ja "0.5" ja "0,5"
  * Eri merkitsemistavat: "3,14" ja "3.14"
  * Sievennetyt ja sieventämättömät muodot: "$$\\frac{2}{4}$$" ja "$$\\frac{1}{2}$$"
  * Kokonaisluvut: "5" ja "5.0" ja "5,0"

VÄÄRÄT VASTAUKSET (multiple_choice):
Väärät vastaukset tulee olla uskottavia - käytä yleisiä laskuvirheitä:
- Unohdettu termi: Jos oikea vastaus on 24, väärä voi olla 20
- Väärä operaatio: 28 (yhteenlasku kertolaskun sijaan)
- Laskujärjestysvirhe: 35 (laskettu vasemmalta oikealle ilman järjestystä)
- Yksikkövirhe tai väärä muunnos

════════════════════════════════════════════════════════════════
📋 JSON VASTAUSMUOTO - NOUDATA TARKASTI
════════════════════════════════════════════════════════════════

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti suomeksi (voi sisältää LaTeX-merkintää)",
    "type": "multiple_choice" | "fill_blank" | "true_false" | "matching" | "sequential",
    "topic": "Laskutoimitukset" | "Geometria" | "Luvut", // ⚠️ PAKOLLINEN - JOKA kysymyksessä
    "options": ["vaihtoehto1", "vaihtoehto2", "vaihtoehto3", "vaihtoehto4"], // vain multiple_choice
    "items": ["vaihe1", "vaihe2", "vaihe3", "vaihe4"], // PAKOLLINEN sequential kysymyksille
    "correct_order": [2, 0, 1, 3], // PAKOLLINEN sequential kysymyksille - indeksit oikeassa järjestyksessä
    "correct_answer": "oikea vastaus (voi sisältää LaTeX-merkintää)",  // EI käytetä sequential kysymyksissä
    "acceptable_answers": ["vaihtoehtoinen muoto 1", "vaihtoehtoinen muoto 2"], // vapaaehtoinen, erityisesti fill_blank
    "explanation": "selitys suomeksi kuinka vastaus saadaan (näytä laskuvaiheet)"
  }
]

════════════════════════════════════════════════════════════════
✅ TARKISTUSLISTA ENNEN VASTAAMISTA
════════════════════════════════════════════════════════════════

Varmista että:
✓ JOKAINEN kysymys sisältää "topic"-kentän (ei yhtään tyhjää!)
✓ Kysymykset jakautuvat TASAISESTI aihealueiden kesken
✓ KYSYMYSTYYPPIEN JAKAUMA vastaa vaikeustason ohjeita (${difficulty})
✓ Kaikki laskut on tarkistettu ja ovat OIKEIN
✓ Väärät vastaukset ovat uskottavia (yleisiä laskuvirheitä)
✓ Selitykset näyttävät laskuaskeleet selkeästi
✓ Kysymykset perustuvat materiaaliin ${gradeContext ? `ja ${grade}. luokan opetussuunnitelmaan` : ''}
✓ LaTeX-merkintä on oikein muotoiltu ($$...$$)
✓ Numeeristen vastausten kaikki hyväksyttävät muodot listattu
✓ Sequential kysymyksillä oikeat indeksit (0-based)
✓ Jokainen kysymys on uniikki
✓ Vastaat PELKÄLLÄ JSON-taulukolla, ei muuta tekstiä

⚠️ KYSYMYKSET ILMAN TOPIC-KENTTÄÄ HYLÄTÄÄN AUTOMAATTISESTI

════════════════════════════════════════════════════════════════`;
}
