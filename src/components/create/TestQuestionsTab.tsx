'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { QuestionSet, Question, QuestionType } from '@/types';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { VisualQuestionPreview } from '@/components/questions/VisualQuestionPreview';
import { Button } from '@/components/ui/button';
import { MathText } from '@/components/ui/math-text';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { withCsrfHeaders } from '@/lib/security/csrf-client';
import { formatMathSummary } from '@/lib/utils/math-summary';
import {
  analyzeValidationCoverage,
  getAlternativeRepresentations,
} from '@/lib/utils/smartAnswerValidation';
import {
  CircleNotch,
  Eye,
  X,
  TextT,
  ListChecks,
  CheckCircle,
  Shuffle,
  ChatText,
  ListNumbers,
  ListBullets,
  Article,
  PencilSimple,
  Trash,
  Plus,
  CaretUp,
  CaretDown,
} from '@phosphor-icons/react';

interface TestQuestionsTabProps {
  allQuestionSets: QuestionSet[];
  loadingQuestionSets: boolean;
  onRefreshSets: () => Promise<void>;
  isAdmin: boolean;
}

const logger = createLogger({ module: 'TestQuestionsTab' });

export function TestQuestionsTab({
  allQuestionSets,
  loadingQuestionSets,
  onRefreshSets,
  isAdmin,
}: TestQuestionsTabProps) {
  // State
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [filterQuestionType, setFilterQuestionType] = useState<QuestionType | 'all'>('all');
  const [testingQuestion, setTestingQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editOptions, setEditOptions] = useState('');
  const [editAcceptableAnswers, setEditAcceptableAnswers] = useState('');
  const [editTrueFalse, setEditTrueFalse] = useState<'true' | 'false'>('true');
  const [editMatchingPairs, setEditMatchingPairs] = useState<Array<{ left: string; right: string }>>([]);
  const [editSequentialItems, setEditSequentialItems] = useState<string[]>([]);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const selectedQuestionSet = selectedQuestionSetId
    ? allQuestionSets.find((set) => set.id === selectedQuestionSetId) ?? null
    : null;

  // Type filters configuration
  const typeFilters: Array<{ value: QuestionType | 'all'; label: string; icon: React.ReactElement }> = [
    { value: 'all', label: 'Kaikki', icon: <ListBullets size={14} weight="duotone" /> },
    { value: 'flashcard', label: 'Kortti', icon: <Article size={14} weight="duotone" /> },
    { value: 'multiple_choice', label: 'Monivalinta', icon: <ListChecks size={14} weight="duotone" /> },
    { value: 'multiple_select', label: 'Valitse useita', icon: <ListChecks size={14} weight="duotone" /> },
    { value: 'fill_blank', label: 'Täytä', icon: <TextT size={14} weight="duotone" /> },
    { value: 'true_false', label: 'Tosi/Epä', icon: <CheckCircle size={14} weight="duotone" /> },
    { value: 'matching', label: 'Yhdistä', icon: <Shuffle size={14} weight="duotone" /> },
    { value: 'short_answer', label: 'Lyhyt', icon: <ChatText size={14} weight="duotone" /> },
    { value: 'sequential', label: 'Järjestä', icon: <ListNumbers size={14} weight="duotone" /> },
  ];

  // Load questions for selected set
  const loadQuestions = async (questionSetId: string) => {
    setLoadingQuestions(true);
    try {
      const questionSet = allQuestionSets.find((s) => s.id === questionSetId);
      if (!questionSet) throw new Error('Question set not found');

      const response = await fetch(
        `/api/question-sets/by-code?code=${questionSet.code}&includeDrafts=1`,
        { credentials: 'same-origin' }
      );

      if (!response.ok) throw new Error('Failed to load questions');
      const data = await response.json();
      setQuestions(data.data.questions || []);
    } catch (error) {
      logger.error({ error }, 'Error loading questions');
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Handle question set selection change
  const handleQuestionSetChange = (questionSetId: string) => {
    setSelectedQuestionSetId(questionSetId);
    setQuestions([]);
    setFilterQuestionType('all');
    setTestingQuestion(null);
    if (questionSetId) {
      loadQuestions(questionSetId);
    }
  };

  // Open modal with question
  const handleTestQuestion = (question: Question) => {
    setTestingQuestion(question);
    setUserAnswer(null);
    setShowExplanation(true);
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setTestingQuestion(null);
    setUserAnswer(null);
    setShowExplanation(true);
  };

  const formatListForEdit = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join('\n');
    }
    return '';
  };

  const parseListInput = (value: string): string[] => {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const openQuestionEdit = (question: Question) => {
    setEditingQuestion(question);
    setEditError('');
    setEditQuestionText(question.question_text ?? '');
    setEditCorrectAnswer('');
    setEditOptions('');
    setEditAcceptableAnswers('');
    setEditMatchingPairs([]);
    setEditSequentialItems([]);

    switch (question.question_type) {
      case 'multiple_choice':
        setEditCorrectAnswer(typeof question.correct_answer === 'string' ? question.correct_answer : '');
        setEditOptions(formatListForEdit(question.options));
        break;
      case 'multiple_select':
        setEditCorrectAnswer(formatListForEdit(question.correct_answers));
        setEditOptions(formatListForEdit(question.options));
        break;
      case 'fill_blank':
      case 'short_answer':
        setEditCorrectAnswer(typeof question.correct_answer === 'string' ? question.correct_answer : '');
        setEditAcceptableAnswers(formatListForEdit(question.acceptable_answers));
        break;
      case 'flashcard':
        setEditCorrectAnswer(question.correct_answer);
        break;
      case 'true_false':
        setEditTrueFalse(question.correct_answer ? 'true' : 'false');
        break;
      case 'matching':
        setEditMatchingPairs(
          question.pairs.length > 0
            ? question.pairs.map((pair) => ({ left: pair.left, right: pair.right }))
            : [{ left: '', right: '' }]
        );
        break;
      case 'sequential': {
        const orderedItems =
          question.correct_order.length === question.items.length && question.correct_order.length > 0
            ? question.correct_order.map((idx) => {
                const item = question.items[idx];
                return typeof item === 'string' ? item : item?.text ?? '';
              })
            : question.items.map((item) => (typeof item === 'string' ? item : item.text));
        setEditSequentialItems(orderedItems.length > 0 ? orderedItems : ['']);
        break;
      }
    }
  };

  const validationCoverage = editingQuestion
    ? analyzeValidationCoverage({
        questionType: editingQuestion.question_type,
        subject: selectedQuestionSet?.subject,
        correctAnswer:
          'correct_answer' in editingQuestion && typeof editingQuestion.correct_answer === 'string'
            ? editCorrectAnswer || editingQuestion.correct_answer
            : editCorrectAnswer || undefined,
      })
    : null;

  const smartAlternatives =
    editingQuestion &&
    ['multiple_choice', 'fill_blank', 'short_answer', 'flashcard'].includes(editingQuestion.question_type)
      ? getAlternativeRepresentations(
          'correct_answer' in editingQuestion && typeof editingQuestion.correct_answer === 'string'
            ? editCorrectAnswer || editingQuestion.correct_answer
            : editCorrectAnswer
        )
      : [];

  const handleSaveQuestionEdit = async () => {
    if (!editingQuestion) return;
    if (!editQuestionText.trim()) {
      setEditError('Kysymyksen teksti ei voi olla tyhjä.');
      return;
    }

    setSavingEdit(true);
    setEditError('');

    const failEdit = (message: string) => {
      setEditError(message);
      setSavingEdit(false);
    };

    try {
      let payload: Record<string, any> = {
        questionText: editQuestionText.trim(),
      };

      switch (editingQuestion.question_type) {
        case 'multiple_choice': {
          const options = parseListInput(editOptions);
          if (!editCorrectAnswer.trim()) return failEdit('Anna oikea vastaus.');
          if (options.length < 2) return failEdit('Anna vähintään kaksi vaihtoehtoa.');
          payload = { ...payload, correctAnswer: editCorrectAnswer.trim(), options };
          break;
        }
        case 'multiple_select': {
          const options = parseListInput(editOptions);
          const correctAnswers = parseListInput(editCorrectAnswer);
          if (options.length !== 5) return failEdit('Anna tasan 5 vaihtoehtoa.');
          if (correctAnswers.length < 2 || correctAnswers.length > 3) return failEdit('Anna 2-3 oikeaa vastausta.');
          if (!correctAnswers.every((answer) => options.includes(answer))) {
            return failEdit('Kaikkien oikeiden vastausten pitää löytyä vaihtoehdoista.');
          }
          payload = { ...payload, correctAnswer: correctAnswers, options };
          break;
        }
        case 'fill_blank':
        case 'short_answer':
          if (!editCorrectAnswer.trim()) return failEdit('Anna oikea vastaus.');
          payload = {
            ...payload,
            correctAnswer: editCorrectAnswer.trim(),
            acceptableAnswers: parseListInput(editAcceptableAnswers),
          };
          break;
        case 'flashcard':
          if (!editCorrectAnswer.trim()) return failEdit('Anna oikea vastaus.');
          payload = { ...payload, correctAnswer: editCorrectAnswer.trim() };
          break;
        case 'true_false':
          payload = { ...payload, correctAnswer: editTrueFalse === 'true' };
          break;
        case 'matching': {
          const pairs = editMatchingPairs
            .map((pair) => ({ left: pair.left.trim(), right: pair.right.trim() }))
            .filter((pair) => pair.left && pair.right);
          if (pairs.length === 0) return failEdit('Anna vähintään yksi pari.');
          payload = { ...payload, correctAnswer: pairs };
          break;
        }
        case 'sequential': {
          const items = editSequentialItems.map((item) => item.trim()).filter(Boolean);
          if (items.length < 2) return failEdit('Anna vähintään kaksi kohdetta.');
          payload = {
            ...payload,
            correctAnswer: {
              items,
              correct_order: items.map((_, index) => index),
            },
          };
          break;
        }
      }

      const response = await fetch(`/api/questions/${editingQuestion.id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: withCsrfHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json();

      if (!response.ok) {
        throw new Error(responsePayload.error || 'Kysymyksen päivitys epäonnistui');
      }

      toast.success('Kysymys päivitetty');
      setEditingQuestion(null);
      if (selectedQuestionSetId) {
        await loadQuestions(selectedQuestionSetId);
      }
      await onRefreshSets();
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Kysymyksen päivitys epäonnistui');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!window.confirm('Poistetaanko kysymys pysyvästi?')) {
      return;
    }

    setDeletingQuestionId(question.id);
    try {
      const response = await fetch(`/api/questions/${question.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: withCsrfHeaders(),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Kysymyksen poisto epäonnistui');
      }

      toast.success('Kysymys poistettu');
      setQuestions((prev) => prev.filter((item) => item.id !== question.id));
      if (testingQuestion?.id === question.id) {
        handleCloseModal();
      }
      if (editingQuestion?.id === question.id) {
        setEditingQuestion(null);
      }
      await onRefreshSets();
    } catch (error) {
      logger.error({ error, questionId: question.id }, 'Error deleting question');
      toast.error(error instanceof Error ? error.message : 'Kysymyksen poisto epäonnistui');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  // Get filtered questions based on selected type
  const getFilteredQuestions = () => {
    if (filterQuestionType === 'all') return questions;
    return questions.filter((q) => q.question_type === filterQuestionType);
  };

  // Get question type info (icon and label)
  const getQuestionTypeInfo = (type: QuestionType): { label: string; icon: React.ReactElement } => {
    const typeMap: Record<QuestionType, { label: string; icon: React.ReactElement }> = {
      fill_blank: { label: 'Täydennä lause', icon: <TextT size={14} weight="duotone" /> },
      multiple_choice: { label: 'Monivalinta', icon: <ListChecks size={14} weight="duotone" /> },
      multiple_select: { label: 'Valitse useita', icon: <ListChecks size={14} weight="duotone" /> },
      true_false: { label: 'Totta vai tarua', icon: <CheckCircle size={14} weight="duotone" /> },
      matching: { label: 'Yhdistä parit', icon: <Shuffle size={14} weight="duotone" /> },
      short_answer: { label: 'Lyhyt vastaus', icon: <ChatText size={14} weight="duotone" /> },
      sequential: { label: 'Järjestä oikein', icon: <ListNumbers size={14} weight="duotone" /> },
      flashcard: { label: 'Flashcard', icon: <Article size={14} weight="duotone" /> },
    };
    return typeMap[type];
  };

  return (
    <div className="space-y-4">
      {/* Question Set Selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedQuestionSetId || ''}
          onChange={(e) => handleQuestionSetChange(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100"
        >
          <option value="">Valitse kysymyssarja...</option>
          {allQuestionSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name} ({set.question_count} kysymystä)
            </option>
          ))}
        </select>
        <Button onClick={onRefreshSets} variant="outline" size="sm" disabled={loadingQuestionSets}>
          {loadingQuestionSets ? (
            <CircleNotch className="w-4 h-4 animate-spin" />
          ) : (
            'Päivitä'
          )}
        </Button>
      </div>

      {/* Type Filter Badges */}
      {selectedQuestionSetId && questions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suodatin:</span>
          {typeFilters.map((filter) => {
            const isActive = filterQuestionType === filter.value;
            const count =
              filter.value === 'all'
                ? questions.length
                : questions.filter((q) => q.question_type === filter.value).length;

            return (
              <button
                key={filter.value}
                onClick={() => setFilterQuestionType(filter.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                {filter.icon}
                {filter.label}
                <span className="ml-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loadingQuestions && (
        <div className="flex justify-center py-12">
          <CircleNotch className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Empty State - No Selection */}
      {!selectedQuestionSetId && !loadingQuestions && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Valitse kysymyssarja yllä olevasta valikosta.</p>
        </div>
      )}

      {/* Empty State - No Questions */}
      {selectedQuestionSetId && !loadingQuestions && questions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Ei kysymyksiä tässä sarjassa.</p>
        </div>
      )}

      {/* Question Cards */}
      {selectedQuestionSetId && !loadingQuestions && questions.length > 0 && (
        <div className="space-y-3">
          {getFilteredQuestions().map((question, index) => {
            const typeInfo = getQuestionTypeInfo(question.question_type);
            return (
              <div
                key={question.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors bg-white dark:bg-gray-900"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {typeInfo.icon}
                        {typeInfo.label}
                      </span>
                      {question.topic && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          • {question.topic}
                        </span>
                      )}
                      {(question.requires_visual || question.image_reference) && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-400">Kuva</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                      {formatMathSummary(question.question_text)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 ml-3 gap-2">
                  <Button
                    onClick={() => handleTestQuestion(question)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" weight="duotone" />
                    Testaa
                  </Button>
                  {isAdmin && (
                    <>
                      <Button
                        onClick={() => openQuestionEdit(question)}
                        variant="outline"
                        size="sm"
                      >
                        <PencilSimple className="w-4 h-4 mr-1" weight="duotone" />
                        Muokkaa
                      </Button>
                      <Button
                        onClick={() => handleDeleteQuestion(question)}
                        variant="outline"
                        size="sm"
                        disabled={deletingQuestionId === question.id}
                      >
                        {deletingQuestionId === question.id ? (
                          <CircleNotch className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Trash className="w-4 h-4 mr-1" weight="duotone" />
                        )}
                        Poista
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test Modal */}
      <Dialog.Root open={Boolean(testingQuestion)} onOpenChange={(open) => !open && handleCloseModal()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Testaa kysymystä
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Sulje"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {testingQuestion && (
                <div className="space-y-6">
                  {/* Question Metadata */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                      {getQuestionTypeInfo(testingQuestion.question_type).icon}
                      {getQuestionTypeInfo(testingQuestion.question_type).label}
                    </span>
                    {testingQuestion.topic && (
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {testingQuestion.topic}
                      </span>
                    )}
                    {testingQuestion.subtopic && (
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                        {testingQuestion.subtopic}
                      </span>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-5">
                    <div className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
                      <MathText>{testingQuestion.question_text}</MathText>
                    </div>
                  </div>

                  {/* Question Renderer */}
                  {(testingQuestion.requires_visual || testingQuestion.image_reference) && (
                    <VisualQuestionPreview
                      imageUrl={testingQuestion.image_url}
                      altText="Kysymyksen visuaali"
                      className="mb-4"
                    />
                  )}
                  <QuestionRenderer
                    question={testingQuestion}
                    userAnswer={userAnswer}
                    showExplanation={showExplanation}
                    onAnswerChange={setUserAnswer}
                  />
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Button
                onClick={() => {
                  setUserAnswer(null);
                  setShowExplanation(true);
                }}
                variant="outline"
              >
                Tyhjennä vastaus
              </Button>
              <div className="flex gap-3">
                <Button onClick={handleCloseModal}>Sulje</Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={Boolean(editingQuestion)} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Muokkaa kysymystä
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-gray-400 hover:text-slate-600 dark:hover:text-gray-300"
                  aria-label="Sulje"
                >
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            {editingQuestion && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Kysymysteksti
                  </label>
                  <Textarea
                    value={editQuestionText}
                    onChange={(event) => setEditQuestionText(event.target.value)}
                    className="min-h-[90px]"
                  />
                </div>

                {editingQuestion.question_type === 'multiple_choice' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Oikea vastaus
                      </label>
                      <Input value={editCorrectAnswer} onChange={(event) => setEditCorrectAnswer(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Vaihtoehdot (yksi per rivi)
                      </label>
                      <Textarea value={editOptions} onChange={(event) => setEditOptions(event.target.value)} className="min-h-[90px]" />
                    </div>
                  </>
                )}

                {editingQuestion.question_type === 'multiple_select' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Oikeat vastaukset (2–3, yksi per rivi)
                      </label>
                      <Textarea value={editCorrectAnswer} onChange={(event) => setEditCorrectAnswer(event.target.value)} className="min-h-[70px]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Vaihtoehdot (tasan 5, yksi per rivi)
                      </label>
                      <Textarea value={editOptions} onChange={(event) => setEditOptions(event.target.value)} className="min-h-[110px]" />
                    </div>
                  </>
                )}

                {(editingQuestion.question_type === 'fill_blank' || editingQuestion.question_type === 'short_answer') && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Oikea vastaus
                      </label>
                      <Input value={editCorrectAnswer} onChange={(event) => setEditCorrectAnswer(event.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Hyväksyttävät vastaukset (valinnainen, yksi per rivi)
                      </label>
                      <Textarea value={editAcceptableAnswers} onChange={(event) => setEditAcceptableAnswers(event.target.value)} className="min-h-[70px]" />
                    </div>
                  </>
                )}

                {editingQuestion.question_type === 'flashcard' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Oikea vastaus
                    </label>
                    <Input value={editCorrectAnswer} onChange={(event) => setEditCorrectAnswer(event.target.value)} />
                  </div>
                )}

                {editingQuestion.question_type === 'true_false' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Oikea vastaus
                    </label>
                    <select
                      value={editTrueFalse}
                      onChange={(event) => setEditTrueFalse(event.target.value as 'true' | 'false')}
                      className="w-full h-10 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="true">Totta</option>
                      <option value="false">Tarua</option>
                    </select>
                  </div>
                )}

                {editingQuestion.question_type === 'matching' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Parit (vasen → oikea)
                    </label>
                    <div className="space-y-2">
                      {editMatchingPairs.map((pair, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            value={pair.left}
                            onChange={(e) => {
                              const next = [...editMatchingPairs];
                              next[idx] = { ...next[idx], left: e.target.value };
                              setEditMatchingPairs(next);
                            }}
                            placeholder="Vasen"
                            className="flex-1"
                          />
                          <span className="text-slate-400 text-sm shrink-0">→</span>
                          <Input
                            value={pair.right}
                            onChange={(e) => {
                              const next = [...editMatchingPairs];
                              next[idx] = { ...next[idx], right: e.target.value };
                              setEditMatchingPairs(next);
                            }}
                            placeholder="Oikea"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setEditMatchingPairs((prev) => prev.filter((_, i) => i !== idx))}
                            disabled={editMatchingPairs.length <= 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 p-1 shrink-0"
                            aria-label="Poista pari"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditMatchingPairs((prev) => [...prev, { left: '', right: '' }])}
                      className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <Plus size={12} /> Lisää pari
                    </button>
                  </div>
                )}

                {editingQuestion.question_type === 'sequential' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Oikea järjestys (ylhäältä alas)
                    </label>
                    <div className="space-y-2">
                      {editSequentialItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 w-5 text-right shrink-0 tabular-nums">{idx + 1}.</span>
                          <Input
                            value={item}
                            onChange={(e) => {
                              const next = [...editSequentialItems];
                              next[idx] = e.target.value;
                              setEditSequentialItems(next);
                            }}
                            className="flex-1"
                          />
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const next = [...editSequentialItems];
                                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                setEditSequentialItems(next);
                              }}
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-30 p-0.5"
                              aria-label="Siirrä ylös"
                            >
                              <CaretUp size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === editSequentialItems.length - 1}
                              onClick={() => {
                                const next = [...editSequentialItems];
                                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                                setEditSequentialItems(next);
                              }}
                              className="text-slate-400 hover:text-slate-600 disabled:opacity-30 p-0.5"
                              aria-label="Siirrä alas"
                            >
                              <CaretDown size={12} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditSequentialItems((prev) => prev.filter((_, i) => i !== idx))}
                            disabled={editSequentialItems.length <= 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 p-1 shrink-0"
                            aria-label="Poista kohde"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditSequentialItems((prev) => [...prev, ''])}
                      className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <Plus size={12} /> Lisää kohde
                    </button>
                  </div>
                )}

                {validationCoverage && (
                  <div className="rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-900 dark:text-blue-100 space-y-2">
                    <div className="font-semibold">Vastauksen validointikattavuus</div>
                    <div className="flex flex-wrap gap-2">
                      {validationCoverage.supports.map((supportType) => (
                        <Badge key={supportType} semantic="info" size="sm">
                          {supportType}
                        </Badge>
                      ))}
                    </div>
                    {smartAlternatives.length > 0 && (
                      <p>Hyväksytään myös: {smartAlternatives.join(', ')}</p>
                    )}
                  </div>
                )}

                {editError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setEditingQuestion(null)} disabled={savingEdit}>
                    Peruuta
                  </Button>
                  <Button onClick={handleSaveQuestionEdit} disabled={savingEdit}>
                    {savingEdit ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Tallenna
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
