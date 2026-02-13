import { type StudyMode } from '@/types';

export function parseStudyModeParam(value: string | null | undefined): StudyMode {
  return value === 'opettele' ? 'opettele' : 'pelaa';
}

export function parseGradeParam(value: string | null | undefined): number | null {
  if (!value) return null;

  const grade = Number.parseInt(value, 10);
  if (!Number.isFinite(grade) || grade <= 0) {
    return null;
  }

  return grade;
}

export function buildModeGradeQuery(
  base: URLSearchParams | string,
  studyMode: StudyMode,
  selectedGrade: number | null
): string {
  const params = new URLSearchParams(typeof base === 'string' ? base : base.toString());

  params.set('mode', studyMode);

  if (selectedGrade === null) {
    params.delete('grade');
  } else {
    params.set('grade', String(selectedGrade));
  }

  return params.toString();
}
