const DIFFICULTY_SUFFIXES = [' - Helppo', ' - Normaali', ' - Aikahaaste', ' - Kortit', ' - Muistikortit'] as const;

export function stripDifficultySuffix(name: string): string {
  for (const suffix of DIFFICULTY_SUFFIXES) {
    if (name.endsWith(suffix)) {
      return name.slice(0, -suffix.length);
    }
  }

  return name;
}
