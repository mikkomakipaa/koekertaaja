import { Difficulty } from '@/types';

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

  // Difficulty-specific instructions with question type guidance
  const difficultyInstructions = {
    helppo: `
VAIKEUSTASO: Helppo
- Peruslaskutoimitukset ja yksinkertaiset ongelmat
- Selkeät ja suorat kysymykset ilman monimutkaisia välivaiheita
- Pääpaino: YMMÄRRYKSEN TESTAAMINEN perusasioissa
- Yksivaiheiset laskut ja selkeät tehtävät

KYSYMYSTYYPPIEN JAKAUMA (Helppo):
- 60% multiple_choice (monivalinta)
- 20% true_false (totta/tarua)
- 10% fill_blank (täydennä, yksinkertainen numeerinen vastaus)
- 10% sequential (järjestys - 4 vaihetta)
- ÄLÄ käytä short_answer tai matching`,
    normaali: `
VAIKEUSTASO: Normaali
- Monivaiheinen laskenta ja yhdistelmätehtävät
- Vaatii soveltamista ja ymmärrystä
- Sanallisia tehtäviä ja käytännön sovelluksia
- 2-3 vaiheen ongelmat

KYSYMYSTYYPPIEN JAKAUMA (Normaali):
- 55% multiple_choice (monivalinta)
- 25% fill_blank (täydennä, numeerinen vastaus)
- 10% sequential (järjestys - 5-6 vaihetta)
- 10% true_false (totta/tarua)
- ÄLÄ käytä short_answer (liian epämääräinen matematiikassa)
- Voit käyttää matching jos sopii aiheeseen`,
    vaikea: `
VAIKEUSTASO: Vaikea
- Monimutkaisia ongelmia ja useamman käsitteen yhdistämistä
- Vaatii syvällistä ymmärrystä ja analyyttista ajattelua
- Todistukset, perustelut ja monivaiheisia ratkaisuja
- Epäsuorat kysymykset ja ongelmanratkaisu

KYSYMYSTYYPPIEN JAKAUMA (Vaikea):
- 50% multiple_choice (monivalinta, mutta vaikeammat laskut)
- 35% fill_blank (täydennä, vaatii laskemista)
- 15% true_false tai matching
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

${material ? `MATERIAALI:\n${material}\n\n` : ''}TÄRKEÄÄ - KYSYMYSTEN MUOTO:
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

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti suomeksi (voi sisältää LaTeX-merkintää)",
    "type": "multiple_choice" | "fill_blank" | "true_false" | "matching",
    "options": ["vaihtoehto1", "vaihtoehto2", "vaihtoehto3", "vaihtoehto4"], // vain multiple_choice
    "correct_answer": "oikea vastaus (voi sisältää LaTeX-merkintää)",
    "acceptable_answers": ["vaihtoehtoinen muoto 1", "vaihtoehtoinen muoto 2"], // vapaaehtoinen, erityisesti fill_blank
    "explanation": "selitys suomeksi kuinka vastaus saadaan (näytä laskuvaiheet)"
  }
]

Varmista että:
- Jokainen kysymys on uniikki
- Kaikki laskut on tarkistettu ja ovat oikein
- Väärät vastaukset ovat uskottavia (yleisiä laskuvirheitä)
- Selitykset näyttävät laskuaskeleet selkeästi
- Kysymykset perustuvat annettuun materiaaliin ${gradeContext ? `ja ${grade}. luokan opetussuunnitelmaan` : ''}
- LaTeX-merkintä on oikein muotoiltu
- Numeeristen vastausten kaikki hyväksyttävät muodot on listattu
- KYSYMYSTYYPPIEN JAKAUMA vastaa vaikeustason ohjeita`;
}
