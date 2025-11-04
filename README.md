# Koekertaaja

**Harjoittele kokeisiin ja opi uutta!** 🚀

Koekertaaja on interaktiivinen koeharjoittelusovellus, joka auttaa opiskelijoita valmistautumaan kokeisiin pelillistetyn oppimisen avulla. Lataa oppimateriaalisi, anna tekoälyn luoda kysymyksiä, ja kerää pisteitä oikeilla vastauksilla!

![Made with Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Anthropic Claude](https://img.shields.io/badge/AI-Claude_Sonnet_4-purple)

## ✨ Ominaisuudet

### 🎮 Pelillistetty oppiminen
- **Pistejärjestelmä**: Ansaitse 10 pistettä jokaisesta oikeasta vastauksesta
- **Putkibonukset**: Saat +5 bonuspistettä kun vastaat 3+ oikein putkeen
- **Saavutukset**: Avaa erikoismerkkejä täydellisistä suorituksista ja pitkistä putkista
- **Dynaamiset juhlinnot**: Erilainen juhlinta tulostasosi mukaan
- **Visuaalinen palaute**: Näe edistyksesi reaaliajassa

### 📚 Kysymyssarjojen luonti
- **AI-avusteinen generointi**: Claude Sonnet 4 -tekoäly luo kysymyksiä materiaalistasi
- **Monipuoliset lähdemateriaalit**: Lataa PDF-tiedostoja, kuvia tai kirjoita teksti
- **Vaihtelevia vaikeustasoja**: Helppo, Normaali, Vaikea, Mahdoton
- **Säädettävä kysymysmäärä**: 20-100 kysymystä per koealue
- **Jaettavat koodit**: Jokaiselle koealueelle generoidaan uniikki 6-merkkinen koodi

### 🎯 Harjoittelu
- **Koealueiden selaus**: Selaa kaikkia saatavilla olevia koealueita
- **Edistymisen seuranta**: Näe pistemääräsi ja nykyinen putki
- **Välitön palaute**: Saat selityksen jokaisen kysymyksen jälkeen
- **Tulosyhteenveto**: Katso kokonaissuorituksesi ja oikeat vastaukset
- **Mobiiliystävällinen**: Toimii saumattomasti kaikilla laitteilla

### 🎨 Moderni käyttöliittymä
- **Värikkäät gradientit**: Energinen teal-purple-pink -värimaailma
- **Glassmorphism-efektit**: Nykyaikaiset läpinäkyvät elementit
- **Tähtiluokitukset**: Visuaaliset vaikeustason indikaattorit
- **Responsiivinen**: Optimoitu sekä tietokoneelle että mobiilille
- **Touch-optimoitu**: Suuret kosketustavoitteet mobiililaitteille

## 🚀 Pika-aloitus (ei-teknisille käyttäjille)

### Vaihe 1: Hanki tarvittavat tilit

1. **Supabase-tili** (tietokanta):
   - Mene osoitteeseen [supabase.com](https://supabase.com)
   - Luo ilmainen tili
   - Luo uusi projekti
   - Kirjaa ylös Project URL ja anon public key (löytyvät Settings → API)

2. **Anthropic-tili** (tekoäly):
   - Mene osoitteeseen [console.anthropic.com](https://console.anthropic.com)
   - Luo tili ja hanki API-avain
   - Kirjaa ylös API-avain

### Vaihe 2: Asenna sovellus

1. **Lataa koodi**:
   ```bash
   git clone https://github.com/mikkomakipaa/exam-prepper.git
   cd exam-prepper
   ```

2. **Asenna riippuvuudet**:
   ```bash
   npm install
   ```

3. **Konfiguroi ympäristömuuttujat**:
   - Kopioi `.env.example` → `.env.local`
   - Avaa `.env.local` tekstieditorissa
   - Lisää Supabase-tiedot:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=sinun_supabase_url_tähän
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sinun_supabase_anon_key_tähän
     SUPABASE_SERVICE_ROLE_KEY=sinun_service_role_key_tähän
     ANTHROPIC_API_KEY=sinun_anthropic_api_key_tähän
     ```

### Vaihe 3: Alusta tietokanta

1. Mene Supabase-projektiisi
2. Avaa SQL Editor
3. Kopioi ja aja tiedosto `supabase/migrations/20250103_initial_schema.sql`
4. Tämä luo tarvittavat taulut: `question_sets` ja `questions`

### Vaihe 4: Käynnistä sovellus

```bash
npm run dev
```

Avaa selaimessa [http://localhost:3000](http://localhost:3000)

## 📖 Käyttöohje

### Koealueen luominen

1. Klikkaa **"Luo uusi koealue"** etusivulla
2. Valitse **aine** (esim. Englanti)
3. Valitse **luokka-aste** (valinnainen)
4. Valitse **vaikeustaso** (Helppo, Normaali, Vaikea, Mahdoton)
5. Valitse **kysymysten määrä** (20-100)
6. Lisää **oppimateriaali**:
   - Kirjoita tekstiä tekstikenttään
   - TAI lataa PDF-tiedostoja
   - TAI lataa kuvia
7. Klikkaa **"Luo kysymyssarja"**
8. Odota että tekoäly generoi kysymykset (20-60 sekuntia)
9. Saat **jakokelpoisen koodin** (esim. `A3B7XY`)

### Harjoittelu

1. Klikkaa **"Aloita harjoittelu"** etusivulla
2. Selaa **koealueita** ja klikkaa haluamaasi
3. Vastaa kysymyksiin:
   - Valitse vastauksesi
   - Klikkaa **"Tarkista vastaus"**
   - Lue selitys ja kerää pisteitä
   - Klikkaa **"Seuraava kysymys"**
4. Katso **tuloksesi**:
   - Kokonaispistemäärä
   - Paras putki
   - Avatut saavutukset
   - Kaikki vastaukset selityksineen
5. Pelaa uudestaan tai palaa valikkoon

### Pisteiden ansaitseminen

- **10 pistettä** jokaisesta oikeasta vastauksesta
- **+5 bonuspistettä** kun vastaat 3 tai enemmän oikein peräkkäin
- **Saavutukset**:
  - 🏆 **Täydellisyys** - 100% oikein
  - 🔥 **Tuliputki** - 5+ oikein peräkkäin

## 🛠️ Tekniset tiedot

### Teknologiat

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Tietokanta**: Supabase (PostgreSQL)
- **Tekoäly**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Hosting**: Vercel-valmis

### Projektirakenteen

```
exam-prepper/
├── src/
│   ├── app/                      # Next.js sivut
│   │   ├── page.tsx             # Etusivu
│   │   ├── create/page.tsx      # Luo koealue
│   │   ├── play/page.tsx        # Selaa koealueita
│   │   ├── play/[code]/page.tsx # Pelaa kysymyksiä
│   │   └── api/                 # API-reitit
│   ├── components/              # React-komponentit
│   │   ├── ui/                  # shadcn/ui komponentit
│   │   ├── questions/           # Kysymystyypit
│   │   ├── create/              # Luontiflow
│   │   └── play/                # Peliflow
│   ├── lib/                     # Palvelut ja apurit
│   │   ├── supabase/            # Tietokantakyselyt
│   │   ├── ai/                  # Tekoälygenerointi
│   │   └── utils/               # Apufunktiot
│   ├── hooks/                   # React hookit
│   │   └── useGameSession.ts    # Pelin tila ja pisteet
│   ├── config/                  # Konfiguraatio
│   │   ├── subjects.ts          # Ainemääritykset
│   │   └── prompts/             # AI-promptit
│   └── types/                   # TypeScript-tyypit
└── supabase/
    └── migrations/              # Tietokannan skeema
```

### Kehityskomennot

```bash
# Kehityspalvelin
npm run dev

# Tyyppitarkistus
npm run typecheck

# Tuotantobuildi
npm run build

# Tuotantopalvelin
npm start
```

## 🚢 Julkaisu Verceliin

1. **Pushaa koodi GitHubiin**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Luo Vercel-projekti**:
   - Mene [vercel.com](https://vercel.com)
   - Klikkaa "Import Project"
   - Valitse GitHub-repositoriosi
   - Lisää ympäristömuuttujat (samat kuin `.env.local`)
   - Klikkaa "Deploy"

3. **Valmis!** Sovelluksesi on nyt verkossa

## 🎨 Värimaailma

Koekertaaja käyttää modernia, energistä väripalettia:

- **Päägradientti**: Cyan → Teal → Purple
- **Taustat**: Pehmeä cyan-purple-pink gradient
- **Pisteet**: Violetti (💎)
- **Putket**: Oranssi-kulta (🔥)
- **Onnistuminen**: Smaragdinvihreä (✅)
- **Saavutukset**: Kulta-amber (🏆)

## 🔐 Tietoturva

- **Ei kirjautumista**: Ei henkilökohtaisia tietoja
- **Julkiset koealueet**: Koodit ovat jaettavia
- **RLS-käytännöt**: Row-level security Supabasessa
- **Server-side API**: API-avaimet eivät näy selaimessa
- **Ei evästeitä**: Privacy-first lähestymistapa

## 📝 Lisenssi

MIT License - vapaa käyttöön ja muokkaukseen

## 🤝 Tuki ja kehitys

- **Ongelmat**: Avaa issue GitHubissa
- **Kysymykset**: Katso dokumentaatio tai avaa keskustelu
- **Kehitysideat**: Pull requestit tervetulleita!

## 🌟 Kiitokset

- [Next.js](https://nextjs.org/) - React-framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Anthropic Claude](https://www.anthropic.com/) - Tekoälymalli
- [shadcn/ui](https://ui.shadcn.com/) - UI-komponentit
- [Tailwind CSS](https://tailwindcss.com/) - Tyylit

---

Tehty ❤️:llä oppijoille | [GitHub](https://github.com/mikkomakipaa/exam-prepper)
