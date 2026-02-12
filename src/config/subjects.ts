/**
 * Subject Definitions
 *
 * Defines all available subjects with metadata for the question generation system.
 * Each subject has a unique ID, display name, type classification, and configuration.
 */

import type { Subject, QuestionType } from '@/types';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';

export interface SubjectDefinition {
  id: string;
  name: string;
  nameEn?: string;
  type: SubjectType;
  icon: string;
  requiresGrade: boolean;
  supportsGrammar: boolean;
  description: string;
  curriculumFile?: string;
}

/**
 * Complete list of supported subjects in Finnish primary/secondary education
 */
export const SUBJECTS: SubjectDefinition[] = [
  {
    id: 'english',
    name: 'Englanti',
    nameEn: 'English',
    type: 'language',
    icon: '🇬🇧',
    requiresGrade: true,
    supportsGrammar: true,
    description: 'Englannin kieli (A1-A2 peruskoulussa)',
  },
  {
    id: 'finnish',
    name: 'Äidinkieli ja kirjallisuus',
    nameEn: 'Finnish Language and Literature',
    type: 'language',
    icon: '🇫🇮',
    requiresGrade: true,
    supportsGrammar: true,
    description: 'Suomen kieli ja kirjallisuus',
  },
  {
    id: 'swedish',
    name: 'Ruotsi',
    nameEn: 'Swedish',
    type: 'language',
    icon: '🇸🇪',
    requiresGrade: true,
    supportsGrammar: true,
    description: 'Ruotsin kieli (A2 tai B1)',
  },
  {
    id: 'math',
    name: 'Matematiikka',
    nameEn: 'Mathematics',
    type: 'math',
    icon: '🔢',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Matematiikka ja ongelmanratkaisu',
  },
  {
    id: 'physics',
    name: 'Fysiikka',
    nameEn: 'Physics',
    type: 'math',
    icon: '⚛️',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Fysiikka ja luonnonlait',
  },
  {
    id: 'chemistry',
    name: 'Kemia',
    nameEn: 'Chemistry',
    type: 'math',
    icon: '🧪',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Kemia ja kemialliset reaktiot',
  },
  {
    id: 'biology',
    name: 'Biologia',
    nameEn: 'Biology',
    type: 'written',
    icon: '🔬',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Biologia ja elämäntiede',
  },
  {
    id: 'environmental-studies',
    name: 'Ympäristöoppi',
    nameEn: 'Environmental Studies',
    type: 'written',
    icon: '🌍',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Ympäristö ja kestävä kehitys',
  },
  {
    id: 'history',
    name: 'Historia',
    nameEn: 'History',
    type: 'written',
    icon: '📜',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Historia ja historialliset tapahtumat',
  },
  {
    id: 'society',
    name: 'Yhteiskuntaoppi',
    nameEn: 'Social Studies',
    type: 'written',
    icon: '🏛️',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Yhteiskunta, hallinto ja kansalaisuus',
    curriculumFile: 'society',
  },
  {
    id: 'geography',
    name: 'Maantieto',
    nameEn: 'Geography',
    type: 'geography',
    icon: '🗺️',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Maantieto, kartat ja sijainnit',
  },
  {
    id: 'religion',
    name: 'Uskonto',
    nameEn: 'Religion',
    type: 'concepts',
    icon: '⛪',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Uskonto ja uskonnollinen kulttuuri',
  },
  {
    id: 'ethics',
    name: 'Elämänkatsomustieto',
    nameEn: 'Ethics',
    type: 'concepts',
    icon: '💭',
    requiresGrade: true,
    supportsGrammar: false,
    description: 'Etiikka ja elämänfilosofia',
  },
  {
    id: 'art',
    name: 'Kuvataide',
    nameEn: 'Visual Arts',
    type: 'skills',
    icon: '🎨',
    requiresGrade: false,
    supportsGrammar: false,
    description: 'Kuvataide ja visuaalinen ilmaisu',
  },
  {
    id: 'music',
    name: 'Musiikki',
    nameEn: 'Music',
    type: 'skills',
    icon: '🎵',
    requiresGrade: false,
    supportsGrammar: false,
    description: 'Musiikki ja musiikkiteoria',
  },
  {
    id: 'pe',
    name: 'Liikunta',
    nameEn: 'Physical Education',
    type: 'skills',
    icon: '⚽',
    requiresGrade: false,
    supportsGrammar: false,
    description: 'Liikunta ja urheilu',
  },
  {
    id: 'crafts',
    name: 'Käsityö',
    nameEn: 'Crafts',
    type: 'skills',
    icon: '✂️',
    requiresGrade: false,
    supportsGrammar: false,
    description: 'Käsityö ja tekninen työ',
  },
];

export const SUBJECTS_BY_ID: Record<string, SubjectDefinition> = SUBJECTS.reduce(
  (acc, subject) => {
    acc[subject.id] = subject;
    return acc;
  },
  {} as Record<string, SubjectDefinition>
);

/**
 * Get subject definition by ID
 */
export function getSubjectById(id: string): SubjectDefinition | undefined {
  return SUBJECTS_BY_ID[id];
}

/**
 * Get all subjects of a specific type
 */
export function getSubjectsByType(type: SubjectType): SubjectDefinition[] {
  return SUBJECTS.filter((subject) => subject.type === type);
}

/**
 * Get subjects that support grammar flashcards
 */
export function getGrammarSupportedSubjects(): SubjectDefinition[] {
  return SUBJECTS.filter((subject) => subject.supportsGrammar);
}

/**
 * Check if a subject ID is valid
 */
export function isValidSubjectId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SUBJECTS_BY_ID, id);
}

/**
 * Get subject type from subject ID (for backward compatibility)
 */
export function getSubjectTypeFromId(id: string): SubjectType | undefined {
  const subject = getSubjectById(id);
  return subject?.type;
}

/**
 * Get subject display name from ID
 */
export function getSubjectName(id: string): string {
  const subject = getSubjectById(id);
  return subject?.name || id;
}

/**
 * Check if subject requires grade selection
 */
export function subjectRequiresGrade(id: string): boolean {
  const subject = getSubjectById(id);
  return subject?.requiresGrade ?? true;
}

function getSubjectsForGroup(ids: string[]): SubjectDefinition[] {
  return ids.flatMap((id) => {
    const subject = SUBJECTS_BY_ID[id];
    return subject ? [subject] : [];
  });
}

/**
 * Grouped subjects for dropdown display
 */
export const SUBJECT_GROUPS = [
  {
    label: 'Kielet',
    subjects: getSubjectsForGroup(['english', 'finnish', 'swedish']),
  },
  {
    label: 'Matematiikka ja luonnontieteet',
    subjects: getSubjectsForGroup(['math', 'physics', 'chemistry', 'biology', 'environmental-studies']),
  },
  {
    label: 'Yhteiskuntatieteet',
    subjects: getSubjectsForGroup(['history', 'society']),
  },
  {
    label: 'Maantieto',
    subjects: getSubjectsForGroup(['geography']),
  },
  {
    label: 'Katsomusaineet',
    subjects: getSubjectsForGroup(['religion', 'ethics']),
  },
  {
    label: 'Taide ja taidot',
    subjects: getSubjectsForGroup(['art', 'music', 'pe', 'crafts']),
  },
] as const;

// ----------------------------------------------------------------------------
// Legacy exports used by older create components
// ----------------------------------------------------------------------------

export interface SubjectConfig {
  id: Subject;
  name: string;
  icon: string;
  enabled: boolean;
  questionTypes: QuestionType[];
  defaultQuestionCount: number;
  minQuestionCount: number;
  maxQuestionCount: number;
  supportedMaterials: string[];
  requiresLatex?: boolean;
  subjectType?: SubjectType;
  description: string;
}

const BASE_QUESTION_TYPES: QuestionType[] = [
  'multiple_choice',
  'fill_blank',
  'true_false',
  'matching',
  'short_answer',
];

const RULE_BASED_QUESTION_TYPES: QuestionType[] = [
  'multiple_choice',
  'fill_blank',
  'short_answer',
];

const SUBJECT_CONFIGS: Record<string, SubjectConfig> = SUBJECTS.reduce((acc, subject) => {
  acc[subject.id] = {
    id: subject.id,
    name: subject.name,
    icon: subject.icon,
    enabled: true,
    questionTypes: subject.type === 'math' ? RULE_BASED_QUESTION_TYPES : BASE_QUESTION_TYPES,
    defaultQuestionCount: 50,
    minQuestionCount: 20,
    maxQuestionCount: 100,
    supportedMaterials: ['pdf', 'text', 'image'],
    requiresLatex: subject.type === 'math',
    subjectType: subject.type,
    description: subject.description,
  };
  return acc;
}, {} as Record<string, SubjectConfig>);

export const DIFFICULTY_LEVELS = [
  { value: 'helppo', label: 'Helppo', description: 'Perusasiat ja yksinkertaiset kysymykset' },
  { value: 'normaali', label: 'Normaali', description: 'Monipuolinen sisältö ja soveltaminen' },
] as const;

export const GRADE_LEVELS = [
  { value: 4, label: '4. luokka' },
  { value: 5, label: '5. luokka' },
  { value: 6, label: '6. luokka' },
] as const;

export function getEnabledSubjects(): SubjectConfig[] {
  return Object.values(SUBJECT_CONFIGS).filter((subject) => subject.enabled);
}

export function getSubject(id: Subject): SubjectConfig | undefined {
  return SUBJECT_CONFIGS[id];
}
