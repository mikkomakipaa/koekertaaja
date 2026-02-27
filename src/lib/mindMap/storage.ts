import { createLogger } from '@/lib/logger';
import type { PracticedSetDropdownItem, PracticedSetMetadata, TopicMasteryStats } from '@/types/mindMap';
import { normalizeTopicLabel } from '@/lib/topics/normalization';

const logger = createLogger({ module: 'mindMap/storage' });

export const TOPIC_MASTERY_STORAGE_PREFIX = 'topic_mastery_';
export const TOPIC_MASTERY_METADATA_STORAGE_PREFIX = 'topic_mastery_meta_';

const LEGACY_SET_METADATA_PREFIX = 'question_set_meta_';

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const fallback = (globalThis as { localStorage?: Storage }).localStorage;
  return fallback ?? null;
};

const normalizeCode = (questionSetCode?: string): string | null => {
  const trimmed = questionSetCode?.trim();
  return trimmed ? trimmed : null;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

export const normalizeTopicMasteryStats = (
  parsed: unknown
): Record<string, TopicMasteryStats> => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }

  const sanitized: Record<string, TopicMasteryStats> = {};
  for (const [topic, rawStats] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof topic !== 'string' || topic.trim().length === 0) continue;

    const stats = rawStats as Partial<TopicMasteryStats> | null;
    const correct = isFiniteNumber(stats?.correct) && stats.correct > 0 ? stats.correct : 0;
    const total = isFiniteNumber(stats?.total) && stats.total > 0 ? stats.total : 0;
    const normalizedTopic = normalizeTopicLabel(topic);
    if (!normalizedTopic) continue;

    const existing = sanitized[normalizedTopic];
    sanitized[normalizedTopic] = {
      correct: (existing?.correct ?? 0) + correct,
      total: (existing?.total ?? 0) + total,
    };
  }

  return sanitized;
};

const readJsonFromStorage = (storageKey: string, storageOverride?: Storage | null): unknown => {
  const storage = storageOverride ?? getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    logger.warn({ error, storageKey }, 'Unable to read JSON value from storage');
    return null;
  }
};

const createStableTopicMasteryPayload = (
  stats: Record<string, TopicMasteryStats>
): string => {
  const sortedEntries = Object.entries(stats).sort(([topicA], [topicB]) => topicA.localeCompare(topicB, 'fi'));
  return JSON.stringify(Object.fromEntries(sortedEntries));
};

const shouldRewriteTopicMasteryPayload = (
  parsed: unknown,
  normalizedPayload: string
): boolean => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return true;
  }

  try {
    const rawPayload = JSON.stringify(parsed);
    return rawPayload !== normalizedPayload;
  } catch {
    return true;
  }
};

export const getTopicMasteryStorageKey = (questionSetCode?: string): string | null => {
  const code = normalizeCode(questionSetCode);
  if (!code) return null;
  return `${TOPIC_MASTERY_STORAGE_PREFIX}${code}`;
};

export const getTopicMasteryMetadataStorageKey = (questionSetCode?: string): string | null => {
  const code = normalizeCode(questionSetCode);
  if (!code) return null;
  return `${TOPIC_MASTERY_METADATA_STORAGE_PREFIX}${code}`;
};

export const readTopicMasteryFromStorage = (
  questionSetCode?: string,
  storageOverride?: Storage | null
): Record<string, TopicMasteryStats> => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if (!storageKey) return {};

  const storage = storageOverride ?? getStorage();
  if (!storage) return {};

  let parsed: unknown = null;
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return {};
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.warn({ error, storageKey }, 'Unable to read JSON value from storage');
  }

  const sanitized = normalizeTopicMasteryStats(parsed);
  const normalizedPayload = createStableTopicMasteryPayload(sanitized);

  if (shouldRewriteTopicMasteryPayload(parsed, normalizedPayload)) {
    try {
      storage.setItem(storageKey, normalizedPayload);
    } catch (error) {
      logger.warn({ error, storageKey }, 'Unable to rewrite normalized topic mastery payload');
    }
  }

  return sanitized;
};

export const extractQuestionSetCodeFromTopicMasteryKey = (storageKey: string): string | null => {
  if (!storageKey.startsWith(TOPIC_MASTERY_STORAGE_PREFIX)) return null;
  if (storageKey.startsWith(TOPIC_MASTERY_METADATA_STORAGE_PREFIX)) return null;

  const code = storageKey.slice(TOPIC_MASTERY_STORAGE_PREFIX.length).trim();
  return code.length > 0 ? code : null;
};

const listStorageKeys = (storageOverride?: Storage | null): string[] => {
  const storage = storageOverride ?? getStorage();
  if (!storage) return [];

  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    keys.push(key);
  }
  return keys;
};

const readMetadataObject = (storageKey: string, storageOverride?: Storage | null): PracticedSetMetadata | null => {
  const parsed = readJsonFromStorage(storageKey, storageOverride);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

  const raw = parsed as Record<string, unknown>;
  const code = normalizeCode(typeof raw.code === 'string' ? raw.code : undefined);
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const subject = typeof raw.subject === 'string' ? raw.subject.trim() : '';
  const examDate = typeof raw.examDate === 'string' ? raw.examDate.trim() : '';
  const difficulty = typeof raw.difficulty === 'string' ? raw.difficulty.trim() : '';
  const grade = typeof raw.grade === 'string' ? raw.grade.trim() : '';
  const practicedAt = isFiniteNumber(raw.practicedAt) ? raw.practicedAt : null;

  return {
    code: code ?? '',
    name: name || null,
    subject: subject || null,
    examDate: examDate || null,
    difficulty: difficulty || null,
    grade: grade || null,
    practicedAt,
  };
};

const sanitizeLabelPart = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const formatPracticedSetDropdownLabel = (item: Pick<
  PracticedSetDropdownItem,
  'code' | 'label' | 'subject' | 'examDate' | 'difficulty' | 'grade'
>): string => {
  const fallbackCode = sanitizeLabelPart(item.code) ?? item.code;
  const subject = sanitizeLabelPart(item.subject)
    ?? sanitizeLabelPart(item.label)
    ?? fallbackCode;
  const examDate = sanitizeLabelPart(item.examDate);
  const difficultyRaw = sanitizeLabelPart(item.difficulty);
  const difficultyLabel = difficultyRaw === 'helppo'
    ? 'Helppo'
    : difficultyRaw === 'normaali'
      ? 'Normaali'
      : difficultyRaw === 'aikahaaste'
        ? 'Aikahaaste'
        : difficultyRaw;
  const grade = sanitizeLabelPart(item.grade);
  const gradeLabel = grade ? `${grade}. lk` : null;

  const parts = [subject, examDate, difficultyLabel, gradeLabel].filter(Boolean) as string[];
  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.length > 0 ? uniqueParts.join(' • ') : fallbackCode;
};

export const readPracticedSetMetadataFromStorage = (
  questionSetCode: string,
  storageOverride?: Storage | null
): PracticedSetMetadata | null => {
  const code = normalizeCode(questionSetCode);
  if (!code) return null;

  const primaryKey = getTopicMasteryMetadataStorageKey(code);
  if (primaryKey) {
    const primary = readMetadataObject(primaryKey, storageOverride);
    if (primary) {
      return { ...primary, code: code };
    }
  }

  const legacy = readMetadataObject(`${LEGACY_SET_METADATA_PREFIX}${code}`, storageOverride);
  if (!legacy) return null;

  return { ...legacy, code: code };
};

const hasPracticedTopicData = (questionSetCode: string, storageOverride?: Storage | null): boolean => {
  const stats = readTopicMasteryFromStorage(questionSetCode, storageOverride);
  return Object.values(stats).some((topicStats) => topicStats.total > 0);
};

export const listPracticedSetCodesFromStorage = (storageOverride?: Storage | null): string[] => {
  const practicedCodes = new Set<string>();

  for (const key of listStorageKeys(storageOverride)) {
    const code = extractQuestionSetCodeFromTopicMasteryKey(key);
    if (!code) continue;
    if (!hasPracticedTopicData(code, storageOverride)) continue;
    practicedCodes.add(code);
  }

  return Array.from(practicedCodes).sort((codeA, codeB) => codeA.localeCompare(codeB, 'fi'));
};

export const listPracticedSetDropdownItemsFromStorage = (
  storageOverride?: Storage | null
): PracticedSetDropdownItem[] => {
  return listPracticedSetCodesFromStorage(storageOverride).map((code) => {
    const metadata = readPracticedSetMetadataFromStorage(code, storageOverride);
    const label = metadata?.name || metadata?.subject || code;

    return {
      code,
      label,
      subject: metadata?.subject ?? null,
      examDate: metadata?.examDate ?? null,
      difficulty: metadata?.difficulty ?? null,
      grade: metadata?.grade ?? null,
      practicedAt: metadata?.practicedAt ?? null,
    };
  });
};
