import { getSubjectTypeFromId, isValidSubjectId } from '@/config/subjects';

export type SubjectType = 'language' | 'math' | 'written' | 'skills' | 'concepts' | 'geography';

// Legacy mapping for backward compatibility with old free-text subjects
export const SUBJECT_TYPE_MAPPING: Record<string, SubjectType> = {
  english: 'language',
  englanti: 'language',
  math: 'math',
  matematiikka: 'math',
  finnish: 'language',
  suomi: 'language',
  'äidinkieli': 'language',
  history: 'written',
  historia: 'written',
  biology: 'written',
  biologia: 'written',
  physics: 'math',
  fysiikka: 'math',
  chemistry: 'math',
  kemia: 'math',
  geography: 'geography',
  maantiede: 'geography',
  maantieto: 'geography',
  'environmental-studies': 'written',
  'ympäristöoppi': 'written',
  art: 'skills',
  kuvataide: 'skills',
  music: 'skills',
  musiikki: 'skills',
  pe: 'skills',
  liikunta: 'skills',
  crafts: 'skills',
  'käsityö': 'skills',
  religion: 'concepts',
  uskonto: 'concepts',
  ethics: 'concepts',
  'elämänkatsomustieto': 'concepts',
  philosophy: 'concepts',
  society: 'written',
  yhteiskuntaoppi: 'written',
  swedish: 'language',
  ruotsi: 'language',
};

/**
 * Get subject type from subject ID or legacy name
 * Supports both new subject IDs and old free-text subjects
 */
export function getSubjectType(subjectIdOrName: string): SubjectType {
  const normalized = subjectIdOrName.trim().toLowerCase();

  if (isValidSubjectId(subjectIdOrName)) {
    const type = getSubjectTypeFromId(subjectIdOrName);
    if (type) return type;
  }

  if (isValidSubjectId(normalized)) {
    const type = getSubjectTypeFromId(normalized);
    if (type) return type;
  }

  return SUBJECT_TYPE_MAPPING[normalized] || 'written';
}
