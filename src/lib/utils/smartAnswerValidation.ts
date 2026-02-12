const EPSILON = 0.0001;
const EXPRESSION_TIMEOUT_MS = 100;

const SUBSCRIPT_TO_DIGIT: Record<string, string> = {
  '\u2080': '0',
  '\u2081': '1',
  '\u2082': '2',
  '\u2083': '3',
  '\u2084': '4',
  '\u2085': '5',
  '\u2086': '6',
  '\u2087': '7',
  '\u2088': '8',
  '\u2089': '9',
};

const SUPERSCRIPT_TO_DIGIT: Record<string, string> = {
  '\u2070': '0',
  '\u00b9': '1',
  '\u00b2': '2',
  '\u00b3': '3',
  '\u2074': '4',
  '\u2075': '5',
  '\u2076': '6',
  '\u2077': '7',
  '\u2078': '8',
  '\u2079': '9',
};

type UnitGroup = 'length' | 'mass' | 'time' | 'temperature';

interface UnitDefinition {
  group: UnitGroup;
  toBase: (value: number) => number;
}

const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  mm: { group: 'length', toBase: (value) => value * 0.001 },
  cm: { group: 'length', toBase: (value) => value * 0.01 },
  m: { group: 'length', toBase: (value) => value },
  km: { group: 'length', toBase: (value) => value * 1000 },

  mg: { group: 'mass', toBase: (value) => value * 0.000001 },
  g: { group: 'mass', toBase: (value) => value * 0.001 },
  kg: { group: 'mass', toBase: (value) => value },
  t: { group: 'mass', toBase: (value) => value * 1000 },

  s: { group: 'time', toBase: (value) => value },
  sec: { group: 'time', toBase: (value) => value },
  min: { group: 'time', toBase: (value) => value * 60 },
  h: { group: 'time', toBase: (value) => value * 3600 },
  d: { group: 'time', toBase: (value) => value * 86400 },

  c: { group: 'temperature', toBase: (value) => value },
  '\u00b0c': { group: 'temperature', toBase: (value) => value },
  k: { group: 'temperature', toBase: (value) => value - 273.15 },
  f: { group: 'temperature', toBase: (value) => (value - 32) * (5 / 9) },
  '\u00b0f': { group: 'temperature', toBase: (value) => (value - 32) * (5 / 9) },
};

const FINNISH_ALTERNATIVES: Record<string, string[]> = {
  suomi: ['suomi', 'suomen tasavalta', 'finland'],
  helsinki: ['helsinki', 'helsingfors'],
  eduskunta: ['eduskunta', 'riksdag', 'parlamentti'],
  presidentti: ['presidentti', 'president', 'tasavallan presidentti'],
  eu: ['eu', 'euroopan unioni', 'european union'],
};

const SEMANTIC_SUBJECTS = new Set(['finnish', 'swedish', 'society', 'history']);

export type SmartMatchType =
  | 'exact'
  | 'numerical'
  | 'unit_conversion'
  | 'expression'
  | 'semantic'
  | 'none';

export interface SmartValidationResult {
  isCorrect: boolean;
  matchType: SmartMatchType;
}

export interface SmartValidationInput {
  questionType?: string;
  subject?: string;
}

interface ParsedNumber {
  value: number;
  source: 'number' | 'fraction' | 'percent';
}

interface ParsedUnitValue {
  value: number;
  unit: string;
}

const numberCache = new Map<string, ParsedNumber | null>();
const unitCache = new Map<string, ParsedUnitValue | null>();

function normalizeSubscriptsAndSuperscripts(value: string): string {
  return value
    .replace(/[\u2080-\u2089]/g, (char) => SUBSCRIPT_TO_DIGIT[char] ?? char)
    .replace(/[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]/g, (char) => SUPERSCRIPT_TO_DIGIT[char] ?? char);
}

function normalizeText(value: string): string {
  return normalizeSubscriptsAndSuperscripts(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]/g, '');
}

function normalizeUnitToken(value: string): string {
  return normalizeSubscriptsAndSuperscripts(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\u03bcm/g, 'um');
}

function normalizeNumericInput(value: string): string {
  return normalizeSubscriptsAndSuperscripts(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
}

function normalizedMatch(userAnswer: string, correctAnswer: string): boolean {
  return normalizeText(userAnswer) === normalizeText(correctAnswer);
}

function parseNumber(value: string): ParsedNumber | null {
  const key = normalizeNumericInput(value);
  if (numberCache.has(key)) {
    return numberCache.get(key) ?? null;
  }

  const fractionMatch = key.match(/^([-+]?\d+(?:\.\d+)?)\/([-+]?\d+(?:\.\d+)?)$/);
  if (fractionMatch) {
    const numerator = parseFloat(fractionMatch[1]);
    const denominator = parseFloat(fractionMatch[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < EPSILON) {
      numberCache.set(key, null);
      return null;
    }
    const parsed = { value: numerator / denominator, source: 'fraction' as const };
    numberCache.set(key, parsed);
    return parsed;
  }

  if (key.endsWith('%')) {
    const percentage = parseFloat(key.slice(0, -1));
    if (!Number.isFinite(percentage)) {
      numberCache.set(key, null);
      return null;
    }
    const parsed = { value: percentage / 100, source: 'percent' as const };
    numberCache.set(key, parsed);
    return parsed;
  }

  if (!/^[-+]?\d+(?:\.\d+)?$/.test(key)) {
    numberCache.set(key, null);
    return null;
  }

  const parsedNumber = parseFloat(key);
  if (!Number.isFinite(parsedNumber)) {
    numberCache.set(key, null);
    return null;
  }

  const parsed = { value: parsedNumber, source: 'number' as const };
  numberCache.set(key, parsed);
  return parsed;
}

function numericalEquivalence(userAnswer: string, correctAnswer: string): boolean {
  const userNumber = parseNumber(userAnswer);
  const correctNumber = parseNumber(correctAnswer);

  if (!userNumber || !correctNumber) {
    return false;
  }

  return Math.abs(userNumber.value - correctNumber.value) < EPSILON;
}

function parseValueWithUnit(value: string): ParsedUnitValue | null {
  const key = value.trim().toLowerCase();
  if (unitCache.has(key)) {
    return unitCache.get(key) ?? null;
  }

  const normalized = normalizeSubscriptsAndSuperscripts(value).trim();
  const match = normalized.match(/^([-+]?\d+(?:[.,]\d+)?)\s*([a-zA-Z\u00b0\u03bc]+)$/);
  if (!match) {
    unitCache.set(key, null);
    return null;
  }

  const parsedValue = parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(parsedValue)) {
    unitCache.set(key, null);
    return null;
  }

  const unit = normalizeUnitToken(match[2]);
  const parsed = { value: parsedValue, unit };
  unitCache.set(key, parsed);
  return parsed;
}

function unitEquivalence(userAnswer: string, correctAnswer: string): boolean {
  const userParsed = parseValueWithUnit(userAnswer);
  const correctParsed = parseValueWithUnit(correctAnswer);
  if (!userParsed || !correctParsed) {
    return false;
  }

  const userUnitDef = UNIT_DEFINITIONS[userParsed.unit];
  const correctUnitDef = UNIT_DEFINITIONS[correctParsed.unit];
  if (!userUnitDef || !correctUnitDef || userUnitDef.group !== correctUnitDef.group) {
    return false;
  }

  const userBase = userUnitDef.toBase(userParsed.value);
  const correctBase = correctUnitDef.toBase(correctParsed.value);
  return Math.abs(userBase - correctBase) < EPSILON;
}

function normalizeAlgebraTerm(term: string): string {
  const compact = term.replace(/\s+/g, '').toLowerCase();
  if (!compact.includes('*')) {
    return compact;
  }

  return compact
    .split('*')
    .filter(Boolean)
    .sort()
    .join('*');
}

function splitAdditiveTerms(expression: string): string[] | null {
  const normalized = normalizeSubscriptsAndSuperscripts(expression).replace(/\s+/g, '').toLowerCase();
  if (!normalized || /[=\-\/^()]/.test(normalized)) {
    return null;
  }

  const terms = normalized.split('+').map(normalizeAlgebraTerm).filter(Boolean);
  if (terms.length === 0) {
    return null;
  }

  return terms.sort();
}

function expressionEquivalence(userAnswer: string, correctAnswer: string): boolean {
  const startedAt = Date.now();
  const userNormalized = normalizeSubscriptsAndSuperscripts(userAnswer).trim();
  const correctNormalized = normalizeSubscriptsAndSuperscripts(correctAnswer).trim();

  if (userNormalized === correctNormalized) {
    return true;
  }

  if (Date.now() - startedAt > EXPRESSION_TIMEOUT_MS) {
    return false;
  }

  const userTerms = splitAdditiveTerms(userNormalized);
  const correctTerms = splitAdditiveTerms(correctNormalized);
  if (!userTerms || !correctTerms || userTerms.length !== correctTerms.length) {
    return false;
  }

  if (Date.now() - startedAt > EXPRESSION_TIMEOUT_MS) {
    return false;
  }

  return userTerms.every((term, index) => term === correctTerms[index]);
}

function semanticEquivalence(userAnswer: string, correctAnswer: string): boolean {
  const userNormalized = normalizeText(userAnswer);
  const correctNormalized = normalizeText(correctAnswer);

  for (const alternatives of Object.values(FINNISH_ALTERNATIVES)) {
    const normalizedAlternatives = alternatives.map(normalizeText);
    if (normalizedAlternatives.includes(correctNormalized)) {
      return normalizedAlternatives.includes(userNormalized);
    }
  }

  return false;
}

export function smartValidateAnswer(
  userAnswer: string,
  correctAnswer: string,
  options: SmartValidationInput = {}
): SmartValidationResult {
  if (!userAnswer?.trim() || !correctAnswer?.trim()) {
    return { isCorrect: false, matchType: 'none' };
  }

  if (normalizedMatch(userAnswer, correctAnswer)) {
    return { isCorrect: true, matchType: 'exact' };
  }

  if (numericalEquivalence(userAnswer, correctAnswer)) {
    return { isCorrect: true, matchType: 'numerical' };
  }

  if (unitEquivalence(userAnswer, correctAnswer)) {
    return { isCorrect: true, matchType: 'unit_conversion' };
  }

  if (expressionEquivalence(userAnswer, correctAnswer)) {
    return { isCorrect: true, matchType: 'expression' };
  }

  const normalizedSubject = options.subject?.toLowerCase().trim();
  if (normalizedSubject && SEMANTIC_SUBJECTS.has(normalizedSubject)) {
    if (semanticEquivalence(userAnswer, correctAnswer)) {
      return { isCorrect: true, matchType: 'semantic' };
    }
  }

  return { isCorrect: false, matchType: 'none' };
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  const fixed = value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return fixed;
}

export function getAlternativeRepresentations(answer: string): string[] {
  const alternatives = new Set<string>();
  const trimmedAnswer = answer.trim();

  if (!trimmedAnswer) {
    return [];
  }

  const parsedNumber = parseNumber(trimmedAnswer);
  if (parsedNumber) {
    alternatives.add(formatNumber(parsedNumber.value));
    alternatives.add(`${formatNumber(parsedNumber.value * 100)}%`);

    const scaled = Math.round(parsedNumber.value * 10000);
    if (scaled !== 0) {
      const gcd = (a: number, b: number): number => {
        let x = Math.abs(a);
        let y = Math.abs(b);
        while (y !== 0) {
          const next = x % y;
          x = y;
          y = next;
        }
        return x;
      };
      const denominator = 10000;
      const divisor = gcd(scaled, denominator);
      const numerator = scaled / divisor;
      const reducedDenominator = denominator / divisor;
      alternatives.add(`${numerator}/${reducedDenominator}`);
    }
  }

  const parsedUnit = parseValueWithUnit(trimmedAnswer);
  if (parsedUnit) {
    const unitDef = UNIT_DEFINITIONS[parsedUnit.unit];
    if (unitDef?.group === 'length') {
      const meters = UNIT_DEFINITIONS[parsedUnit.unit].toBase(parsedUnit.value);
      alternatives.add(`${formatNumber(meters)} m`);
      alternatives.add(`${formatNumber(meters * 100)} cm`);
      alternatives.add(`${formatNumber(meters * 1000)} mm`);
    }
  }

  const normalized = normalizeText(trimmedAnswer);
  for (const alternativesList of Object.values(FINNISH_ALTERNATIVES)) {
    const normalizedAlternatives = alternativesList.map(normalizeText);
    if (normalizedAlternatives.includes(normalized)) {
      alternativesList.forEach((item) => alternatives.add(item));
    }
  }

  alternatives.delete(trimmedAnswer);
  alternatives.delete(normalizeSubscriptsAndSuperscripts(trimmedAnswer));

  return Array.from(alternatives).filter(Boolean);
}

export function analyzeValidationCoverage(input: {
  questionType: string;
  subject?: string | null;
  correctAnswer?: string | null;
}): {
  supports: Array<'exact' | 'numerical' | 'unit_conversion' | 'expression' | 'semantic'>;
  label: string;
} {
  const supports = new Set<'exact' | 'numerical' | 'unit_conversion' | 'expression' | 'semantic'>(['exact']);

  if (input.correctAnswer) {
    const normalized = input.correctAnswer.trim();

    if (parseNumber(normalized)) {
      supports.add('numerical');
    }

    if (parseValueWithUnit(normalized)) {
      supports.add('unit_conversion');
    }

    const additiveTerms = splitAdditiveTerms(normalized);
    if (additiveTerms && additiveTerms.length > 1) {
      supports.add('expression');
    }

    const normalizedAnswer = normalizeText(normalized);
    const hasSemanticAlternative = Object.values(FINNISH_ALTERNATIVES).some((group) =>
      group.map(normalizeText).includes(normalizedAnswer)
    );
    if (hasSemanticAlternative) {
      supports.add('semantic');
    }
  }

  const normalizedSubject = input.subject?.toLowerCase().trim();
  if (normalizedSubject && SEMANTIC_SUBJECTS.has(normalizedSubject)) {
    supports.add('semantic');
  }

  if (input.questionType === 'true_false' || input.questionType === 'matching' || input.questionType === 'sequential') {
    return {
      supports: ['exact'],
      label: 'Perusvertailu',
    };
  }

  const supportList = Array.from(supports);
  return {
    supports: supportList,
    label: supportList.join(' + '),
  };
}
