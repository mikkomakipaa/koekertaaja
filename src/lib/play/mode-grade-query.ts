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
  selectedGrade: number | null
): string {
  const params = new URLSearchParams(typeof base === 'string' ? base : base.toString());
  params.delete('mode');

  if (selectedGrade === null) {
    params.delete('grade');
  } else {
    params.set('grade', String(selectedGrade));
  }

  return params.toString();
}
