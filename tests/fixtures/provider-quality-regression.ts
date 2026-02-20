export type ProviderRegressionTask =
  | 'topic_identification'
  | 'question_generation'
  | 'flashcard_creation'
  | 'visual_questions';

export interface ProviderQualitySample {
  provider: 'anthropic' | 'openai';
  model: string;
  output: string;
  jsonValid: boolean;
  finnishGradeClarityScore: number;
  notes: string;
}

export interface ProviderRegressionFixture {
  id: string;
  task: ProviderRegressionTask;
  subject: string;
  grade: 4 | 5 | 6;
  inputSummary: string;
  baseline: ProviderQualitySample;
  candidate: ProviderQualitySample;
}

export const providerQualityRegressionFixtures: ProviderRegressionFixture[] = [
  {
    id: 'topic-id-math-grade6',
    task: 'topic_identification',
    subject: 'matematiikka',
    grade: 6,
    inputSummary: 'Kolmiot, kulmien summa, suorakulmainen kolmio, Pythagoraan lause.',
    baseline: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      output: '{"topics":["geometria","kolmiot","pythagoraan_lause"]}',
      jsonValid: true,
      finnishGradeClarityScore: 4.7,
      notes: 'Aiheet vastaavat opetustavoitetta ilman turhaa termistöä.',
    },
    candidate: {
      provider: 'openai',
      model: 'gpt-4.1-mini',
      output: '{"topics":["geometria","kolmiot","kulmat"]}',
      jsonValid: true,
      finnishGradeClarityScore: 4.6,
      notes: 'Hyva osuma, mutta Pythagoraan lause puuttuu.',
    },
  },
  {
    id: 'question-gen-finnish-grade5',
    task: 'question_generation',
    subject: 'suomen_kieli',
    grade: 5,
    inputSummary: 'Lauseen jasenet: subjekti, predikaatti, objekti; esimerkkilauseet.',
    baseline: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20250514',
      output:
        '{"question":"Mika on predikaatti lauseessa \\"Koira juoksee nopeasti\\"?","type":"multiple_choice","options":["Koira","juoksee","nopeasti","on"],"correct_answer":"juoksee","explanation":"Predikaatti kertoo, mita subjekti tekee. Sana \\"juoksee\\" kertoo toiminnan."}',
      jsonValid: true,
      finnishGradeClarityScore: 4.8,
      notes: 'Selitys kertoo oikean vastauksen syyn ja tukee 5. luokan tasoa.',
    },
    candidate: {
      provider: 'openai',
      model: 'gpt-4.1',
      output:
        '{"question":"Mika sana on predikaatti lauseessa \\"Koira juoksee nopeasti\\"?","type":"multiple_choice","options":["Koira","juoksee","nopeasti","koira juoksee"],"correct_answer":"juoksee","explanation":"Predikaatti on tekemista kuvaava verbi."}',
      jsonValid: true,
      finnishGradeClarityScore: 4.6,
      notes: 'Kelvollinen, mutta distractor-rakenne on hieman epatasainen.',
    },
  },
  {
    id: 'flashcard-biology-grade4',
    task: 'flashcard_creation',
    subject: 'ymparistooppi',
    grade: 4,
    inputSummary: 'Kasvin osat: juuri, varsi, lehti, kukka ja niiden tehtavat.',
    baseline: {
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      output:
        '{"question":"Mika kasvin osa ottaa vetta maasta?","type":"flashcard","correct_answer":"juuri","explanation":"Juuri ottaa vetta ja ravinteita maasta. Se auttaa kasvia pysymaan paikallaan."}',
      jsonValid: true,
      finnishGradeClarityScore: 4.7,
      notes: 'Lyhyt, selkea ja ika-tasolle sopiva.',
    },
    candidate: {
      provider: 'openai',
      model: 'gpt-4.1-mini',
      output:
        '{"question":"Mika kasvin osa ottaa vetta maasta?","type":"flashcard","correct_answer":"juuri","explanation":"Juuri imee vetta maaperasta kasvin kayttoon."}',
      jsonValid: true,
      finnishGradeClarityScore: 4.5,
      notes: 'Lyhyt selitys, mutta oppimisyhteys on hieman ohuempi.',
    },
  },
  {
    id: 'visual-physics-grade6',
    task: 'visual_questions',
    subject: 'fysiikka',
    grade: 6,
    inputSummary: 'Voimakuvio, jossa laatikkoa vedetaan vaakasuunnassa kahdella eri voimalla.',
    baseline: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-6-20250514',
      output:
        '{"question":"Kumpaan suuntaan laatikko liikkuu, jos oikealle vetaa 8 N ja vasemmalle 3 N?","type":"multiple_choice","options":["Vasemmalle","Oikealle","Ei liiku","Ylos"],"correct_answer":"Oikealle","explanation":"Nettovoima on 8 N - 3 N = 5 N oikealle, joten liike tapahtuu oikealle."}',
      jsonValid: true,
      finnishGradeClarityScore: 4.7,
      notes: 'Yhdistaa kuvan tiedon ja laskun selkeasti.',
    },
    candidate: {
      provider: 'openai',
      model: 'gpt-4o',
      output:
        '{"question":"Mihin suuntaan kappale liikkuu, kun voimat ovat 8 N oikealle ja 3 N vasemmalle?","type":"multiple_choice","options":["Oikealle","Vasemmalle","Ei mihinkaan","Ei voi tietaa"],"correct_answer":"Oikealle","explanation":"Nettovoima on 5 N oikealle."}',
      jsonValid: true,
      finnishGradeClarityScore: 4.6,
      notes: 'Oikea tulos, selitys voisi avata kaytetyn paattelyn tarkemmin.',
    },
  },
];
