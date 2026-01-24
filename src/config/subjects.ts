import { Subject, QuestionType } from '@/types';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';

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

export const SUBJECTS: Record<Subject, SubjectConfig> = {
  english: {
    id: 'english',
    name: 'Englanti',
    icon: '🇬🇧',
    enabled: true,
    questionTypes: ['multiple_choice', 'fill_blank', 'true_false', 'matching'],
    defaultQuestionCount: 50,
    minQuestionCount: 20,
    maxQuestionCount: 100,
    supportedMaterials: ['pdf', 'text', 'image'],
    subjectType: 'language',
    description: 'Englannin kielen sanasto ja kielioppi',
  },
  math: {
    id: 'math',
    name: 'Matematiikka',
    icon: '🔢',
    enabled: false,
    questionTypes: ['multiple_choice', 'fill_blank', 'short_answer'],
    defaultQuestionCount: 50,
    minQuestionCount: 20,
    maxQuestionCount: 100,
    supportedMaterials: ['pdf', 'text', 'image'],
    requiresLatex: true,
    subjectType: 'math',
    description: 'Matematiikan tehtävät ja laskut',
  },
  history: {
    id: 'history',
    name: 'Historia',
    icon: '📜',
    enabled: false,
    questionTypes: ['multiple_choice', 'true_false', 'short_answer', 'matching'],
    defaultQuestionCount: 50,
    minQuestionCount: 20,
    maxQuestionCount: 100,
    supportedMaterials: ['pdf', 'text', 'image'],
    subjectType: 'written',
    description: 'Historian tapahtumat ja henkilöt',
  },
  society: {
    id: 'society',
    name: 'Yhteiskuntaoppi',
    icon: '🏛️',
    enabled: false,
    questionTypes: ['multiple_choice', 'true_false', 'short_answer'],
    defaultQuestionCount: 50,
    minQuestionCount: 20,
    maxQuestionCount: 100,
    supportedMaterials: ['pdf', 'text', 'image'],
    subjectType: 'written',
    description: 'Yhteiskunnan rakenteet ja toiminta',
  },
} as const;

export const DIFFICULTY_LEVELS = [
  { value: 'helppo', label: 'Helppo', description: 'Perusasiat ja yksinkertaiset kysymykset' },
  { value: 'normaali', label: 'Normaali', description: 'Monipuolinen sisältö ja soveltaminen' },
  { value: 'vaikea', label: 'Vaikea', description: 'Haastava sisältö ja syvällinen ymmärrys' },
] as const;

export const GRADE_LEVELS = [
  { value: 4, label: '4. luokka' },
  { value: 5, label: '5. luokka' },
  { value: 6, label: '6. luokka' },
] as const;

export function getEnabledSubjects(): SubjectConfig[] {
  return Object.values(SUBJECTS).filter(subject => subject.enabled);
}

export function getSubject(id: Subject): SubjectConfig | undefined {
  return SUBJECTS[id];
}
