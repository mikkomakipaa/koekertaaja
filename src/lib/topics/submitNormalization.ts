import { normalizeSubtopicLabel, normalizeTopicLabel } from '@/lib/topics/normalization';

interface LoggerLike {
  warn: (payload: Record<string, unknown>, message: string) => void;
}

interface SubmitQuestionLike {
  topic: string;
  subtopic?: string;
  [key: string]: unknown;
}

export function normalizeSubmissionTopics<T extends SubmitQuestionLike>(
  questions: T[],
  requestLogger: LoggerLike
): T[] {
  return questions.map((question, index) => {
    const normalizedTopic = normalizeTopicLabel(question.topic, {
      context: `submit.question[${index}].topic`,
      onUnexpectedEnglish: (event) => {
        requestLogger.warn(
          {
            kind: event.kind,
            input: event.input,
            normalized: event.normalized,
            context: event.context,
          },
          'Unexpected unmapped English topic label encountered in submit payload'
        );
      },
    });

    const normalizedSubtopic =
      typeof question.subtopic === 'string' && question.subtopic.trim().length > 0
        ? normalizeSubtopicLabel(question.subtopic, {
          context: `submit.question[${index}].subtopic`,
          onUnexpectedEnglish: (event) => {
            requestLogger.warn(
              {
                kind: event.kind,
                input: event.input,
                normalized: event.normalized,
                context: event.context,
              },
              'Unexpected unmapped English topic label encountered in submit payload'
            );
          },
        })
        : undefined;

    return {
      ...question,
      topic: normalizedTopic,
      subtopic: normalizedSubtopic,
    };
  });
}
