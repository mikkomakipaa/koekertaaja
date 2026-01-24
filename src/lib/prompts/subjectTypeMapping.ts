export type SubjectType = 'language' | 'math' | 'written' | 'skills' | 'concepts' | 'geography';

export const SUBJECT_TYPE_MAPPING: Record<string, SubjectType> = {
  english: 'language',
  math: 'math',
  finnish: 'language',
  history: 'written',
  biology: 'written',
  geography: 'geography',
  maantiede: 'geography',
  'environmental-studies': 'written',
  art: 'skills',
  music: 'skills',
  pe: 'skills',
  religion: 'concepts',
  ethics: 'concepts',
  philosophy: 'concepts',
  society: 'written',
};

export function getSubjectType(subject: string): SubjectType {
  return SUBJECT_TYPE_MAPPING[subject] || 'written';
}
