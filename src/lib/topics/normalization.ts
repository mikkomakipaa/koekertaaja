const FINNISH_LOCALE = 'fi-FI';

type LabelKind = 'topic' | 'subtopic';

interface CanonicalAliasEntry {
  canonical: string;
  aliases: string[];
  kinds?: LabelKind[];
}

interface NormalizationTelemetryOptions {
  context?: string;
  onUnexpectedEnglish?: (event: UnexpectedEnglishNormalizationEvent) => void;
}

interface UnexpectedEnglishNormalizationEvent {
  kind: LabelKind;
  input: string;
  normalized: string;
  context?: string;
}

// Initial canonical mapping set (task-213):
// - Nouns and Articles -> Substantiivit ja artikkelit
// - Vocabulary and Thematic Content -> Sanasto ja temaattinen sisältö
// - Communicative Functions and Texts -> Viestinnälliset funktiot ja tekstit
// - Present Simple Grammar -> Preesensin kielioppi
// - Essential Verbs: Be and Have -> Keskeiset verbit: olla ja omistaa
export const TOPIC_CANONICAL_ALIAS_ENTRIES: ReadonlyArray<CanonicalAliasEntry> = [
  {
    canonical: 'Substantiivit ja artikkelit',
    aliases: [
      'Nouns and Articles',
      'Nouns & Articles',
      'Nouns / Articles',
      'Substantiivit & artikkelit',
      'substantiivit ja artikkelit',
    ],
  },
  {
    canonical: 'Sanasto ja temaattinen sisältö',
    aliases: [
      'Vocabulary and Thematic Content',
      'Vocabulary & Thematic Content',
      'Vocabulary / Thematic Content',
      'Sanasto & temaattinen sisältö',
      'sanasto ja temaattinen sisältö',
    ],
  },
  {
    canonical: 'Viestinnälliset funktiot ja tekstit',
    aliases: [
      'Communicative Functions and Texts',
      'Communicative Functions & Texts',
      'Communicative Functions / Texts',
      'Viestinnälliset funktiot & tekstit',
      'viestinnälliset funktiot ja tekstit',
    ],
  },
  {
    canonical: 'Preesensin kielioppi',
    aliases: [
      'Present Simple Grammar',
      'Present simple grammar',
      'Preesensin kielioppi',
      'preesensin kielioppi',
      'Present simple',
      'Present Simple',
      'present simple',
    ],
  },
  {
    canonical: 'Keskeiset verbit: olla ja omistaa',
    aliases: [
      'Essential Verbs: Be and Have',
      'Essential verbs: be and have',
      'Keskeiset verbit: olla ja omistaa',
      'keskeiset verbit: olla ja omistaa',
      'be and have',
      'be & have',
      'be / have',
    ],
  },
  {
    canonical: 'Objektipronominit',
    aliases: ['object pronouns', 'Object Pronouns', 'object-pronouns', 'objektipronominit'],
    kinds: ['subtopic'],
  },
  {
    canonical: 'Vaatesanasto',
    aliases: ['clothing vocabulary', 'Clothing Vocabulary', 'clothing-vocabulary', 'vaatesanasto'],
    kinds: ['subtopic'],
  },
];

const LEGACY_WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpractical communication\b/gi, 'käytännön viestintä'],
  [/\bmodal\s+verbs?\b/gi, 'modaaliverbit'],
  [/\benglish\b/gi, 'englanti'],
  [/\bculture\b/gi, 'kulttuuri'],
  [/\breading comprehension\b/gi, 'luetun ymmärtäminen'],
  [/\blistening comprehension\b/gi, 'kuullun ymmärtäminen'],
  [/\bsentence structure\b/gi, 'lauseen rakenne'],
  [/\bpresent simple\b/gi, 'preesens'],
  [/\bpast simple\b/gi, 'imperfekti'],
  [/\bpresent perfect\b/gi, 'perfekti'],
  [/\bparts of speech\b/gi, 'sanaluokat'],
  [/\bword order\b/gi, 'sanajärjestys'],
  [/\bverb tenses\b/gi, 'aikamuodot'],
  [/\bprepositions\b/gi, 'prepositiot'],
  [/\bpronouns\b/gi, 'pronominit'],
  [/\badjectives\b/gi, 'adjektiivit'],
  [/\bnouns\b/gi, 'substantiivit'],
  [/\badverbs\b/gi, 'adverbit'],
  [/\barticles\b/gi, 'artikkelit'],
  [/\bconjunctions\b/gi, 'konjunktiot'],
  [/\bvocabulary\b/gi, 'sanasto'],
  [/\bgrammar\b/gi, 'kielioppi'],
  [/\bverbs\b/gi, 'verbit'],
  [/\bverb\b/gi, 'verbi'],
  [/\btenses\b/gi, 'aikamuodot'],
  [/\bwriting\b/gi, 'kirjoittaminen'],
  [/\bspeaking\b/gi, 'puhuminen'],
  [/\blistening\b/gi, 'kuuntelu'],
  [/\breading\b/gi, 'lukeminen'],
  [/\band\b/gi, 'ja'],
];

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeSeparators(value: string): string {
  return value
    .replace(/\s*[&/]\s*/g, ' ja ')
    .replace(/\s*[-–—]\s*/g, ' ja ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+ja\s+ja\s+/gi, ' ja ');
}

function normalizeForLookup(value: string): string {
  return collapseWhitespace(normalizeSeparators(value)).toLocaleLowerCase(FINNISH_LOCALE);
}

function normalizeWithLegacyReplacements(value: string): string {
  let normalized = value;
  for (const [pattern, replacement] of LEGACY_WORD_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  normalized = normalized.replace(/\benglanti\s+aikamuodot\b/gi, 'englannin aikamuodot');
  return collapseWhitespace(normalizeSeparators(normalized));
}

function createAliasMap(kind: LabelKind): Map<string, string> {
  const aliasMap = new Map<string, string>();

  for (const entry of TOPIC_CANONICAL_ALIAS_ENTRIES) {
    const supportsKind = !entry.kinds || entry.kinds.includes(kind);
    if (!supportsKind) {
      continue;
    }

    const values = [entry.canonical, ...entry.aliases];
    for (const value of values) {
      aliasMap.set(normalizeForLookup(value), entry.canonical);
    }
  }

  return aliasMap;
}

const topicAliasMap = createAliasMap('topic');
const subtopicAliasMap = createAliasMap('subtopic');

const ENGLISH_SIGNAL_PATTERN =
  /\b(and|topic|topics|subtopic|subtopics|content|functions?|texts?|grammar|vocabulary|verb|verbs|nouns?|articles?|pronouns?|reading|listening|writing|speaking|communication)\b/i;

function maybeEmitUnexpectedEnglishEvent(
  input: string,
  normalized: string,
  kind: LabelKind,
  options?: NormalizationTelemetryOptions
): void {
  if (!options?.onUnexpectedEnglish) {
    return;
  }

  const source = `${input} ${normalized}`;
  if (!ENGLISH_SIGNAL_PATTERN.test(source)) {
    return;
  }

  options.onUnexpectedEnglish({
    kind,
    input,
    normalized,
    context: options.context,
  });
}

function normalizeLabel(
  input: string,
  kind: LabelKind,
  options?: NormalizationTelemetryOptions
): string {
  const trimmed = collapseWhitespace(input);
  if (!trimmed) {
    return '';
  }

  const lookupKey = normalizeForLookup(trimmed);
  const aliases = kind === 'topic' ? topicAliasMap : subtopicAliasMap;
  const fromAlias = aliases.get(lookupKey);
  if (fromAlias) {
    return fromAlias;
  }

  const legacyNormalized = normalizeWithLegacyReplacements(trimmed);
  const legacyLookupKey = normalizeForLookup(legacyNormalized);
  const legacyAlias = aliases.get(legacyLookupKey);
  if (legacyAlias) {
    return legacyAlias;
  }

  maybeEmitUnexpectedEnglishEvent(trimmed, legacyNormalized, kind, options);
  return legacyNormalized;
}

export function normalizeTopicLabel(
  input: string,
  options?: NormalizationTelemetryOptions
): string {
  return normalizeLabel(input, 'topic', options);
}

export function normalizeSubtopicLabel(
  input: string,
  options?: NormalizationTelemetryOptions
): string {
  return normalizeLabel(input, 'subtopic', options);
}
