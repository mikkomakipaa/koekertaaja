'use client';

import { useState, useEffect } from 'react';
import { QuestionSet, Question, QuestionType } from '@/types';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { Button } from '@/components/ui/button';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
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
} from '@phosphor-icons/react';

interface TestQuestionsTabProps {
  allQuestionSets: QuestionSet[];
  loadingQuestionSets: boolean;
  onRefreshSets: () => Promise<void>;
}

const logger = createLogger({ module: 'TestQuestionsTab' });

export function TestQuestionsTab({
  allQuestionSets,
  loadingQuestionSets,
  onRefreshSets,
}: TestQuestionsTabProps) {
  // State
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [filterQuestionType, setFilterQuestionType] = useState<QuestionType | 'all'>('all');
  const [testingQuestion, setTestingQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Type filters configuration
  const typeFilters: Array<{ value: QuestionType | 'all'; label: string; icon: React.ReactElement }> = [
    { value: 'all', label: 'Kaikki', icon: <ListBullets size={14} weight="duotone" /> },
    { value: 'multiple_choice', label: 'Monivalinta', icon: <ListChecks size={14} weight="duotone" /> },
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
    setShowExplanation(false);
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setTestingQuestion(null);
    setUserAnswer(null);
    setShowExplanation(false);
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
      true_false: { label: 'Totta vai tarua', icon: <CheckCircle size={14} weight="duotone" /> },
      matching: { label: 'Yhdistä parit', icon: <Shuffle size={14} weight="duotone" /> },
      short_answer: { label: 'Lyhyt vastaus', icon: <ChatText size={14} weight="duotone" /> },
      sequential: { label: 'Järjestä oikein', icon: <ListNumbers size={14} weight="duotone" /> },
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
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {question.question_text}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleTestQuestion(question)}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 ml-3"
                >
                  <Eye className="w-4 h-4 mr-1" weight="duotone" />
                  Testaa
                </Button>
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

                  {/* Question Renderer */}
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
                  setShowExplanation(false);
                }}
                variant="outline"
              >
                Tyhjennä vastaus
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowExplanation(!showExplanation)}
                  variant="outline"
                >
                  {showExplanation ? 'Piilota selitys' : 'Näytä selitys'}
                </Button>
                <Button onClick={handleCloseModal}>Sulje</Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
