import { readFile } from 'fs/promises';
import path from 'path';

import type { Difficulty, Mode, Subject } from '@/types/questions';
import { getSubjectType, type SubjectType } from './subjectTypeMapping';
import { PromptLoader } from './PromptLoader';
import { isRuleBasedSubject as isRuleBasedSubjectUtil } from '@/lib/utils/subjectClassification';
import { dependencyResolver } from '@/lib/utils/dependencyGraph';
import type { ExtractedVisual } from '@/lib/utils/visualExtraction';
import type { PromptMetadata } from './promptVersion';

export interface BuildVariablesParams {
  subject: Subject;
  subjectType?: SubjectType;
  difficulty: Difficulty;
  questionCount: number;
  grade?: number;
  materialText?: string;
  materialFiles?: Array<{
    type: string;
    name: string;
    data: string; // base64
  }>;
  mode?: Mode;
  topic?: string;
  subtopic?: string;
  identifiedTopics?: string[];
  targetWords?: string[];
  enhancedTopics?: import('@/lib/ai/topicIdentifier').EnhancedTopic[];
  distribution?: import('@/lib/utils/questionDistribution').TopicDistribution[];
  contentType?: 'vocabulary' | 'grammar' | 'mixed';
}

type DifficultyInstructionMap = Record<string, Record<string, string>>;
type StructuredCurriculumEntry = {
  description?: string;
  topics?: string[];
  grammar_topics?: string[];
  vocabulary_themes?: string[];
  learning_objectives?: string[];
  formulas?: string[];
  key_concepts?: string[];
  context?: string;
}

const TEMPLATE_BASE_PATH = path.join(
  process.cwd(),
  'src',
  'config',
  'prompt-templates'
);

const SUBJECTS_BASE_PATH = path.join(TEMPLATE_BASE_PATH, 'subjects');
const CORE_BASE_PATH = path.join(TEMPLATE_BASE_PATH, 'core');
const METADATA_BASE_PATH = path.join(TEMPLATE_BASE_PATH, 'metadata');
const SKILLS_BASE_PATH = path.join(TEMPLATE_BASE_PATH, 'skills');

const DIFFICULTY_LABELS: Record<string, string> = {
  helppo: 'Helppo',
  normaali: 'Normaali',
};

const EXTRA_TYPE_SELECTION_NOTES: Record<string, Record<string, string[]>> = {
  english: {
    helppo: ['- Helppo-tasolla suosi lyhyitä, selkeitä vastauksia'],
    normaali: ['- Lisää soveltavia kysymyksiä, kun materiaali tukee sitä'],
  },
  math: {
    helppo: ['- Helppo-tasolla painota yksivaiheisia tai selkeitä tehtäviä'],
    normaali: ['- Käytä perustelua vaativia kysymyksiä vain, kun ratkaisupolku on selkeä'],
  },
  written: {
    helppo: ['- Helppo-tasolla pidä kysymykset faktapohjaisina ja suorina'],
    normaali: [],
  },
  geography: {
    helppo: ['- Helppo-tasolla painota tunnistamista ja peruskäsitteitä'],
    normaali: [],
  },
  skills: {
    helppo: ['- Helppo-tasolla suosi turvallisia, konkreettisia tilanteita'],
    normaali: [],
  },
  concepts: {
    helppo: ['- Helppo-tasolla pidä käsitteet arjen esimerkeissä'],
    normaali: [],
  },
};

export interface BuildVisualQuestionPromptParams {
  visuals: ExtractedVisual[];
  questionCount: number;
}

export function buildVisualQuestionPrompt(params: BuildVisualQuestionPromptParams): string {
  const { visuals, questionCount } = params;

  if (visuals.length === 0) {
    return '';
  }

  const visualDescriptions = visuals
    .map((visual, index) => {
      const caption = visual.caption ?? 'Ei kuvatekstiä';
      const context = visual.contextText || 'Ei ympäröivää tekstikontekstia';
      return [
        `VISUAL ${index + 1} (${visual.type})`,
        `- Reference: [IMAGE_${index + 1}]`,
        `- Caption: ${caption}`,
        `- Context: ${context}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    'VISUAALISEN SISÄLLÖN OHJEET:',
    `- Materiaalissa on ${visuals.length} kuvaa/diagrammia. Hyödynnä niitä aktiivisesti ${questionCount} kysymyksen joukossa.`,
    '- Kun kysymys vaatii kuvan, lisää kenttä "requires_visual": true.',
    '- Merkitse viite kenttään "image_reference" muodossa "IMAGE_X".',
    '- Käytä visualeja erityisesti tulkinta-, vertailu- ja mittauskysymyksiin.',
    '',
    'VISUAL CONTENT:',
    visualDescriptions,
  ].join('\n');
}

export class PromptBuilder {
  private loader: PromptLoader;
  private difficultyInstructionsCache?: DifficultyInstructionMap;
  private difficultyInstructionsPromise?: Promise<DifficultyInstructionMap>;
  private curriculumCache = new Map<string, Record<string, string>>();
  private promptMetadata: PromptMetadata = {
    versions: {},
    assembledAt: new Date(0).toISOString(),
  };

  constructor(loader?: PromptLoader) {
    this.loader = loader ?? new PromptLoader();
  }

  async assemblePrompt(params: BuildVariablesParams): Promise<string> {
    const result = await this.assemblePromptWithMetadata(params);
    return result.prompt;
  }

  async assemblePromptWithMetadata(
    params: BuildVariablesParams
  ): Promise<{ prompt: string; metadata: PromptMetadata }> {
    const subjectKey = params.subject.toLowerCase();
    const subjectType = params.subjectType ?? getSubjectType(subjectKey);
    const mode = params.mode ?? 'quiz';

    const [format, topicRules, skillTagging, difficultyRubric, typeRules] = await this.loader.loadModules([
      'core/format.txt',
      'core/topic-tagging.txt',
      'core/skill-tagging.txt',
      'core/difficulty-rubric.txt',
      `types/${subjectType}.txt`,
    ]);

    const skillTaxonomy = await this.loadSkillTaxonomy(subjectType);
    const curriculum = await this.loadCurriculum(subjectKey, params.grade);
    const distributions = await this.loadDistributions(
      subjectKey,
      subjectType,
      params.grade,
      params.difficulty,
      mode
    );

    const flashcardRules = mode === 'flashcard'
      ? await this.loader.loadModule('core/flashcard-rules.txt')
      : '';
    const languageFlashcardRules =
      mode === 'flashcard' && subjectType === 'language'
        ? await this.loader.loadModule('core/language-flashcard-rules.txt')
        : '';

    // Add emphasis for rule-based subjects in flashcard mode
    const isRuleBased =
      mode === 'flashcard' && this.isRuleBasedSubject(subjectKey, params.topic, params.contentType);
    const ruleBasedEmphasis = isRuleBased
      ? '\n⚠️ TÄRKEÄÄ: Tämä on sääntöpohjainen aihe (matematiikka/kielioppi). Sinun TÄYTYY käyttää SÄÄNTÖPOHJAISTA FLASHCARD-MUOTOA:\n- Kysymys: "Miten lasketaan/muodostetaan...?" (EI tiettyjä laskutehtäviä)\n- Vastaus: Sääntö/kaava + toimiva esimerkki\n- Katso tarkat ohjeet "SÄÄNTÖPOHJAINEN FLASHCARD-MUOTO" -osiosta yllä.\n'
      : '';

    const variables = await this.buildVariables(params, subjectType);
    const assembled = this.concatenateModules([
      format,
      topicRules,
      skillTagging,
      difficultyRubric,
      skillTaxonomy,
      typeRules,
      curriculum,
      distributions,
      flashcardRules,
      languageFlashcardRules,
      ruleBasedEmphasis,
    ]);

    const prompt = this.loader.substituteVariables(assembled, variables);
    this.promptMetadata = {
      versions: this.loader.getVersionMetadata(),
      assembledAt: new Date().toISOString(),
    };

    return {
      prompt,
      metadata: this.promptMetadata,
    };
  }

  getPromptMetadata(): PromptMetadata {
    return this.promptMetadata;
  }

  concatenateModules(modules: string[]): string {
    return modules
      .map(module => module.trim())
      .filter(Boolean)
      .join('\n\n');
  }

  async loadCurriculum(subjectKey: string, grade?: number): Promise<string> {
    if (!grade) {
      return '';
    }

    const normalizedKey = this.normalizeSubjectKey(subjectKey);

    if (!normalizedKey) {
      return '';
    }

    const cacheKey = normalizedKey;
    if (this.curriculumCache.has(cacheKey)) {
      const cached = this.curriculumCache.get(cacheKey) ?? {};
      return cached[String(grade)] ?? '';
    }

    const filePath = path.join(SUBJECTS_BASE_PATH, `${normalizedKey}.json`);

    try {
      const contents = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(contents) as Record<string, string | StructuredCurriculumEntry>;
      const formatted = Object.fromEntries(
        Object.entries(parsed).map(([gradeKey, value]) => [
          gradeKey,
          this.formatCurriculumEntry(value),
        ])
      );
      this.curriculumCache.set(cacheKey, formatted);
      return formatted[String(grade)] ?? '';
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return '';
      }

      throw error;
    }
  }

  async loadDistributions(
    subjectKey: string,
    subjectType: SubjectType,
    _grade: number | undefined,
    difficulty: Difficulty,
    mode: Mode
  ): Promise<string> {
    // Flashcards use a single canonical Q&A type; skip quiz-style distribution guidance.
    if (mode === 'flashcard') {
      const flashcardGuidance = this.getQuestionTypeGuidance(subjectType, mode, subjectKey);
      return [
        'FLASHCARD-MUOTO (PERINTEINEN KYSYMYS-VASTAUS):',
        flashcardGuidance,
      ].join('\n');
    }

    const difficultyInstructions = await this.formatDifficultyInstructions(
      subjectKey,
      subjectType,
      difficulty
    );
    const extraNotes = this.resolveExtraNotes(subjectKey, subjectType, difficulty);
    const questionTypeGuidance = this.getQuestionTypeGuidance(subjectType, mode, subjectKey);
    const modeLabel = `KYSYMYSTYYPPIEN VALINTAOHJE (${DIFFICULTY_LABELS[difficulty] ?? difficulty}, EI KIINTEÄÄ JAKAUMAA):`;

    return [
      difficultyInstructions,
      [
        modeLabel,
        questionTypeGuidance,
        ...extraNotes,
      ].join('\n'),
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private async buildVariables(
    params: BuildVariablesParams,
    subjectType: SubjectType
  ): Promise<Record<string, string>> {
    const hasFiles = Boolean(params.materialFiles && params.materialFiles.length > 0);
    const topicCount = params.identifiedTopics?.length ?? 0;
    const effectiveTopicCount = topicCount > 0 ? topicCount : 3;
    const questionsPerTopic = Math.ceil(params.questionCount / effectiveTopicCount);

    const materialType = hasFiles ? 'kuvien ja PDF-tiedostojen' : 'materiaalin';
    const gradeNote = this.formatGradeNote(params.subject, params.grade);
    const gradeContextNote = this.formatGradeContextNote(params.grade);
    const gradeLevelNote = this.formatGradeLevelNote(params.grade);

    const difficultyInstructions = '';

    const languageIntro = this.formatLanguageIntro(params.subject, materialType, params.questionCount);
    const mathIntro = this.formatMathIntro(materialType, params.questionCount);
    const writtenIntro = this.formatWrittenIntro(params.subject, materialType, params.questionCount);
    const geographyIntro = this.formatGeographyIntro(params.subject, materialType, params.questionCount);
    const skillsIntro = this.formatSkillsIntro(params.subject, materialType, params.questionCount);
    const conceptsIntro = this.formatConceptsIntro(params.subject, materialType, params.questionCount);

    const { languageSubjectNote, languageAnswerLanguageRules } =
      this.formatLanguageSubjectNotes(params.subject);

    // NEW: Use distribution if available (Phase 2)
    const distributionSection = params.distribution
      ? this.formatDistributionSection(params.distribution)
      : '';
    const conceptDependencySection = dependencyResolver.getDependencyPromptSection(
      params.subject,
      params.grade
    );

    return {
      material_type: materialType,
      question_count: String(params.questionCount),
      difficulty_instructions: difficultyInstructions,
      grade_note: gradeNote,
      material_section: this.formatMaterialSection(params.materialText, hasFiles),
      target_words_section: this.formatTargetWordsSection(params.targetWords),
      topic_count: String(effectiveTopicCount),
      topics_list: this.formatTopics(params.identifiedTopics),
      questions_per_topic: String(questionsPerTopic),
      distribution_section: distributionSection, // Phase 2
      concept_dependency_section: conceptDependencySection,
      grade_context_note: gradeContextNote,
      difficulty: params.difficulty,
      grade_level_note: gradeLevelNote,
      subject: params.subject,
      grade_context: this.formatGradeContext(params.grade),
      language_intro: subjectType === 'language' ? languageIntro : '',
      math_intro: subjectType === 'math' ? mathIntro : '',
      written_intro: subjectType === 'written' ? writtenIntro : '',
      geography_intro: subjectType === 'geography' ? geographyIntro : '',
      skills_intro: subjectType === 'skills' ? skillsIntro : '',
      concepts_intro: subjectType === 'concepts' ? conceptsIntro : '',
      language_subject_note: languageSubjectNote,
      language_answer_language_rules: languageAnswerLanguageRules,
    };
  }

  private getQuestionTypeGuidance(
    subjectType: SubjectType,
    mode: Mode,
    subjectKey: string
  ): string {
    if (mode === 'flashcard') {
      return [
        'Käytä kaikissa korteissa samaa tyyppiä: flashcard.',
        'Luo kortit aina selkeänä kysymys-vastaus-parina.',
        '',
        'Muoto:',
        '- question: selkeä, suora kysymys',
        '- answer: lyhyt ydinvastaus',
        '- explanation: lyhyt selitys ja esimerkki',
        '',
        'Rajoitteet:',
        '- Älä käytä täydennysmuotoa (___)',
        '- Älä käytä monivalinta-, totta/tarua-, matching- tai sequential-muotoa',
        '- Yksi käsite per kortti',
      ].join('\n');
    }

    const baseGuidance = [
      'Käytettävissä olevat kysymystyypit (quiz):',
      '- fill_blank: sanasto, kaavat, määritelmät, yksittäiset täsmävastaukset',
      '- short_answer: selittäminen, perustelu, miksi/miten-kysymykset',
      '- multiple_choice: käsitteet, vertailu, luokittelu, vaihtoehtojen arviointi',
      '- true_false: faktaväitteet ja yleiset väärinkäsitykset',
      '- matching: pariuttaminen (termi-määritelmä, valtio-pääkaupunki, kaava-nimi)',
      '- sequential: aikajanat, prosessit ja vaiheittaiset järjestykset',
      '',
      'Valintaohjeet:',
      '- Analysoi materiaali ja valitse jokaiselle kysymykselle luonnollisin tyyppi',
      '- Tavoittele monipuolisuutta: älä tee koko settiä yhdellä kysymystyypillä',
      '- Priorisoi luonnollinen sopivuus, älä pakotettua jakaumaa',
      '- Käytä sequential-tyyppiä aina kun sisällössä on selkeä aikajärjestys tai vaiheistus',
    ];

    const subjectSpecific: Record<SubjectType, string[]> = {
      language: [
        'Tyypillinen painotus (ei pakollinen): fill_blank ja short_answer, tarvittaessa matching/sequential.',
      ],
      math: [
        'Tyypillinen painotus (ei pakollinen): fill_blank ja multiple_choice, sequential ratkaisuvaiheisiin.',
      ],
      written: [
        'Tyypillinen painotus (ei pakollinen): multiple_choice ja true_false, sequential aikajanoihin.',
      ],
      geography: [
        'Tyypillinen painotus (ei pakollinen): fill_blank ja matching pääkaupunkeihin/sijainteihin.',
      ],
      concepts: [
        'Tyypillinen painotus (ei pakollinen): multiple_choice, true_false ja short_answer.',
      ],
      skills: [
        'Tyypillinen painotus (ei pakollinen): multiple_choice, true_false ja sequential.',
      ],
    };

    const notes = [...(subjectSpecific[subjectType] ?? [])];
    if (subjectType === 'written' && this.isHistorySubject(subjectKey)) {
      notes.push('Historian sisällöissä käytä sequential-tyyppiä, kun materiaali sisältää aikajanan.');
    }

    return [...baseGuidance, ...notes].join('\n');
  }

  private formatTopics(topics?: string[]): string {
    if (!topics || topics.length === 0) {
      return '(Ei aihealueita tunnistettu - käytä materiaalin perusteella tunnistettuja aihealueita)';
    }

    return topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n');
  }

  private formatDistributionSection(
    distribution: import('@/lib/utils/questionDistribution').TopicDistribution[]
  ): string {
    const { formatDistributionForPrompt } = require('@/lib/utils/questionDistribution');
    const formattedDistribution = formatDistributionForPrompt(distribution);

    return `
AIHEALUEIDEN JAKAUMA (NOUDATA TARKASTI):
${formattedDistribution}

TÄRKEÄÄ:
- Luo TÄSMÄLLEEN oikea määrä kysymyksiä jokaisesta aihealueesta
- Käytä annettuja avainsanoja kysymyksissä
- Kata kaikki aihealueen aliaihealueet
- Noudata vaikeustasoa joka aihealueelle
`.trim();
  }

  private formatMaterialSection(materialText?: string, hasFiles = false): string {
    if (!materialText && !hasFiles) {
      return '';
    }

    const intro = hasFiles
      ? 'Alla on liitetiedostot (PDF/kuvat). Analysoi ne huolellisesti.'
      : 'Alla on oppikirjateksti. Analysoi se huolellisesti.';

    const trimmedMaterial = materialText?.trim();
    if (!trimmedMaterial) {
      return `${intro}\n\n`;
    }

    return `${intro}\n\n${trimmedMaterial}\n\n`;
  }

  private formatTargetWordsSection(targetWords?: string[]): string {
    if (!targetWords || targetWords.length === 0) {
      return '';
    }

    const wordList = targetWords.map(word => `"${word}"`).join(', ');
    const wordCount = targetWords.length;

    return [
      'PAKOLLINEN SANASTO - TÄRKEÄÄ:',
      `Sinun TÄYTYY käyttää TASAN NÄITÄ ${wordCount} sanoja kysymyksissäsi:`,
      wordList,
      '',
      'VAATIMUKSET:',
      `- Jokainen ${wordCount} sanasta TÄYTYY esiintyä VÄHINTÄÄN YHDESSÄ kysymyksessä`,
      '- Sanat voivat esiintyä kysymyksessä, vastausvaihtoehdoissa tai selityksessä',
      '- Sanaston käännöskysymyksissä: käytä TASAN näitä sanoja - ÄLÄ korvaa yleisillä fraaseilla',
      '- Matching-kysymyksissä: sisällytä mahdollisimman monta sanaa pareiksi',
      '- ÄLÄ käytä muita satunnaisia sanoja jos PAKOLLINEN SANASTO on annettu',
      '- VARMISTA että kaikki sanat tulevat käytettyä ennen kysymysten loppumista',
      '',
    ].join('\n');
  }

  private formatGradeNote(subject: Subject, grade?: number): string {
    if (!grade) {
      return '';
    }

    const normalized = subject.toLowerCase();

    if (normalized === 'english' || normalized === 'englanti') {
      return `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle ja perustua ${grade}. luokan A1-englannin opetussuunnitelman sisältöön.`;
    }

    if (normalized === 'math' || normalized === 'matematiikka') {
      return `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle ja perustua ${grade}. luokan opetussuunnitelman sisältöön.`;
    }

    return `\nKysymysten tulee olla sopivan haastavuustason ${grade}. luokkalaiselle.`;
  }

  private formatGradeContextNote(grade?: number): string {
    if (!grade) {
      return '';
    }

    return `ja keskity luokan ${grade} oppimäärälle sopivaan vaikeustasoon`;
  }

  private formatGradeLevelNote(grade?: number): string {
    if (!grade) {
      return 'kohdeikäryhmän tasoa';
    }

    return `${grade}. luokan tasoa`;
  }

  private formatGradeContext(grade?: number): string {
    return grade ? `grade ${grade}` : 'middle-school';
  }

  private formatLanguageIntro(subject: Subject, materialType: string, questionCount: number): string {
    const normalized = subject.toLowerCase();

    if (normalized === 'english' || normalized === 'englanti') {
      return `Analysoi ${materialType} ja luo ${questionCount} monipuolista kysymystä englannin koevalmistautumiseen.`;
    }

    if (normalized === 'finnish' || normalized === 'suomi') {
      return `Analysoi ${materialType} ja luo ${questionCount} monipuolista kysymystä äidinkielestä ja kirjallisuudesta.`;
    }

    return `Analysoi ${materialType} ja luo ${questionCount} monipuolista kielikysymystä aiheesta "${subject}".`;
  }

  private formatMathIntro(materialType: string, questionCount: number): string {
    return `Analysoi ${materialType} ja luo ${questionCount} monipuolista matematiikan kysymystä koevalmistautumiseen.`;
  }

  private formatWrittenIntro(subject: Subject, materialType: string, questionCount: number): string {
    return `Analysoi ${materialType} ja luo ${questionCount} monipuolista kysymystä aiheesta "${subject}".`;
  }

  private formatGeographyIntro(subject: Subject, materialType: string, questionCount: number): string {
    return `Analysoi ${materialType} ja luo ${questionCount} maantiedon kysymystä aiheesta "${subject}".`;
  }

  private formatSkillsIntro(subject: Subject, materialType: string, questionCount: number): string {
    return `Analysoi ${materialType} ja luo ${questionCount} monipuolista kysymystä aiheesta "${subject}".`;
  }

  private formatConceptsIntro(subject: Subject, materialType: string, questionCount: number): string {
    return `Analysoi ${materialType} ja luo ${questionCount} monipuolista kysymystä aiheesta "${subject}".`;
  }

  private formatLanguageSubjectNotes(subject: Subject): {
    languageSubjectNote: string;
    languageAnswerLanguageRules: string;
  } {
    const normalized = subject.toLowerCase();

    if (normalized === 'english' || normalized === 'englanti') {
      return {
        languageSubjectNote: '- Vain englanninkieliset sanat, lauseet ja jotkut vastausvaihtoehdot ovat englanniksi',
        languageAnswerLanguageRules: [
          '- Sanaston käännökset: vastaukset ENGLANNIKSI tai SUOMEKSI (riippuen käännössuunnasta)',
          '- Verbimuodot/sanojen valinta lauseeseen: vastaukset ENGLANNIKSI',
          '- Kielioppisäännöt ja teoria: vastaukset SUOMEKSI',
        ].join('\n'),
      };
    }

    return {
      languageSubjectNote: '- Käytä kohdekielen (esim. suomi) sanastoa ja kielioppia ikätasolle sopivasti',
      languageAnswerLanguageRules: '- Käytä vastauksissa suomen kielen käsitteitä ja sanastoa.',
    };
  }

  private async formatDifficultyInstructions(
    subjectKey: string,
    subjectType: SubjectType,
    difficulty: Difficulty
  ): Promise<string> {
    const instructions = await this.loadDifficultyInstructions();
    const normalized = subjectKey.toLowerCase();

    if (normalized === 'english' || normalized === 'englanti') {
      return instructions.english?.[difficulty] ?? '';
    }

    if (normalized === 'math' || normalized === 'matematiikka') {
      return instructions.math?.[difficulty] ?? '';
    }

    if (subjectType === 'language') {
      return instructions.generic?.[difficulty] ?? '';
    }

    return instructions.generic?.[difficulty] ?? '';
  }

  private resolveExtraNotes(
    subjectKey: string,
    subjectType: SubjectType,
    difficulty: Difficulty
  ): string[] {
    const normalized = subjectKey.toLowerCase();

    if (normalized === 'english' || normalized === 'englanti') {
      return EXTRA_TYPE_SELECTION_NOTES.english?.[difficulty] ?? [];
    }

    if (normalized === 'math' || normalized === 'matematiikka') {
      return EXTRA_TYPE_SELECTION_NOTES.math?.[difficulty] ?? [];
    }

    if (subjectType === 'language') {
      return EXTRA_TYPE_SELECTION_NOTES.written?.[difficulty] ?? [];
    }

    return EXTRA_TYPE_SELECTION_NOTES[subjectType]?.[difficulty] ?? [];
  }

  private normalizeSubjectKey(subjectKey: string): string | null {
    const normalized = subjectKey.toLowerCase();
    const subjectMap: Record<string, string> = {
      english: 'english',
      englanti: 'english',
      swedish: 'swedish',
      ruotsi: 'swedish',
      math: 'math',
      matematiikka: 'math',
      physics: 'physics',
      fysiikka: 'physics',
      chemistry: 'chemistry',
      kemia: 'chemistry',
      finnish: 'finnish',
      suomi: 'finnish',
      history: 'history',
      biology: 'biology',
      geography: 'geography',
      maantiede: 'geography',
      maantieto: 'geography',
      'environmental-studies': 'environmental-studies',
      art: 'art',
      music: 'music',
      pe: 'pe',
      religion: 'religion',
      ethics: 'ethics',
      society: 'society',
      yhteiskuntaoppi: 'society',
    };

    return subjectMap[normalized] ?? null;
  }

  private formatCurriculumEntry(entry: string | StructuredCurriculumEntry): string {
    if (typeof entry === 'string') {
      return entry;
    }

    const sections: string[] = [];

    if (entry.description?.trim()) {
      sections.push(entry.description.trim());
    }

    if (entry.topics && entry.topics.length > 0) {
      sections.push(`Aiheet:\n${entry.topics.map(topic => `- ${topic}`).join('\n')}`);
    }

    if (entry.grammar_topics && entry.grammar_topics.length > 0) {
      sections.push(`Kielioppiaiheet:\n${entry.grammar_topics.map(topic => `- ${topic}`).join('\n')}`);
    }

    if (entry.vocabulary_themes && entry.vocabulary_themes.length > 0) {
      sections.push(
        `Sanastoteemat:\n${entry.vocabulary_themes.map(theme => `- ${theme}`).join('\n')}`
      );
    }

    if (entry.learning_objectives && entry.learning_objectives.length > 0) {
      sections.push(
        `Oppimistavoitteet:\n${entry.learning_objectives.map(objective => `- ${objective}`).join('\n')}`
      );
    }

    if (entry.formulas && entry.formulas.length > 0) {
      sections.push(`Kaavat:\n${entry.formulas.map(formula => `- ${formula}`).join('\n')}`);
    }

    if (entry.key_concepts && entry.key_concepts.length > 0) {
      sections.push(`Keskeiset käsitteet: ${entry.key_concepts.join(', ')}`);
    }

    if (entry.context?.trim()) {
      sections.push(`Konteksti: ${entry.context.trim()}`);
    }

    return sections.join('\n\n');
  }

  private isHistorySubject(subjectKey: string): boolean {
    const normalized = this.normalizeSubjectKey(subjectKey) ?? subjectKey.toLowerCase();
    return normalized === 'history';
  }

  /**
   * Determines if a subject/topic should use rule-based flashcard format.
   * Rule-based format teaches concepts/formulas rather than testing specific calculations.
   *
   * Delegates to shared utility function.
   *
   * @param subject - The subject name
   * @param topic - Optional topic within the subject
   * @param contentType - Explicit flashcard content type
   * @returns true if rule-based format should be used
   */
  private isRuleBasedSubject(
    subject: string,
    topic?: string,
    contentType?: 'vocabulary' | 'grammar' | 'mixed'
  ): boolean {
    return isRuleBasedSubjectUtil(subject, topic, contentType);
  }

  private async loadSkillTaxonomy(subjectType: SubjectType): Promise<string> {
    const taxonomyPath = path.join(SKILLS_BASE_PATH, `${subjectType}-skills.json`);
    const taxonomy = await this.readJsonFile<Record<string, string[]>>(taxonomyPath);

    let formatted = 'AVAILABLE SKILLS:\n\n';
    for (const [category, skills] of Object.entries(taxonomy)) {
      formatted += `${category.toUpperCase()}:\n`;
      for (const skill of skills) {
        formatted += `  - ${skill}\n`;
      }
      formatted += '\n';
    }

    return formatted.trim();
  }

  private async loadDifficultyInstructions(): Promise<DifficultyInstructionMap> {
    if (this.difficultyInstructionsCache) {
      return this.difficultyInstructionsCache;
    }

    if (this.difficultyInstructionsPromise) {
      return this.difficultyInstructionsPromise;
    }

    this.difficultyInstructionsPromise = this.readJsonFile<DifficultyInstructionMap>(
      path.join(METADATA_BASE_PATH, 'difficulty-instructions.json')
    ).then(instructions => {
      this.difficultyInstructionsCache = instructions;
      return instructions;
    });

    return this.difficultyInstructionsPromise;
  }

  private async readJsonFile<T>(filePath: string): Promise<T> {
    const contents = await readFile(filePath, 'utf-8');
    return JSON.parse(contents) as T;
  }
}
