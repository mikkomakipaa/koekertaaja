import { Difficulty } from '@/types';

export function getGenericPrompt(
  subject: string,
  difficulty: Difficulty,
  questionCount: number,
  grade?: number,
  material?: string
): string {
  // Difficulty-specific instructions with question type guidance
  const difficultyInstructions = {
    helppo: `
VAIKEUSTASO: Helppo
- Perustason käsitteet ja teoriat
- Yksinkertaiset ja selkeät kysymykset
- Keskity olennaisimpiin asioihin
- Suoraviivainen sisältö ja tunnistaminen

KYSYMYSTYYPPIEN JAKAUMA (Helppo):
- 65% multiple_choice (monivalinta)
- 25% true_false (totta/tarua)
- 10% fill_blank (täydennä, yksinkertainen)
- ÄLÄ käytä short_answer tai matching`,
    normaali: `
VAIKEUSTASO: Normaali
- Monipuolinen sisältö ja keskitason käsitteet
- Vaihtelevat kysymystyypit
- Vaatii ymmärrystä ja soveltamista
- Kohtuullisen haastava

KYSYMYSTYYPPIEN JAKAUMA (Normaali):
- 50% multiple_choice (monivalinta)
- 20% fill_blank (täydennä)
- 15% true_false (totta/tarua)
- 10% short_answer (lyhyt vastaus)
- 5% matching (parit, jos sopii aiheeseen)`,
    vaikea: `
VAIKEUSTASO: Vaikea
- Laaja ja syventävä sisältö
- Monimutkaiset kysymykset ja tilanteet
- Vaatii analyyttistä ajattelua ja soveltamista
- Haastava ja vaativa taso

KYSYMYSTYYPPIEN JAKAUMA (Vaikea):
- 35% short_answer (avoin vastaus, vaatii selitystä)
- 30% multiple_choice (monivalinta, mutta haastavampi)
- 20% fill_blank (täydennä, vaatii ymmärrystä)
- 15% matching tai true_false
- Suosi kysymyksiä jotka vaativat PERUSTELUA ja SOVELTAMISTA`,
  };

  const gradeContext = grade
    ? `Kysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle.`
    : '';

  return `Analysoi ${material ? 'seuraava materiaali' : 'nämä dokumentit'} ja luo ${questionCount} monipuolista kysymystä aiheesta "${subject}".

${difficultyInstructions[difficulty]}

${gradeContext}

${material ? `MATERIAALI:\n${material}\n\n` : ''}TÄRKEÄÄ - KYSYMYSTEN MUOTO:
- Kysymykset esitetään SUOMEKSI
- Luo kysymyksiä jotka testaavat ymmärrystä aiheesta "${subject}"
- Vaihtele kysymystyyppejä
- Luo TÄSMÄLLEEN ${questionCount} kysymystä
- Perusta kysymykset annettuun materiaaliin
- NOUDATA TARKASTI vaikeustason kysymystyyppien jakaumaa

KYSYMYSTYYPPIEN KÄYTTÖOHJEET:

1. MULTIPLE_CHOICE (monivalinta):
   - Sopii: käsitteiden tunnistaminen, faktat, prosessit
   Kysymys: "Mikä seuraavista on oikein?"
   Vaihtoehdot: ["vaihtoehto 1", "vaihtoehto 2", "vaihtoehto 3", "vaihtoehto 4"]
   - 4 vaihtoehtoa, yksi oikea
   - Väärät vastaukset uskottavia

2. TRUE_FALSE (totta/tarua):
   - Sopii: väittämät, tosiasiat, käsitteiden ymmärtäminen
   Kysymys: "Totta vai tarua: [väite]"
   Vastaus: true tai false

3. FILL_BLANK (täydennä):
   - Helppo: yksi puuttuva sana tai luku
   - Normaali/Vaikea: useampi sana tai käsite
   Kysymys: "Täydennä: [lause jossa puuttuu sana tai käsite]"
   Vastaus: "oikea vastaus"
   - Anna acceptable_answers listaan vaihtoehtoiset hyväksyttävät vastaukset

4. SHORT_ANSWER (lyhyt avoin vastaus):
   - VAIN normaali ja vaikea vaikeustasoilla
   - Vaatii selitystä, perustelua tai kuvausta

   Normaali taso:
   Kysymys: "Selitä lyhyesti mikä on [käsite]."
   Vastaus: "1-2 lauseen selitys"

   Vaikea taso:
   Kysymys: "Analysoi ja perustele miksi [ilmiö] tapahtuu."
   Vastaus: "Perusteellinen selitys useammalla lauseella"

   - Anna acceptable_answers listaan erilaisia hyväksyttäviä vastauksia

5. MATCHING (parit):
   - Sopii: käsitteet ja määritelmät, termit ja kuvaukset
   - Käytä normaali ja vaikea tasoilla jos aihe sopii
   Esim: Yhdistä käsite ja määritelmä
   Parit: [{"left": "käsite1", "right": "määritelmä1"}, ...]

VÄÄRÄT VASTAUKSET (multiple_choice):
Väärät vastaukset tulee olla uskottavia:
- Liity samaan aihepiiriin
- Sisällä yleisiä väärinkäsityksiä
- Ole lähellä oikeaa vastausta mutta selvästi väärin
- Testaa ymmärrystä, älä vain muistia

Luo kysymykset JSON-muodossa. VASTAA VAIN JSON-MUODOSSA ILMAN MITÄÄN MUUTA TEKSTIÄ:

[
  {
    "question": "kysymysteksti suomeksi",
    "type": "multiple_choice" | "fill_blank" | "true_false" | "short_answer" | "matching",
    "options": ["vaihtoehto1", "vaihtoehto2", "vaihtoehto3", "vaihtoehto4"], // vain multiple_choice
    "correct_answer": "oikea vastaus",
    "acceptable_answers": ["vaihtoehtoinen vastaus"], // vapaaehtoinen, fill_blank ja short_answer
    "explanation": "selitys suomeksi miksi tämä on oikea vastaus"
  }
]

Varmista että:
- Jokainen kysymys on uniikki
- Väärät vastaukset ovat uskottavia
- Selitykset ovat informatiivisia
- Kysymykset kattavat materiaalin laajasti
- Kysymykset liittyvät aiheeseen "${subject}"
- KYSYMYSTYYPPIEN JAKAUMA vastaa vaikeustason ohjeita
- Kysymykset perustuvat annettuun materiaaliin`;
}
