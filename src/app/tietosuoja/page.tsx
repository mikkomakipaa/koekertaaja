import Link from 'next/link';

export const metadata = {
  title: 'Tietosuojaseloste – Koekertaaja',
  description: 'Koekertaaja-palvelun tietosuojaseloste rekisteröidyille pääkäyttäjille.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8 md:py-16">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Etusivu
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tietosuojaseloste</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Voimassa 11.4.2025 alkaen · EU:n yleinen tietosuoja-asetus (GDPR) 13 ja 14 artikla
        </p>

        <div className="prose prose-slate dark:prose-invert mt-10 max-w-none text-sm leading-relaxed">

          <Section title="1. Rekisterinpitäjä">
            <p>Mikko Mäkipää</p>
            <p>
              Sähköposti:{' '}
              <a href="mailto:[TODO: yhteystietosähköposti]" className="text-indigo-600 hover:underline dark:text-indigo-400">
                [TODO: yhteystietosähköposti]
              </a>
            </p>
          </Section>

          <Section title="2. Käsiteltävät henkilötiedot ja käsittelyn tarkoitus">
            <p>
              Käsittelemme yksinomaan <strong>rekisteröityneiden pääkäyttäjien</strong> tietoja.
              Palvelun oppilailla ei ole käyttäjätilejä eikä heistä tallenneta henkilötietoja.
            </p>
            <Table
              headers={['Tieto', 'Käsittelyn tarkoitus', 'Oikeusperuste']}
              rows={[
                ['Nimi', 'Käyttäjätunnuksen yksilöinti', 'Sopimuksen täytäntöönpano (art. 6.1 b)'],
                ['Sähköpostiosoite', 'Kirjautuminen ja yhteydenpito', 'Sopimuksen täytäntöönpano (art. 6.1 b)'],
                ['Koulu / kunta', 'Sisältöjen kohdistaminen oikealle koululle', 'Sopimuksen täytäntöönpano (art. 6.1 b)'],
                ['Salattu API-avain (OpenAI / Anthropic)', 'Tekoälykysymysten generointi käyttäjän omalla tilillä', 'Sopimuksen täytäntöönpano (art. 6.1 b)'],
                ['Kirjautumisaika ja istuntotiedot', 'Tietoturva ja väärinkäytösten ehkäisy', 'Oikeutettu etu (art. 6.1 f)'],
              ]}
            />
          </Section>

          <Section title="3. Tietojen säilytysaika">
            <p>
              Henkilötietoja säilytetään niin kauan kuin käyttäjätili on aktiivinen.
              Tilin poistamisen yhteydessä poistetaan välittömästi:
            </p>
            <ul>
              <li>käyttäjätili ja kirjautumistiedot,</li>
              <li>koulujäsenyys,</li>
              <li>salattu API-avain.</li>
            </ul>
            <p>
              Koulu ja siihen liitetyt harjoitussisällöt voidaan säilyttää muiden käyttäjien tai
              koulun tarpeisiin.
            </p>
          </Section>

          <Section title="4. Henkilötietojen vastaanottajat ja siirrot">
            <p>Emme myy tai luovuta tietojasi kolmansille osapuolille markkinointitarkoituksiin.</p>
            <p>Käytämme seuraavia alihankkijoita tietojenkäsittelijöinä:</p>
            <Table
              headers={['Alihankkija', 'Rooli', 'Tietojen sijaintialue']}
              rows={[
                ['Supabase Inc.', 'Tietokanta- ja autentikointipalvelu', 'EU (Frankfurt, AWS eu-central-1)'],
                ['OpenAI / Anthropic', 'Tekoälypalvelu (käyttäjän oma API-avain)', 'Yhdysvallat – käyttäjä solmii itse sopimuksen palveluntarjoajan kanssa'],
              ]}
            />
            <p>
              OpenAI:n ja Anthropicin kohdalla Koekertaaja välittää käyttäjän omalla avaimella
              tehtyjä pyyntöjä. Käyttäjä on itse sopimussuhteessa kyseisiin palveluntarjoajiin eikä
              Koekertaaja ole vastuussa näiden tietojenkäsittelystä.
            </p>
            <p>
              Tietoja ei siirretä EU/ETA-alueen ulkopuolelle muutoin kuin edellä mainittujen
              alihankkijoiden kautta tai käyttäjän oman API-avaimen käytön yhteydessä.
            </p>
          </Section>

          <Section title="5. Rekisteröidyn oikeudet">
            <p>Sinulla on oikeus:</p>
            <ul>
              <li><strong>Tarkastusoikeus (art. 15):</strong> saada tieto itseäsi koskevista tiedoista.</li>
              <li><strong>Oikaisupyyntö (art. 16):</strong> korjata virheelliset tai puutteelliset tiedot.</li>
              <li><strong>Poistamisoikeus (art. 17):</strong> pyytää tietojesi poistamista ("oikeus tulla unohdetuksi").</li>
              <li><strong>Käsittelyn rajoittaminen (art. 18):</strong> pyytää käsittelyn rajoittamista tietyin edellytyksin.</li>
              <li><strong>Tietojen siirrettävyys (art. 20):</strong> saada tietosi koneluettavassa muodossa.</li>
              <li><strong>Vastustamisoikeus (art. 21):</strong> vastustaa oikeutettuun etuun perustuvaa käsittelyä.</li>
            </ul>
            <p>
              Lähetä oikeuksiasi koskevat pyynnöt sähköpostitse rekisterinpitäjälle. Vastaamme
              pyyntöihin GDPR:n edellyttämässä 30 päivän kuluessa.
            </p>
            <p>
              Sinulla on myös oikeus tehdä valitus{' '}
              <a
                href="https://tietosuoja.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline dark:text-indigo-400"
              >
                tietosuojavaltuutetun toimistolle
              </a>{' '}
              (tietosuoja.fi), mikäli katsot, että tietojasi on käsitelty lainvastaisesti.
            </p>
          </Section>

          <Section title="6. Tietoturva">
            <p>
              API-avaimet tallennetaan salattuina Supabase Vault -palveluun eikä niitä voi
              lukea takaisin selväkielisinä palvelun kautta. Kaikki tietoliikenne tapahtuu
              TLS-suojatusti. Käyttäjien autentikointi hoidetaan Supabase Auth -palvelun
              avulla.
            </p>
          </Section>

          <Section title="7. Evästeet ja seurantatiedot">
            <p>
              Palvelu käyttää ainoastaan istunnonhallintaan tarvittavia evästeitä
              (Supabase Auth). Emme käytä kolmansien osapuolten analytiikka- tai
              mainosevästeitä.
            </p>
          </Section>

          <Section title="8. Muutokset tietosuojaselosteeseen">
            <p>
              Voimme päivittää tätä selostetta palvelun kehittyessä. Olennaisista
              muutoksista ilmoitetaan rekisteröidyille sähköpostitse tai palvelussa
              näytettävällä ilmoituksella ennen muutosten voimaantuloa.
            </p>
          </Section>

          <Section title="9. Yhteystiedot">
            <p>
              Tietosuojaan liittyvät kysymykset ja oikeuksien käyttämistä koskevat
              pyynnöt:{' '}
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
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="space-y-3 text-slate-700 dark:text-slate-300">{children}</div>
    </section>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
