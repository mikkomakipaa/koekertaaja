import { readFile } from 'fs/promises';
import path from 'path';

import type { Difficulty, Mode, Subject } from '@/types/questions';
import { getSubjectType, type SubjectType } from './subjectTypeMapping';
import { PromptLoader } from './PromptLoader';
import { isRuleBasedSubject as isRuleBasedSubjectUtil } from '@/lib/utils/subjectClassification';

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
}

type DistributionMap = Record<string, number>;

type GradeDistributionMap = Record<string, Record<string, DistributionMap>>;

type FlashcardDistributionMap = Record<string, DistributionMap>;

type DifficultyInstructionMap = Record<string, Record<string, string>>;

interface DistributionFile {
  language: {
    quiz: GradeDistributionMap;
    flashcard: FlashcardDistributionMap;
  };
  math: {
    quiz: GradeDistributionMap;
    flashcard: FlashcardDistributionMap;
  };
  written: {
    quiz: GradeDistributionMap;
    flashcard: FlashcardDistributionMap;
  };
  geography: {
    quiz: GradeDistributionMap;
    flashcard: FlashcardDistributionMap;
  };
  skills: {
    quiz: GradeDistributionMap;
    flashcard: FlashcardDistributionMap;
  };
  concepts: {
    quiz: GradeDistributionMap;
    flashcard: FlashcardDistributionMap;
  };
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
  vaikea: 'Vaikea',
};

const EXTRA_DISTRIBUTION_NOTES: Record<string, Record<string, string[]>> = {
  english: {
    helppo: ['- ÄLÄ käytä short_answer helppo-tasolla'],
    normaali: ['- Suosi kysymyksiä jotka vaativat SOVELTAMISTA'],
  },
  math: {
    helppo: ['- ÄLÄ käytä short_answer helppo-tasolla'],
    normaali: ['- ÄLÄ käytä short_answer (liian epämääräinen matematiikassa)'],
  },
  written: {
    helppo: ['- ÄLÄ käytä short_answer tai matching'],
    normaali: [],
    vaikea: ['- Suosi kysymyksiä jotka vaativat PERUSTELUA ja SOVELTAMISTA'],
  },
  geography: {
    helppo: ['- ÄLÄ käytä short_answer tai matching'],
    normaali: [],
    vaikea: ['- Suosi kysymyksiä jotka vaativat PERUSTELUA ja SOVELTAMISTA'],
  },
  skills: {
    helppo: ['- ÄLÄ käytä short_answer tai matching'],
    normaali: [],
    vaikea: ['- Suosi kysymyksiä jotka vaativat PERUSTELUA ja SOVELTAMISTA'],
  },
  concepts: {
    helppo: ['- ÄLÄ käytä short_answer tai matching'],
    normaali: [],
    vaikea: ['- Suosi kysymyksiä jotka vaativat PERUSTELUA ja SOVELTAMISTA'],
  },
};

export class PromptBuilder {
  private loader: PromptLoader;
  private distributionsCache?: DistributionFile;
  private distributionsPromise?: Promise<DistributionFile>;
  private difficultyInstructionsCache?: DifficultyInstructionMap;
  private difficultyInstructionsPromise?: Promise<DifficultyInstructionMap>;
  private curriculumCache = new Map<string, Record<string, string>>();

  constructor(loader?: PromptLoader) {
    this.loader = loader ?? new PromptLoader();
  }

  async assemblePrompt(params: BuildVariablesParams): Promise<string> {
    const subjectKey = params.subject.toLowerCase();
    const subjectType = params.subjectType ?? getSubjectType(subjectKey);
    const mode = params.mode ?? 'quiz';
    const includeGeographyMapRules = (subjectType === 'geography' || this.isGeographySubject(subjectKey)) && mode === 'quiz';
    const geographyMapRules = includeGeographyMapRules
      ? await this.loader.loadModule('subjects/geography-map.txt')
      : '';

    const [format, topicRules, skillTagging, typeRules] = await this.loader.loadModules([
      'core/format.txt',
      'core/topic-tagging.txt',
      'core/skill-tagging.txt',
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

    // Add emphasis for rule-based subjects in flashcard mode
    const isRuleBased = mode === 'flashcard' && this.isRuleBasedSubject(subjectKey, params.topic);
    const ruleBasedEmphasis = isRuleBased
      ? '\n⚠️ TÄRKEÄÄ: Tämä on sääntöpohjainen aihe (matematiikka/kielioppi). Sinun TÄYTYY käyttää SÄÄNTÖPOHJAISTA FLASHCARD-MUOTOA:\n- Kysymys: "Miten lasketaan/muodostetaan...?" (EI tiettyjä laskutehtäviä)\n- Vastaus: Sääntö/kaava + toimiva esimerkki\n- Katso tarkat ohjeet "SÄÄNTÖPOHJAINEN FLASHCARD-MUOTO" -osiosta yllä.\n'
      : '';

    const variables = await this.buildVariables(params, subjectType);
    const assembled = this.concatenateModules([
      format,
      topicRules,
      skillTagging,
      skillTaxonomy,
      typeRules,
      geographyMapRules,
      curriculum,
      distributions,
      flashcardRules,
      ruleBasedEmphasis,
    ]);

    return this.loader.substituteVariables(assembled, variables);
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
      const parsed = JSON.parse(contents) as Record<string, string>;
      this.curriculumCache.set(cacheKey, parsed);
      return parsed[String(grade)] ?? '';
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
    grade: number | undefined,
    difficulty: Difficulty,
    mode: Mode
  ): Promise<string> {
    const distributions = await this.loadDistributionFile();
    const subjectDistributions = distributions[subjectType];

    if (!subjectDistributions) {
      return '';
    }

    if (mode === 'flashcard') {
      const gradeKey = this.resolveGradeKey(subjectDistributions.flashcard, grade);
      const distribution = subjectDistributions.flashcard[gradeKey];

      if (!distribution) {
        return '';
      }

      const gradeLabel = grade ? `Luokka ${grade}` : '';
      const header = gradeLabel
        ? `KORTTITYYPPIEN JAKAUMA (${gradeLabel}):`
        : 'KORTTITYYPPIEN JAKAUMA:';

      return [
        header,
        this.formatDistributionList(distribution),
      ].join('\n');
    }

    const gradeKey = this.resolveGradeKey(subjectDistributions.quiz, grade);
    const difficultyDistributions = subjectDistributions.quiz[gradeKey];
    const distribution = difficultyDistributions?.[difficulty];

    if (!distribution) {
      return '';
    }

    const adjustedDistribution = this.applyGeographyMapDistribution(subjectKey, distribution);
    const difficultyInstructions = await this.formatDifficultyInstructions(
      subjectKey,
      subjectType,
      difficulty
    );

    const difficultyLabel = DIFFICULTY_LABELS[difficulty] ?? difficulty;
    const gradeLabel = grade ? `Luokka ${grade}, ` : '';
    const header = `KYSYMYSTYYPPIEN JAKAUMA (${gradeLabel}${difficultyLabel}):`;
    const extraNotes = this.resolveExtraNotes(subjectKey, subjectType, difficulty);
    const distributionNotes: string[] = [];

    if (subjectType === 'written' && mode === 'quiz') {
      distributionNotes.push(
        '- Jakauma on suuntaa-antava: valitse sopivin kysymystyyppi sisällön mukaan'
      );

      if (this.isHistorySubject(subjectKey)) {
        distributionNotes.push(
          '- Historian aikajanoissa pyri noin 15% sequential-kysymyksiin, kun materiaali tukee'
        );
      }
    }

    return [
      difficultyInstructions,
      [
        header,
        this.formatDistributionList(adjustedDistribution),
        ...distributionNotes,
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

  private formatDistributionList(distribution: DistributionMap): string {
    return Object.entries(distribution)
      .map(([type, percent]) => `- ${percent}% ${type}`)
      .join('\n');
  }

  private formatTopics(topics?: string[]): string {
    if (!topics || topics.length === 0) {
      return '(Ei aihealueita tunnistettu - käytä materiaalin perusteella tunnistettuja aihealueita)';
    }

    return topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n');
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
    return `Analysoi ${materialType} ja luo ${questionCount} maantiedon kysymystä aiheesta "${subject}". Mukaan tulee karttakysymyksiä, kun aihe sopii.`;
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
      return EXTRA_DISTRIBUTION_NOTES.english?.[difficulty] ?? [];
    }

    if (normalized === 'math' || normalized === 'matematiikka') {
      return EXTRA_DISTRIBUTION_NOTES.math?.[difficulty] ?? [];
    }

    if (subjectType === 'language') {
      return EXTRA_DISTRIBUTION_NOTES.written?.[difficulty] ?? [];
    }

    return EXTRA_DISTRIBUTION_NOTES[subjectType]?.[difficulty] ?? [];
  }

  private resolveGradeKey<T>(
    distributions: Record<string, T>,
    grade?: number
  ): string {
    if (grade && distributions[String(grade)]) {
      return String(grade);
    }

    const keys = Object.keys(distributions);
    return keys.length > 0 ? keys[0] : '';
  }

  private normalizeSubjectKey(subjectKey: string): string | null {
    const normalized = subjectKey.toLowerCase();
    const subjectMap: Record<string, string> = {
      english: 'english',
      englanti: 'english',
      math: 'math',
      matematiikka: 'math',
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
    };

    return subjectMap[normalized] ?? null;
  }

  private isGeographySubject(subjectKey: string): boolean {
    const normalized = this.normalizeSubjectKey(subjectKey) ?? subjectKey.toLowerCase();
    return normalized === 'geography';
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
   * @returns true if rule-based format should be used
   */
  private isRuleBasedSubject(subject: string, topic?: string): boolean {
    return isRuleBasedSubjectUtil(subject, topic);
  }

  private applyGeographyMapDistribution(
    subjectKey: string,
    distribution: DistributionMap
  ): DistributionMap {
    if (!this.isGeographySubject(subjectKey)) {
      return distribution;
    }

    return { map: 100 };
  }

  private async loadDistributionFile(): Promise<DistributionFile> {
    if (this.distributionsCache) {
      return this.distributionsCache;
    }

    if (this.distributionsPromise) {
      return this.distributionsPromise;
    }

    this.distributionsPromise = this.readJsonFile<DistributionFile>(
      path.join(CORE_BASE_PATH, 'grade-distributions.json')
    ).then(distributions => {
      this.distributionsCache = distributions;
      return distributions;
    });

    return this.distributionsPromise;
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
