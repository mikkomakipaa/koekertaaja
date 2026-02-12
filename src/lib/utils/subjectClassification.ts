/**
 * Subject Classification Utilities
 *
 * Determines whether a subject should use rule-based flashcard format
 * (teaching rules/formulas) vs question-based format (testing facts).
 */

/**
 * Determines if a subject/topic should use rule-based flashcard format.
 * Rule-based format teaches concepts/formulas rather than testing specific calculations.
 *
 * @param subject - The subject name
 * @param topic - Optional topic within the subject
 * @param contentType - Explicit flashcard content type selection
 * @returns true if rule-based format should be used
 */
export function isRuleBasedSubject(
  subject: string,
  topic?: string,
  contentType?: 'vocabulary' | 'grammar' | 'mixed'
): boolean {
  const normalized = subject.toLowerCase();

  // Mathematics/physics/chemistry - always rule-based
  if (['matematiikka', 'math', 'mathematics', 'fysiikka', 'physics', 'kemia', 'chemistry'].includes(normalized)) {
    return true;
  }

  // Language subjects
  const languageSubjects = [
    'äidinkieli',
    'finnish',
    'suomi',
    'englanti',
    'english',
    'ruotsi',
    'swedish',
    'svenska',
  ];

  if (languageSubjects.includes(normalized)) {
    // Explicit content type takes precedence
    if (contentType === 'grammar' || contentType === 'mixed') {
      return true;
    }

    if (contentType === 'vocabulary') {
      return false;
    }

    // Backward-compatible fallback for older flows without contentType
    if (!topic) {
      return false;
    }

    const topicLower = topic.toLowerCase();
    const grammarKeywords = [
      'kielioppi',
      'grammar',
      'verbit',
      'verbs',
      'taivutus',
      'conjugation',
      'sijamuodot',
      'cases',
      'aikamuodot',
      'tenses',
    ];

    return grammarKeywords.some((keyword) => topicLower.includes(keyword));
  }

  return false;
}

/**
 * Validates that rule-based flashcard questions follow teaching format
 * instead of calculation/practice format.
 *
 * @param question - The question object to validate
 * @param subject - The subject name
 * @param topic - Optional topic name
 * @returns Validation result with valid flag and optional error reason
 */
export function validateRuleBasedQuestion(
  question: { question: string; type: string },
  subject: string,
  topic?: string
): { valid: boolean; reason?: string } {
  const questionText = question.question.toLowerCase();
  const normalizedSubject = subject.toLowerCase();

  // Check for calculation patterns (BAD)
  const calculationPatterns = [
    /\blaske[\s:]/i,
    /\bratkaise[\s:]/i,
    /\bsuorita[\s:]/i,
    /\bcalculate[\s:]/i,
    /\bsolve[\s:]/i,
    /\bcompute[\s:]/i,
  ];

  if (calculationPatterns.some(pattern => pattern.test(questionText))) {
    return {
      valid: false,
      reason: 'Contains calculation instruction (Laske/Calculate)',
    };
  }

  // Check for specific practice patterns (BAD)
  const practicePatterns = [
    /taivuta\s+verbi/i,
    /muodosta\s+lause/i,
    /conjugate\s+the\s+verb/i,
    /form\s+a\s+sentence/i,
  ];

  if (practicePatterns.some(pattern => pattern.test(questionText))) {
    return {
      valid: false,
      reason: 'Contains specific practice instruction instead of rule teaching',
    };
  }

  // For math, reject questions with specific calculations in question_text
  // (numbers should only appear in examples in explanation field)
  const isMathSubject = ['matematiikka', 'math', 'mathematics'].includes(
    normalizedSubject
  );

  if (isMathSubject) {
    // Allow numbers in "Mikä on X?" format, but not calculations
    const hasCalculationNumbers = /\d+\s*[×x÷+\-]\s*\d+/.test(questionText);
    if (hasCalculationNumbers) {
      return {
        valid: false,
        reason: 'Math question contains specific calculation instead of rule',
      };
    }
  }

  // Check for rule-based question starters (GOOD)
  const finnishStarters = [
    /^miten\s/i,
    /^mikä on\s/i,
    /^mitkä ovat\s/i,
    /^kuinka\s/i,
  ];

  const englishStarters = [
    /^how\s+to\s/i,
    /^how\s+do\s+you\s/i,
    /^what\s+is\s/i,
    /^what\s+are\s/i,
    /^explain\s+how\s/i,
  ];

  const hasValidStarter = [
    ...finnishStarters,
    ...englishStarters,
  ].some(pattern => pattern.test(questionText));

  // Language grammar prompts from AI often use other instruction styles
  // (e.g. "Milloin käytetään...", "Täydennä lause..."). We still block
  // clear drill/calculation patterns above, but avoid failing on starter-only checks.
  const isLanguageSubject = [
    'äidinkieli',
    'finnish',
    'suomi',
    'englanti',
    'english',
    'ruotsi',
    'swedish',
    'svenska',
  ].includes(normalizedSubject);

  if (isLanguageSubject) {
    return { valid: true };
  }

  if (!hasValidStarter) {
    return {
      valid: false,
      reason: 'Question does not start with rule-teaching format (Miten/Mikä/How/What)',
    };
  }

  return { valid: true };
}
