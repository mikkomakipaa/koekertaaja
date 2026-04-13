import Link from 'next/link';

export const metadata = {
  title: 'Käyttöehdot – Koekertaaja',
  description: 'Koekertaaja-palvelun käyttöehdot rekisteröidyille pääkäyttäjille.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8 md:py-16">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Etusivu
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Käyttöehdot</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Voimassa 11.4.2026 alkaen
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">

          <Section title="1. Palvelun kuvaus">
            <p>
              Koekertaaja on Mikko Mäkipään ylläpitämä verkkopalvelu, jonka avulla voidaan luoda tekoälyavusteisia
              harjoitussisältöjä peruskoulun oppilaita varten. Oppilaat voivat käyttää harjoituksia ilman käyttäjätiliä.
              Palvelu ei kerää oppilaita koskevaa dataa.
            </p>
            <p>
              Palvelu on tarkoitettu itsenäiseen koeharjoitteluun. Pääkäyttäjät ovat lasten huoltajja, jotka luovat koeharjoittelusarjoja palveluun.
            </p>
          </Section>

          <Section title="2. Käyttäjätilit ja rekisteröityminen">
            <p>
              Kysymysten luominen vaatii pääkäyttäjätilin. Pääkäyttäjätilin luominen edellyttää voimassa olevaa rekisteröintikoodia.
              Rekisteröityessäsi sitoudut antamaan oikeat tiedot ja pitämään ne ajan tasalla.
            </p>
            <p>
              Olet vastuussa tilisi kirjautumistietojen ja tiliin tarvittavan API-avaimesi salassapidosta.
            </p>
          </Section>

          <Section title="3. API-avain ja tekoälypalvelut">
            <p>
              Palvelu välittää pyynnöt tekoälypalvelulle (OpenAI tai Anthropic) käyttäen
              sinun henkilökohtaista API-avaintasi. Olet itse sopimussuhteessa kyseiseen
              palveluntarjoajaan ja vastaat kaikista sen laskuttamista kustannuksista.
            </p>
            <p>
              Koekertaaja tallentaa API-avaimen salattuun varastoon eikä sitä voi lukea
              takaisin selväkielisenä palvelun kautta. Et voi vaatia Koekertaajaa
              palauttamaan avainta sinulle; tallenna avain itse turvalliseen paikkaan.
            </p>
            <p>
              Et saa käyttää API-avainta tavalla, joka rikkoo kyseisen
              palveluntarjoajan omia käyttöehtoja.
            </p>
          </Section>

          <Section title="4. Sallittu käyttö">
            <p>Sitoudut käyttämään palvelua ainoastaan lainmukaiseen ja
              asianmukaiseen opetustoimintaan. Kiellettyä on muun muassa:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>palvelun käyttäminen loukkaavan, harhaanjohtavan tai laittoman sisällön tuottamiseen,</li>
              <li>tekoälyn pyyntömäärien tarkoituksellinen kasvattaminen tavalla, joka aiheuttaa kohtuuttomia kustannuksia kolmansille,</li>
              <li>palvelun teknisen infrastruktuurin kuormittaminen tai häiritseminen,</li>
              <li>muiden käyttäjien tietoihin luvattomasti pääseminen.</li>
            </ul>
          </Section>

          <Section title="5. Sisällöt ja immateriaalioikeudet">
            <p>
              Pääkäyttäjä vastaa luomansa sisällön (kysymyssarjat, aiheet) asianmukaisuudesta
              ja siitä, ettei se loukkaa tekijänoikeuksia tai muita kolmansien oikeuksia.
            </p>
            <p>
              Koekertaajan toimintamalli, koodi, ulkoasu ja tuotenimi ovat Mikko Mäkipään omaisuutta.
              Palvelun käyttäminen ei siirrä niihin mitään oikeuksia käyttäjälle.
            </p>
          </Section>

          <Section title="6. Palvelun saatavuus">
            <p>
              Palvelu tarjotaan nykytilan mukaisena käyttöön. Ylläpitäjä ei takaa keskeytyksetöntä tai
              virheetöntä toimintaa. Pidätämme oikeuden muuttaa, keskeyttää tai lopettaa
              palvelun tai sen osia ilman etukäteisilmoitusta.
            </p>
          </Section>

          <Section title="7. Vastuunrajoitus">
            <p>
              Mikko Mäkipää ei vastaa välillisistä vahingoista, kuten API-kustannusten
              odottamattomasta kasvusta tai tietojen menetyksestä, siltä osin kuin
              sovellettava pakottava lainsäädäntö tämän sallii. Kuluttajansuojalain
              pakottavat säännökset menevät näiden ehtojen edelle.
            </p>
            <p>
              Koekertaaja ei vastaa tekoälypalvelujen tuottamien sisältöjen
              oikeellisuudesta tai sopivuudesta. Pääkäyttäjä on vastuussa
              tekoälyn tuottamien sisältöjen tarkistamisesta ennen niiden käyttöä harjoittelussa.
            </p>
          </Section>

          <Section title="8. Tilin sulkeminen">
            <p>
              Voit pyytää tilisi poistamista milloin tahansa ottamalla yhteyttä
              rekisterinpitäjään. Rekisterinpitäjällä on oikeus sulkea tili, mikäli
              käyttöehtoja rikotaan olennaisesti.
            </p>
          </Section>

          <Section title="9. Muutokset käyttöehtoihin">
            <p>
              Voimme päivittää näitä ehtoja. Olennaisista muutoksista ilmoitetaan palvelussa näytettävällä ilmoituksella vähintään 30 päivää ennen
              muutosten voimaantuloa. Jatkamalla palvelun käyttöä muutosten voimaantulon jälkeen hyväksyt päivitetyt ehdot.
            </p>
          </Section>

          <Section title="10. Sovellettava laki ja riitojen ratkaisu">
            <p>
              Näihin ehtoihin sovelletaan Suomen lakia. Erimielisyydet pyritään
              ensisijaisesti ratkaisemaan neuvottelemalla. Kuluttajalla on oikeus saattaa
              erimielisyys maksutta{' '}
              <a
                href="https://www.kuluttajariitalautakunta.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                kuluttajariitalautakunnan
              </a>{' '}
              käsiteltäväksi. Mikäli erimielisyyttä ei saada ratkaistua muutoin,
              riita saatetaan toimivaltaisen käräjäoikeuden ratkaistavaksi.
            </p>
          </Section>

          <Section title="11. Yhteystiedot">
            <p>
              Käyttöehtoihin liittyvät kysymykset:{' '}
              <a href="mailto:[TODO: yhteystietosähköposti]" className="text-indigo-600 hover:underline dark:text-indigo-400">
                [TODO: yhteystietosähköposti]
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
