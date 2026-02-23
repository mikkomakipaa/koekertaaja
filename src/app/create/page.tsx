'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/layout/PageHeader';
import { ARIATabBar, type Tab } from '@/components/layout/ARIATabBar';
import { TopicConfirmationDialog } from '@/components/create/TopicConfirmationDialog';
import type { TopicAnalysisResult } from '@/lib/ai/topicIdentifier';
import { Textarea } from '@/components/ui/textarea';
import { GradeSelector } from '@/components/create/GradeSelector';
import { MaterialUpload } from '@/components/create/MaterialUpload';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import { getGradeBadgeClasses } from '@/lib/utils/grade-colors';
import { cn } from '@/lib/utils';
import {
  analyzeValidationCoverage,
  getAlternativeRepresentations,
} from '@/lib/utils/smartAnswerValidation';
import { Difficulty, QuestionSet } from '@/types';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CircleNotch,
  Trash,
  ListBullets,
  Plus,
  BookOpenText,
  ClipboardText,
  Cards,
  ChartBar,
  ListNumbers,
  Package,
  PlusCircle,
  GraduationCap,
  CheckCircle,
  Eye,
  EyeSlash,
  Flag,
  PencilSimple,
  X,
  Cpu,
  SignOut,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreationProgressStepper } from '@/components/create/CreationProgressStepper';
import { TestQuestionsTab } from '@/components/create/TestQuestionsTab';
import { CapacityWarningDialog } from '@/components/create/CapacityWarningDialog';
import { MetricsTab } from '@/components/metrics/MetricsTab';
import { useAuth } from '@/hooks/useAuth';
import { createLogger } from '@/lib/logger';
import { SUBJECT_GROUPS, getSubjectById, subjectRequiresGrade } from '@/config/subjects';
import type { MaterialCapacity, QuestionCountValidation } from '@/lib/utils/materialAnalysis';

type CreateState = 'form' | 'loading' | 'success';
type ProviderPreference = 'anthropic' | 'openai';

type CreationStep = {
  id: 'topics' | 'quiz-helppo' | 'quiz-normaali' | 'flashcard';
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  metadata?: {
    count?: number;
    message?: string;
    topics?: string[];
  };
};

interface QuestionSetWithDistribution extends QuestionSet {
  type_distribution?: Record<string, number>;
  topic_distribution?: Record<string, number>;
}

interface QuestionGenerationResponse {
  success: boolean;
  partial?: boolean;
  message: string;
  questionSets: Array<{
    code: string;
    name: string;
    difficulty: string;
    mode: 'quiz' | 'flashcard';
    questionCount: number;
  }>;
  failures?: Array<{
    mode: 'quiz' | 'flashcard';
    difficulty?: string;
    error: string;
    errorType?: 'generation' | 'validation' | 'timeout' | 'database';
  }>;
  totalQuestions: number;
  stats?: {
    requested: number;
    succeeded: number;
    failed: number;
  };
}

interface CapacityWarningState {
  capacity: MaterialCapacity;
  validation: QuestionCountValidation;
  requestedCount: number;
}

interface FlaggedQuestion {
  questionId: string;
  questionSetId: string;
  questionText: string;
  questionType: string;
  correctAnswer: any;
  options: any;
  questionSetName: string | null;
  questionSetCode: string | null;
  subject: string | null;
  flagCount: number;
  latestFlagAt: string | null;
  latestNote?: string | null;
  reasonCounts: Record<'wrong_answer' | 'ambiguous' | 'typo' | 'other', number>;
}

const logger = createLogger({ module: 'create.page' });

export default function CreatePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const subjectTypeOptions: Array<{ value: SubjectType; label: string }> = [
    {
      value: 'language',
      label: 'Kielet',
    },
    {
      value: 'written',
      label: 'Teoria-aineet',
    },
    {
      value: 'geography',
      label: 'Maantieto',
    },
    {
      value: 'math',
      label: 'Matematiikka',
    },
    {
      value: 'skills',
      label: 'Taidot',
    },
    {
      value: 'concepts',
      label: 'Käsitteet',
    },
  ];
  const defaultQuestionCounts = {
    min: 20,
    max: 200,
    default: 50,
  };
  const providerOptions: Array<{ value: ProviderPreference; label: string; description: string }> = [
    {
      value: 'anthropic',
      label: 'Claude',
      description: 'Käyttää valmiiksi määriteltyjä Claude-malleja tehtäväkohtaisesti.',
    },
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'Käyttää valmiiksi määriteltyjä OpenAI-malleja tehtäväkohtaisesti.',
    },
  ];

  // Form state
  const [state, setState] = useState<CreateState>('form');
  const [activeTab, setActiveTab] = useState<'create' | 'extend' | 'manage' | 'test-questions' | 'notifications' | 'metrics'>('create');
  const [subject, setSubject] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType | ''>('');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [examLength, setExamLength] = useState(15);
  const [questionCount, setQuestionCount] = useState(defaultQuestionCounts.default);
  const [questionSetName, setQuestionSetName] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [generationMode, setGenerationMode] = useState<'quiz' | 'flashcard' | 'both'>('quiz');
  const [targetWords, setTargetWords] = useState('');
  const [contentType, setContentType] = useState<'vocabulary' | 'grammar' | 'mixed'>('vocabulary');
  const [providerPreference, setProviderPreference] = useState<ProviderPreference>('anthropic');
  const [error, setError] = useState('');
  const [capacityWarning, setCapacityWarning] = useState<CapacityWarningState | null>(null);
  const [topicConfirmation, setTopicConfirmation] = useState<{
    analysis: TopicAnalysisResult;
    requestedCount: number;
  } | null>(null);

  // Creation progress state
  const [creationSteps, setCreationSteps] = useState<CreationStep[]>([]);

  // Success state
  const [questionSetsCreated, setQuestionSetsCreated] = useState<any[]>([]);
  const [totalQuestionsCreated, setTotalQuestionsCreated] = useState(0);

  // All question sets state
  const [allQuestionSets, setAllQuestionSets] = useState<QuestionSetWithDistribution[]>([]);
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [expandedTopicSets, setExpandedTopicSets] = useState<Set<string>>(new Set());
  const [deletingTopic, setDeletingTopic] = useState<{ setId: string; topic: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<FlaggedQuestion[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [flagLoadError, setFlagLoadError] = useState('');
  const [editingFlag, setEditingFlag] = useState<FlaggedQuestion | null>(null);
  const [dismissingFlagId, setDismissingFlagId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editOptions, setEditOptions] = useState('');
  const [editAcceptableAnswers, setEditAcceptableAnswers] = useState('');
  const [editTrueFalse, setEditTrueFalse] = useState<'true' | 'false'>('true');
  const [editMatchingPairs, setEditMatchingPairs] = useState<Array<{ left: string; right: string }>>([]);
  const [editSequentialItems, setEditSequentialItems] = useState<string[]>([]);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Extend existing set state
  const [selectedSetToExtend, setSelectedSetToExtend] = useState<string>('');
  const [questionsToAdd, setQuestionsToAdd] = useState(20);

  const minQuestionCount = defaultQuestionCounts.min;
  const maxQuestionCount = defaultQuestionCounts.max;
  const defaultQuestionCount = defaultQuestionCounts.default;
  const requiresGrade = subject ? subjectRequiresGrade(subject) : false;
  const selectedSubjectTypeOption = subjectTypeOptions.find(
    (option) => option.value === subjectType
  );
  const hasSubject = Boolean(subject.trim());
  const hasSubjectType = Boolean(subjectType);
  const hasRequiredGrade = !requiresGrade || Boolean(grade);
  const hasMaterials = materialText.trim().length > 0 || uploadedFiles.length > 0;
  const selectedProviderLabel =
    providerOptions.find((option) => option.value === providerPreference)?.label ?? 'Claude';

  const formatListForEdit = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).join('\n');
    }
    return '';
  };

  const parseListInput = (value: string): string[] => {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const parts = trimmed.includes('\n') ? trimmed.split('\n') : trimmed.split(',');
    return parts.map((item) => item.trim()).filter(Boolean);
  };

  const parseJsonInput = (value: string) => {
    if (!value.trim()) return null;
    return JSON.parse(value);
  };

  const focusMaterialInput = () => {
    setTimeout(() => {
      const materialTextarea = document.querySelector<HTMLTextAreaElement>(
        'textarea[placeholder^="Esim. kirjoita materiaali"]'
      );
      materialTextarea?.focus();
      materialTextarea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const buildGenerationFormData = (options?: {
    questionCountOverride?: number;
    bypassCapacityCheck?: boolean;
    capacityCheckOnly?: boolean;
    identifiedTopics?: string[];
    topicDistribution?: Array<{
      topic: string;
      targetCount: number;
      coverage: number;
      keywords: string[];
      subtopics: string[];
      difficulty: string;
      importance: string;
    }>;
  }) => {
    const formData = new FormData();
    const requestedQuestionCount = options?.questionCountOverride ?? questionCount;

    formData.append('subject', subject);
    formData.append('questionCount', requestedQuestionCount.toString());
    formData.append('examLength', examLength.toString());
    formData.append('questionSetName', questionSetName);
    if (grade) {
      formData.append('grade', grade.toString());
    }

    formData.append('subjectType', subjectType);
    formData.append('generationMode', generationMode);
    formData.append('provider', providerPreference);

    if (generationMode === 'flashcard' || generationMode === 'both') {
      formData.append('contentType', contentType);
    }

    if (materialText.trim()) {
      formData.append('materialText', materialText);
    }

    if (targetWords.trim()) {
      formData.append('targetWords', targetWords);
    }

    if (options?.identifiedTopics && options.identifiedTopics.length > 0) {
      formData.append('identifiedTopics', JSON.stringify(options.identifiedTopics));
    }

    if (options?.topicDistribution && options.topicDistribution.length > 0) {
      formData.append('distribution', JSON.stringify(options.topicDistribution));
    }

    if (options?.bypassCapacityCheck) {
      formData.append('bypassCapacityCheck', 'true');
    }

    if (options?.capacityCheckOnly) {
      formData.append('capacityCheckOnly', 'true');
    }

    uploadedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    return formData;
  };

  // Helper functions for creation progress
  const initializeCreationSteps = (): CreationStep[] => {
    const steps: CreationStep[] = [
      {
        id: 'topics',
        label: 'Tunnista aihealueet',
        status: 'pending',
      },
    ];

    if (generationMode === 'quiz' || generationMode === 'both') {
      steps.push(
        {
          id: 'quiz-helppo',
          label: 'Koe: Helppo',
          status: 'pending',
        },
        {
          id: 'quiz-normaali',
          label: 'Koe: Normaali',
          status: 'pending',
        }
      );
    }

    if (generationMode === 'flashcard' || generationMode === 'both') {
      steps.push({
        id: 'flashcard',
        label: 'Muistikortit',
        status: 'pending',
      });
    }

    return steps;
  };

  const updateCreationStep = (
    stepId: string,
    status: CreationStep['status'],
    metadata?: CreationStep['metadata']
  ) => {
    setCreationSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, metadata: { ...step.metadata, ...metadata } } : step
      )
    );
  };

  // Handler for topic confirmation dialog
  const handleTopicConfirmation = (
    totalQuestions: number,
    topicDistribution: Array<{ topic: string; count: number }>
  ) => {
    // Close dialog
    setTopicConfirmation(null);

    // Store confirmed distribution in state for use by generation
    setQuestionCount(totalQuestions);

    // Build TopicDistribution format from user's adjusted counts
    const distribution = topicConfirmation?.analysis.topics.map((topic, index) => {
      const userCount = topicDistribution.find(d => d.topic === topic.name)?.count || 0;
      return {
        topic: topic.name,
        targetCount: userCount,
        coverage: topic.coverage,
        keywords: topic.keywords,
        subtopics: topic.subtopics,
        difficulty: topic.difficulty,
        importance: topic.importance,
      };
    }) || [];

    // Proceed with generation, bypassing topic confirmation
    void handleSubmit({
      bypassCapacityCheck: true,
      questionCountOverride: totalQuestions,
      bypassTopicConfirmation: true,
      confirmedTopics: topicDistribution.map(d => d.topic),
      topicDistribution: distribution,
    });
  };

  const handleSubmit = async (options?: {
    bypassCapacityCheck?: boolean;
    questionCountOverride?: number;
    bypassTopicConfirmation?: boolean;
    confirmedTopics?: string[];
    topicDistribution?: Array<{
      topic: string;
      targetCount: number;
      coverage: number;
      keywords: string[];
      subtopics: string[];
      difficulty: string;
      importance: string;
    }>;
  }) => {
    const requestedQuestionCount = options?.questionCountOverride ?? questionCount;

    // Validation
    if (!questionSetName.trim()) {
      setError('Anna kysymyssarjalle nimi!');
      return;
    }

    if (!subject.trim()) {
      setError('Valitse aine!');
      return;
    }

    if (!subjectType) {
      setError('Valitse aineen tyyppi!');
      return;
    }

    if (requiresGrade && !grade) {
      setError('Valitse luokka-aste!');
      return;
    }

    if (!materialText.trim() && uploadedFiles.length === 0) {
      setError('Syötä materiaali tai lataa tiedosto!');
      return;
    }

    // Note: Old word-based capacity check removed - now using intelligent topic-based confirmation
    setError('');
    setCapacityWarning(null);
    setState('loading');
    setCreationSteps(initializeCreationSteps());

    try {
      // Track results across separate API calls
      const results: {
        quizSets: Array<{ code: string; name: string; difficulty: string; mode: 'quiz' | 'flashcard'; questionCount: number }>;
        flashcardSet: { code: string; name: string; mode: 'quiz' | 'flashcard'; questionCount: number } | null;
        errors: Array<{ mode: 'quiz' | 'flashcard'; error: string }>;
      } = { quizSets: [], flashcardSet: null, errors: [] };

      // Vaihe 1: Tunnista aihealueet (tai käytä vahvistettuja aihealueita)
      let topics: string[] = [];

      if (options?.confirmedTopics) {
        // Use already confirmed topics
        topics = options.confirmedTopics;
        updateCreationStep('topics', 'completed', {
          count: topics.length,
          message: `Käytetään ${topics.length} vahvistettua aihealuetta`,
          topics,
        });
      } else {
        // Identify topics from material
        updateCreationStep('topics', 'in_progress', { message: 'Analysoidaan materiaalia...' });
        let enhancedAnalysis: TopicAnalysisResult | null = null;

        try {
          const topicsResponse = await fetch('/api/identify-topics', {
            method: 'POST',
            body: buildGenerationFormData({
              questionCountOverride: requestedQuestionCount,
              bypassCapacityCheck: true,
            }),
          });
          if (topicsResponse.ok) {
            const topicsData = await topicsResponse.json();
            const rawTopics: unknown[] = Array.isArray(topicsData.topics) ? topicsData.topics : [];
            topics = rawTopics
              .filter((candidate: unknown): candidate is string => typeof candidate === 'string')
              .map((candidate) => candidate.trim())
              .filter(Boolean);

            // Extract enhanced analysis if available
            if (topicsData.enhanced) {
              enhancedAnalysis = topicsData.enhanced as TopicAnalysisResult;
            }

            if (topics.length === 0) {
              logger.warn('Topic identification returned zero topics');
              updateCreationStep('topics', 'error', {
                message: 'Ei aihealueita tunnistettu',
              });
              setState('form');
              setError('Materiaali oli liian lyhyt aihealueiden tunnistamiseen. Lisää materiaalia ja yritä uudelleen.');
              return;
            } else {
              updateCreationStep('topics', 'completed', {
                count: topics.length,
                message: `Tunnistettiin ${topics.length} aihealuetta`,
                topics,
              });

              // Show topic confirmation dialog if enhanced analysis available and not bypassing
              if (enhancedAnalysis && !options?.bypassTopicConfirmation) {
                setState('form'); // Return to form state to show dialog
                setTopicConfirmation({
                  analysis: enhancedAnalysis,
                  requestedCount: requestedQuestionCount,
                });
                return; // Exit handleSubmit - will continue in confirmation handler
              }
            }
          } else {
          let errorMessage = 'Aihealueiden tunnistus epäonnistui';
          try {
            const errorData = await topicsResponse.json();
            if (typeof errorData?.error === 'string' && errorData.error.trim()) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            logger.warn({ parseError }, 'Failed to parse topic identification error response');
          }
          updateCreationStep('topics', 'error', {
            message: errorMessage,
            topics: [],
          });
        }
        } catch (error) {
          logger.warn({ error }, 'Topic identification failed');
          updateCreationStep('topics', 'error', {
            message: 'Aihealueiden tunnistus epäonnistui',
            topics: [],
          });
        }
      }

      // Step 2: Generate quiz sets (if requested)
      if (generationMode === 'quiz' || generationMode === 'both') {
        updateCreationStep('quiz-helppo', 'in_progress', { message: 'Luodaan visaa...' });
        updateCreationStep('quiz-normaali', 'in_progress', { message: 'Luodaan visaa...' });
        try {
          const quizResponse = await fetch('/api/generate-questions/quiz', {
            method: 'POST',
            body: buildGenerationFormData({
              questionCountOverride: requestedQuestionCount,
              bypassCapacityCheck: true,
              identifiedTopics: topics,
              topicDistribution: options?.topicDistribution,
            }),
          });
          const quizData = await quizResponse.json();

          // Note: warningRequired check removed - using topic-based confirmation instead

          if (quizData.success && quizData.questionSets) {
            results.quizSets = quizData.questionSets;
            quizData.questionSets.forEach((set: { difficulty: string; questionCount: number }) => {
              const stepId = set.difficulty === 'helppo' ? 'quiz-helppo' : 'quiz-normaali';
              updateCreationStep(stepId, 'completed', {
                count: set.questionCount,
                message: `Luotiin ${set.questionCount} kysymystä`,
              });
            });
          } else {
            throw new Error(quizData.error || 'Visan luonti epäonnistui');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Visan luonti epäonnistui';
          results.errors.push({ mode: 'quiz', error: errorMessage });
          updateCreationStep('quiz-helppo', 'error', { message: errorMessage });
          updateCreationStep('quiz-normaali', 'error', { message: errorMessage });
        }
      }

      // Step 3: Generate flashcard set (if requested)
      if (generationMode === 'flashcard' || generationMode === 'both') {
        updateCreationStep('flashcard', 'in_progress', { message: 'Luodaan muistikortteja...' });
        try {
          const flashcardResponse = await fetch('/api/generate-questions/flashcard', {
            method: 'POST',
            body: buildGenerationFormData({
              questionCountOverride: requestedQuestionCount,
              bypassCapacityCheck: true,
              identifiedTopics: topics,
              topicDistribution: options?.topicDistribution,
            }),
          });
          const flashcardData = await flashcardResponse.json();

          // Note: warningRequired check removed - using topic-based confirmation instead

          if (flashcardData.success && flashcardData.questionSet) {
            results.flashcardSet = flashcardData.questionSet;
            updateCreationStep('flashcard', 'completed', {
              count: flashcardData.questionSet.questionCount,
              message: `Luotiin ${flashcardData.questionSet.questionCount} korttia`,
            });
          } else {
            throw new Error(flashcardData.error || 'Muistikorttien luonti epäonnistui');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Muistikorttien luonti epäonnistui';
          results.errors.push({ mode: 'flashcard', error: errorMessage });
          updateCreationStep('flashcard', 'error', { message: errorMessage });
        }
      }

      // Step 4: Handle overall result
      const allSets = [...results.quizSets, ...(results.flashcardSet ? [results.flashcardSet] : [])];
      if (allSets.length > 0) {
        // At least some sets created
        const totalQuestions = allSets.reduce((sum, set) => sum + set.questionCount, 0);
        if (results.errors.length === 0) {
          // Full success
          toast.success(`Luotiin ${allSets.length} kysymyssarjaa!`, { description: `Yhteensä ${totalQuestions} kysymystä`, duration: 5000 });
        } else {
          // Partial success
          const failureSummary = results.errors.map(e => `${e.mode === 'flashcard' ? 'Kortit' : 'Visa'}: Epäonnistui`).join('\n');
          toast.warning(`Luotiin ${allSets.length} sarjaa, ${results.errors.length} epäonnistui`, { description: failureSummary, duration: 8000 });
        }
        // Show success confirmation screen and wait for user confirmation
        setQuestionSetsCreated(allSets);
        setTotalQuestionsCreated(totalQuestions);
        setState('success');
      } else {
        // Total failure
        const errorDetails = results.errors.map(e => `${e.mode === 'flashcard' ? 'Kortit' : 'Visa'}: ${e.error}`).join('\n');
        toast.error('Kysymyssarjojen luonti epäonnistui', { description: errorDetails, duration: 10000 });
        setState('form');
      }
    } catch (err) {
      logger.error({ error: err }, 'Error generating questions');
      const errorMessage = err instanceof Error ? err.message : 'Kysymysten luonti epäonnistui';
      toast.error('Yhteysongelma', {
        description: errorMessage,
      });
      setState('form');
    }
  };

  /**
   * Handle full success - all question sets created
   */
  const handleFullSuccess = (data: QuestionGenerationResponse) => {
    const { questionSets, totalQuestions } = data;

    toast.success(`Luotiin ${questionSets.length} kysymyssarjaa!`, {
      description: `Yhteensä ${totalQuestions} kysymystä`,
    });

    // Log for analytics
    logger.info(
      {
        setsCreated: questionSets.length,
        totalQuestions,
      },
      'Question generation: full success'
    );
  };

  /**
   * Handle partial success - some sets created, some failed
   */
  const handlePartialSuccess = (data: QuestionGenerationResponse) => {
    const { questionSets, failures, stats } = data;

    // Build user-friendly failure summary
    const failureSummary = failures?.map(f => {
      const label = f.mode === 'flashcard'
        ? 'Kortit'
        : `Visa (${f.difficulty})`;

      // Simplify error message for user
      const errorType = f.errorType || 'generation';
      const userMessage = {
        timeout: 'Aikakatkö',
        validation: 'Validointi epäonnistui',
        database: 'Tallennus epäonnistui',
        generation: 'Luonti epäonnistui',
      }[errorType];

      return `${label}: ${userMessage}`;
    }).join('\n') || 'Osa sarjoista epäonnistui';

    // Show warning toast with details
    toast.warning(
      `Luotiin ${stats?.succeeded || questionSets.length} / ${stats?.requested || questionSets.length + (failures?.length || 0)} sarjaa`,
      {
        description: `${failureSummary}\n\nVoit yrittää epäonnistuneiden luomista uudestaan.`,
        duration: 8000, // Longer duration for partial success
      }
    );

    // Log for analytics
    logger.warn(
      {
        succeeded: stats?.succeeded,
        failed: stats?.failed,
        failures: failures?.map(f => ({ mode: f.mode, difficulty: f.difficulty, errorType: f.errorType })),
      },
      'Question generation: partial success'
    );
  };

  /**
   * Handle total failure - no sets created
   */
  const handleTotalFailure = (data: QuestionGenerationResponse) => {
    const { failures, message } = data;

    // Build detailed error message
    const errorDetails = failures?.map(f => {
      const label = f.mode === 'flashcard'
        ? 'Kortit'
        : `Visa (${f.difficulty})`;

      return `${label}: ${f.error}`;
    }).join('\n') || message;

    toast.error('Kysymyssarjojen luonti epäonnistui', {
      description: errorDetails,
      duration: 10000, // Longer duration for errors
    });

    // Log for debugging
    logger.error(
      { message, failures },
      'Question generation: total failure'
    );
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleConfirmAndReturnToCreate = () => {
    setQuestionSetsCreated([]);
    setTotalQuestionsCreated(0);
    setCreationSteps([]);
    setError('');
    setState('form');
    router.replace('/create');
  };

  const loadQuestionSets = async () => {
    setLoadingQuestionSets(true);
    try {
      const response = await fetch('/api/question-sets/created', {
        method: 'GET',
        credentials: 'same-origin',
      });
      const payload = await response.json();

      if (!response.ok) {
        const errorMessage = payload.error || 'Failed to load question sets';
        throw new Error(errorMessage);
      }

      setAllQuestionSets(payload.data || []);
    } catch (error) {
      logger.error({ error }, 'Error loading question sets');
    } finally {
      setLoadingQuestionSets(false);
    }
  };

  const loadFlaggedQuestions = async () => {
    if (!isAdmin) return;
    setLoadingFlags(true);
    setFlagLoadError('');

    try {
      const response = await fetch('/api/question-flags/manage', {
        method: 'GET',
        credentials: 'same-origin',
      });
      const payload = await response.json();

      if (!response.ok) {
        const errorMessage = payload.error || 'Failed to load flagged questions';
        throw new Error(errorMessage);
      }

      setFlaggedQuestions(payload.data || []);
    } catch (error) {
      logger.error({ error }, 'Error loading flagged questions');
      setFlagLoadError(error instanceof Error ? error.message : 'Failed to load flagged questions');
    } finally {
      setLoadingFlags(false);
    }
  };

  const openFlagEdit = (flag: FlaggedQuestion) => {
    setEditingFlag(flag);
    setEditError('');
    setEditQuestionText(flag.questionText || '');
    setEditCorrectAnswer('');
    setEditOptions('');
    setEditAcceptableAnswers('');
    setEditMatchingPairs([]);
    setEditSequentialItems([]);

    switch (flag.questionType) {
      case 'multiple_choice': {
        setEditCorrectAnswer(typeof flag.correctAnswer === 'string' ? flag.correctAnswer : '');
        setEditOptions(formatListForEdit(flag.options));
        break;
      }
      case 'multiple_select': {
        setEditCorrectAnswer(formatListForEdit(flag.correctAnswer));
        setEditOptions(formatListForEdit(flag.options));
        break;
      }
      case 'fill_blank': {
        setEditCorrectAnswer(typeof flag.correctAnswer === 'string' ? flag.correctAnswer : '');
        setEditAcceptableAnswers(formatListForEdit(flag.options));
        break;
      }
      case 'short_answer':
      case 'flashcard': {
        setEditCorrectAnswer(typeof flag.correctAnswer === 'string' ? flag.correctAnswer : '');
        setEditAcceptableAnswers(formatListForEdit(flag.options));
        break;
      }
      case 'true_false': {
        setEditTrueFalse(flag.correctAnswer ? 'true' : 'false');
        break;
      }
      case 'matching': {
        const rawPairs = Array.isArray(flag.correctAnswer) ? flag.correctAnswer : [];
        const pairs = rawPairs.map((p: any) => ({
          left: String(p?.left ?? ''),
          right: String(p?.right ?? ''),
        }));
        setEditMatchingPairs(pairs.length > 0 ? pairs : [{ left: '', right: '' }]);
        break;
      }
      case 'sequential': {
        const raw = flag.correctAnswer ?? { items: [], correct_order: [] };
        const items: any[] = raw.items ?? [];
        const correctOrder: number[] = raw.correct_order ?? [];
        let orderedItems: string[];
        if (correctOrder.length === items.length && correctOrder.length > 0) {
          orderedItems = correctOrder.map((idx) => {
            const item = items[idx];
            return typeof item === 'string' ? item : (item?.text ?? '');
          });
        } else {
          orderedItems = items.map((item) => (typeof item === 'string' ? item : (item?.text ?? '')));
        }
        setEditSequentialItems(orderedItems.length > 0 ? orderedItems : ['']);
        break;
      }
      case 'map': {
        if (typeof flag.correctAnswer === 'string') {
          setEditCorrectAnswer(flag.correctAnswer);
        } else {
          setEditCorrectAnswer(JSON.stringify(flag.correctAnswer ?? [], null, 2));
        }
        setEditOptions(flag.options ? JSON.stringify(flag.options, null, 2) : '');
        break;
      }
      default: {
        setEditCorrectAnswer(JSON.stringify(flag.correctAnswer ?? '', null, 2));
      }
    }
  };

  const handleSaveFlagEdit = async () => {
    if (!editingFlag) return;
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

      switch (editingFlag.questionType) {
        case 'multiple_choice': {
          const options = parseListInput(editOptions);
          if (!editCorrectAnswer.trim()) {
            failEdit('Anna oikea vastaus.');
            return;
          }
          if (options.length < 2) {
            failEdit('Anna vähintään kaksi vaihtoehtoa.');
            return;
          }
          payload = {
            ...payload,
            correctAnswer: editCorrectAnswer.trim(),
            options,
          };
          break;
        }
        case 'multiple_select': {
          const options = parseListInput(editOptions);
          const correctAnswers = parseListInput(editCorrectAnswer);

          if (options.length !== 5) {
            failEdit('Anna tasan 5 vaihtoehtoa.');
            return;
          }
          if (correctAnswers.length < 2 || correctAnswers.length > 3) {
            failEdit('Anna 2-3 oikeaa vastausta.');
            return;
          }
          if (!correctAnswers.every((answer) => options.includes(answer))) {
            failEdit('Kaikkien oikeiden vastausten pitää löytyä vaihtoehdoista.');
            return;
          }

          payload = {
            ...payload,
            correctAnswer: correctAnswers,
            options,
          };
          break;
        }
        case 'fill_blank':
        case 'short_answer':
        case 'flashcard': {
          if (!editCorrectAnswer.trim()) {
            failEdit('Anna oikea vastaus.');
            return;
          }
          const acceptableAnswers = parseListInput(editAcceptableAnswers);
          payload = {
            ...payload,
            correctAnswer: editCorrectAnswer.trim(),
            acceptableAnswers: acceptableAnswers.length > 0 ? acceptableAnswers : undefined,
          };
          break;
        }
        case 'true_false': {
          payload = {
            ...payload,
            correctAnswer: editTrueFalse === 'true',
          };
          break;
        }
        case 'matching': {
          const validPairs = editMatchingPairs.filter((p) => p.left.trim() && p.right.trim());
          if (validPairs.length === 0) {
            failEdit('Anna vähintään yksi pari.');
            return;
          }
          payload = {
            ...payload,
            correctAnswer: validPairs.map((p) => ({ left: p.left.trim(), right: p.right.trim() })),
          };
          break;
        }
        case 'sequential': {
          const validItems = editSequentialItems.filter((i) => i.trim());
          if (validItems.length === 0) {
            failEdit('Anna vähintään yksi järjestettävä kohde.');
            return;
          }
          payload = {
            ...payload,
            correctAnswer: {
              items: validItems.map((i) => i.trim()),
              correct_order: validItems.map((_, idx) => idx),
            },
          };
          break;
        }
        case 'map': {
          let parsedCorrectAnswer: any = editCorrectAnswer.trim();
          if (!parsedCorrectAnswer) {
            failEdit('Anna oikea vastaus.');
            return;
          }

          if (parsedCorrectAnswer.startsWith('[') || parsedCorrectAnswer.startsWith('{')) {
            try {
              parsedCorrectAnswer = parseJsonInput(parsedCorrectAnswer);
            } catch (error) {
              failEdit('Virheellinen JSON oikeassa vastauksessa.');
              return;
            }
          }

          let parsedOptions: any = undefined;
          if (editOptions.trim()) {
            try {
              parsedOptions = parseJsonInput(editOptions);
            } catch (error) {
              failEdit('Virheellinen JSON vaihtoehdoissa.');
              return;
            }
          }

          payload = {
            ...payload,
            correctAnswer: parsedCorrectAnswer,
            options: parsedOptions,
          };
          break;
        }
        default: {
          payload = {
            ...payload,
            correctAnswer: editCorrectAnswer.trim(),
          };
        }
      }

      const response = await fetch(`/api/questions/${editingFlag.questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Tallennus epäonnistui';
        throw new Error(errorMessage);
      }

      setFlaggedQuestions((prev) =>
        prev.map((item) =>
          item.questionId === editingFlag.questionId
            ? {
                ...item,
                questionText: payload.questionText,
                correctAnswer: payload.correctAnswer,
                options: payload.options ?? item.options,
              }
            : item
        )
      );

      setEditingFlag(null);
    } catch (error) {
      logger.error({ error }, 'Failed to save question edit');
      setEditError(error instanceof Error ? error.message : 'Tallennus epäonnistui');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDismissFlag = async (flag: FlaggedQuestion) => {
    if (!isAdmin) return;
    setDismissingFlagId(flag.questionId);
    setFlagLoadError('');

    try {
      const response = await fetch('/api/question-flags/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: flag.questionId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        const errorMessage = payload.error || 'Ilmoituksen poistaminen epäonnistui';
        throw new Error(errorMessage);
      }

      setFlaggedQuestions((prev) => prev.filter((item) => item.questionId !== flag.questionId));
      if (editingFlag?.questionId === flag.questionId) {
        setEditingFlag(null);
      }
      toast.success('Ilmoitukset poistettu', {
        description: 'Tämä kysymys poistettiin ilmoituksista.',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to dismiss flag');
      setFlagLoadError(error instanceof Error ? error.message : 'Ilmoituksen poistaminen epäonnistui');
    } finally {
      setDismissingFlagId(null);
    }
  };


  const checkAdminStatus = async () => {
    try {
      // Make a test call to the publish endpoint to check if user is admin
      const response = await fetch('/api/question-sets/publish', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionSetId: '00000000-0000-0000-0000-000000000000', status: 'published' }),
      });

      // If we get 403, user is authenticated but not admin
      // If we get 401, user is not authenticated
      // If we get 400 or 404, user is admin (validation or not found error)
      setIsAdmin(response.status === 400 || response.status === 404);
    } catch (error) {
      logger.error({ error }, 'Error checking admin status');
      setIsAdmin(false);
    }
  };

  const handlePublishToggle = async (questionSetId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'created' : 'published';
    const action = newStatus === 'published' ? 'julkaista' : 'piilottaa';

    if (!confirm(`Haluatko varmasti ${action} tämän kysymyssarjan?`)) {
      return;
    }

    setPublishingId(questionSetId);
    try {
      const response = await fetch('/api/question-sets/publish', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionSetId, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to update question set status';
        throw new Error(errorMsg);
      }

      // Refresh the list to show updated status
      await loadQuestionSets();
    } catch (error) {
      logger.error({ error }, 'Error updating question set status');
      const errorMessage = error instanceof Error ? error.message : 'Kysymyssarjan tilan päivitys epäonnistui';
      alert(`Virhe: ${errorMessage}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteQuestionSet = async (questionSetId: string) => {
    if (!confirm('Haluatko varmasti poistaa tämän kysymyssarjan? Kaikki kysymykset poistetaan pysyvästi.')) {
      return;
    }

    setDeletingId(questionSetId);
    try {
      const response = await fetch('/api/delete-question-set', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Ensure cookies are sent
        body: JSON.stringify({ questionSetId }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to delete question set';
        throw new Error(errorMsg);
      }

      // Refresh the list
      await loadQuestionSets();
    } catch (error) {
      logger.error({ error }, 'Error deleting question set');
      const errorMessage = error instanceof Error ? error.message : 'Kysymyssarjan poistaminen epäonnistui';
      alert(`Virhe: ${errorMessage}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteByTopic = async (
    setId: string,
    topicKey: string,
    topicLabel: string,
    count: number
  ) => {
    const topic = topicKey === '__null__' ? null : topicKey;
    if (!confirm(`Poistetaan ${count} kysymystä aiheesta "${topicLabel}". Tätä ei voi peruuttaa.`)) {
      return;
    }

    setDeletingTopic({ setId, topic });
    try {
      const response = await fetch('/api/questions/delete-by-topic', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ questionSetId: setId, topic }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Aiheen kysymysten poistaminen epäonnistui');
      }

      await loadQuestionSets();
    } catch (error) {
      logger.error({ error }, 'Error deleting questions by topic');
      const errorMessage = error instanceof Error ? error.message : 'Aiheen kysymysten poistaminen epäonnistui';
      alert(`Virhe: ${errorMessage}`);
    } finally {
      setDeletingTopic(null);
    }
  };

  const handleExtendSet = async () => {
    // Validation
    if (!selectedSetToExtend) {
      setError('Valitse laajennettava kysymyssarja!');
      return;
    }

    if (!materialText.trim() && uploadedFiles.length === 0) {
      setError('Syötä materiaali tai lataa tiedosto!');
      return;
    }

    setError('');
    setState('loading');

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('questionSetId', selectedSetToExtend);
      formData.append('questionsToAdd', questionsToAdd.toString());
      formData.append('provider', providerPreference);

      if (materialText.trim()) {
        formData.append('materialText', materialText);
      }

      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Call API
      const response = await fetch('/api/extend-question-set', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Kysymysten lisääminen epäonnistui';
        const errorDetails = data.details ? `\n\n${data.details}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      // Success
      setQuestionSetsCreated([data.questionSet]);
      setTotalQuestionsCreated(data.questionsAdded || 0);
      setState('success');
    } catch (err) {
      logger.error({ error: err }, 'Error extending question set');
      const errorMessage = err instanceof Error ? err.message : 'Kysymysten lisääminen epäonnistui';
      setError(errorMessage);
      setState('form');
    }
  };

  // Load question sets and check admin status when component mounts
  useEffect(() => {
    loadQuestionSets();
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadFlaggedQuestions();
    }
  }, [isAdmin]);

  useEffect(() => {
    setQuestionCount(defaultQuestionCount);
  }, [defaultQuestionCount]);

  useEffect(() => {
    if (!requiresGrade) {
      setGrade(undefined);
    }
  }, [requiresGrade]);

  useEffect(() => {
    const selectedSubject = getSubjectById(subject);

    if (generationMode === 'quiz' || !selectedSubject?.supportsGrammar) {
      setContentType('vocabulary');
      return;
    }

    if (selectedSubject.type === 'language' && contentType === 'vocabulary') {
      setContentType('grammar');
    }
  }, [generationMode, subject, contentType]);

  const validationCoverage = editingFlag
    ? analyzeValidationCoverage({
        questionType: editingFlag.questionType,
        subject: editingFlag.subject,
        correctAnswer:
          typeof editingFlag.correctAnswer === 'string'
            ? editCorrectAnswer || editingFlag.correctAnswer
            : editCorrectAnswer || undefined,
      })
    : null;

  const smartAlternatives =
    editingFlag &&
    ['multiple_choice', 'fill_blank', 'short_answer', 'flashcard'].includes(editingFlag.questionType)
      ? getAlternativeRepresentations(
          typeof editingFlag.correctAnswer === 'string'
            ? editCorrectAnswer || editingFlag.correctAnswer
            : editCorrectAnswer
        )
      : [];

  // Success screen
  if (state === 'success') {
    const difficultyLabels: Record<string, string> = {
      helppo: 'Helppo',
      normaali: 'Normaali',
    };

    const modeLabels: Record<string, string> = {
      quiz: 'Koe',
      flashcard: 'Kortit',
  };

  return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 flex items-center justify-center transition-colors">
        <Card className="max-w-3xl rounded-xl shadow-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white rounded-t-xl">
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle weight="duotone" className="w-8 h-8" />
              Kysymyssarjat luotu onnistuneesti!
            </CardTitle>
            <CardDescription className="text-white text-base md:text-lg font-medium">
              Luotiin {questionSetsCreated.length} kysymyssarjaa ({totalQuestionsCreated} kysymystä yhteensä)
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">Luodut kysymyssarjat:</h3>
              <div className="space-y-2">
                {questionSetsCreated.map((set, index) => (
                  <Card
                    key={index}
                    variant="standard"
                    padding="compact"
                    className="transition-shadow duration-150 hover:shadow-md"
                  >
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {set.mode === 'flashcard'
                              ? `${set.name} - ${modeLabels[set.mode]}`
                              : difficultyLabels[set.difficulty] || set.difficulty}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {set.questionCount} kysymystä
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Koodi:</p>
                          <code className="px-3 py-1 bg-slate-100 dark:bg-slate-600 rounded font-mono text-lg font-bold text-slate-900 dark:text-slate-100">
                            {set.code}
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleConfirmAndReturnToCreate}
                mode="quiz"
                variant="primary"
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                OK, takaisin luontiin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </AuthGuard>
    );
  }

  // Configure tabs
  const tabsConfig: Tab<typeof activeTab>[] = [
    { value: 'create', label: 'Luo uusi' },
    { value: 'extend', label: 'Laajenna' },
    { value: 'manage', label: 'Hallitse', badge: allQuestionSets.length },
    { value: 'test-questions', label: 'Testaa' },
    ...(isAdmin ? [
      { value: 'notifications' as const, label: 'Ilmoitukset', badge: flaggedQuestions.length, adminOnly: true },
      { value: 'metrics' as const, label: 'Metriikat', adminOnly: true },
    ] : [])
  ];

  // Form screen
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors">
          <PageHeader
            title="Kysymyssarjat"
            subtitle="Luo uusia kysymyssarjoja tai hallitse olemassa olevia"
            rightActions={(
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <SignOut weight="duotone" className="h-4 w-4" />
                Kirjaudu ulos
              </Button>
            )}
            className="px-5 pt-6 pb-4 sm:px-6 md:px-7"
          />
          <ARIATabBar
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={(value: typeof activeTab) => setActiveTab(value)}
            isAdmin={isAdmin}
            className="bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50"
          />
        </div>

        {/* Tab Content */}
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm md:p-8 transition-colors">
          {activeTab === 'create' && (
            <div
              id="question-form"
              className="space-y-6 text-slate-900 dark:text-slate-100"
            >
            <div>
              <label className="mb-3 block text-base font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <ListBullets weight="duotone" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Kysymyssarjan nimi
                </span>
              </label>
              <Input
                type="text"
                value={questionSetName}
                onChange={(e) => setQuestionSetName(e.target.value)}
                placeholder="Esim. Englanti 7. luokka - Kappale 3"
                className="text-base bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="mb-3 block text-base font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <BookOpenText weight="duotone" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Aine
                </span>
              </label>
              <select
                value={subject}
                onChange={(e) => {
                  const selectedSubjectId = e.target.value;
                  const selectedSubject = getSubjectById(selectedSubjectId);

                  setSubject(selectedSubjectId);

                  if (selectedSubject) {
                    setSubjectType(selectedSubject.type);
                    if (!selectedSubject.requiresGrade) {
                      setGrade(undefined);
                    }
                    return;
                  }

                  setSubjectType('');
                }}
                className="w-full rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 p-3 text-base"
              >
                <option value="">-- Valitse aine --</option>
                {SUBJECT_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.subjects.map((groupSubject) => (
                      <option key={groupSubject.id} value={groupSubject.id}>
                        {groupSubject.icon} {groupSubject.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {subject && (() => {
                const selectedSubject = getSubjectById(subject);
                return selectedSubject ? (
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedSubject.description}
                  </p>
                ) : null;
              })()}
              {subject && subjectType && (
                <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 p-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Aineen tyyppi:</span>{' '}
                  {selectedSubjectTypeOption?.label || subjectType}
                </div>
              )}
            </div>

            {requiresGrade && (
              <GradeSelector
                selectedGrade={grade}
                onGradeChange={setGrade}
                required
              />
            )}

            {/* Generation Mode Selector */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-5">
              <label className="mb-3 block text-base font-semibold text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <ClipboardText weight="duotone" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Mitä haluat luoda?
                </span>
                </label>
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <Cpu weight="duotone" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    AI-palvelu
                  </span>
                </label>
                <select
                  value={providerPreference}
                  onChange={(e) => setProviderPreference(e.target.value as ProviderPreference)}
                  className="w-full rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 p-3 text-sm"
                >
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {providerOptions.find((option) => option.value === providerPreference)?.description}
                </p>
              </div>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="radio"
                    name="generationMode"
                    value="quiz"
                    checked={generationMode === 'quiz'}
                    onChange={(e) => setGenerationMode(e.target.value as 'quiz')}
                    className="mt-1 h-5 w-5 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <BookOpenText weight="duotone" className="w-4 h-4" />
                      Koe (2 vaikeustasoa)
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Luo kaksi kysymyssarjaa: Helppo ja Normaali. Sopii kokeiden harjoitteluun.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="radio"
                    name="generationMode"
                    value="flashcard"
                    checked={generationMode === 'flashcard'}
                    onChange={(e) => setGenerationMode(e.target.value as 'flashcard')}
                    className="mt-1 w-5 h-5 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Cards weight="duotone" className="w-4 h-4" />
                      Kortit (vain 1 sarja)
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Luo yksi korttisarja oppimiseen. Sisältää avoimia kysymyksiä ja yksityiskohtaisia selityksiä.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="radio"
                    name="generationMode"
                    value="both"
                    checked={generationMode === 'both'}
                    onChange={(e) => setGenerationMode(e.target.value as 'both')}
                    className="mt-1 w-5 h-5 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <BookOpenText weight="duotone" className="w-4 h-4" />
                        <Plus className="w-3 h-3" />
                        <Cards weight="duotone" className="w-4 h-4" />
                      </span>
                      Molemmat (2 koetta + 1 korttisarja)
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Luo sekä koesarjat että korttisarja. Kattavin vaihtoehto monipuoliseen harjoitteluun.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Content Type Selector (language flashcards) */}
            {generationMode === 'flashcard' && subject && (() => {
              const selectedSubject = getSubjectById(subject);
              const isLanguageSubject = selectedSubject?.type === 'language';
              return selectedSubject?.supportsGrammar ? (
                <div className="border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 rounded-lg p-5">
                  <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <BookOpenText weight="duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Sisällön tyyppi
                    </span>
                  </label>

                  <div className="space-y-3">
                    {!isLanguageSubject && (
                      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="radio"
                          name="contentType"
                          value="vocabulary"
                          checked={contentType === 'vocabulary'}
                          onChange={() => setContentType('vocabulary')}
                          className="mt-1 w-4 h-4 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            Sanasto
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Sanojen käännökset, merkitykset, fraasit ja ilmaisut
                          </p>
                        </div>
                      </label>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="radio"
                        name="contentType"
                        value="grammar"
                        checked={contentType === 'grammar'}
                        onChange={() => setContentType('grammar')}
                        className="mt-1 w-4 h-4 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Kielioppi
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Kielioppisäännöt, verbitaivutus, lauserakenne, aikamuodot
                        </p>
                        <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700/50 rounded px-2 py-1 inline-block">
                          Materiaaliin tarvitaan sääntöjen selityksiä
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input
                        type="radio"
                        name="contentType"
                        value="mixed"
                        checked={contentType === 'mixed'}
                        onChange={() => setContentType('mixed')}
                        className="mt-1 w-4 h-4 border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Sekalainen
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Sekä sanastoa että kielioppia samassa materiaalissa
                        </p>
                      </div>
                    </label>
                  </div>

                  {isLanguageSubject && (
                    <Alert className="mt-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30">
                      <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
                        <strong>Kieliaineiden flashcardit ovat kielioppiin.</strong> Sanaston harjoitteluun käytä
                        quiz-muotoa, jossa monivalintatehtävät toimivat paremmin.
                      </AlertDescription>
                    </Alert>
                  )}

                  {contentType === 'grammar' && (
                    <Alert className="mt-4 border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/30">
                      <AlertDescription className="text-sm text-purple-900 dark:text-purple-100">
                        <strong>Kielioppimuistikortteja varten materiaalin täytyy sisältää:</strong>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                          <li>Sääntöjen selityksiä (esim. &quot;Miten muodostetaan...&quot;, &quot;Mikä on...&quot;)</li>
                          <li>Esimerkkejä säännöistä käytännössä</li>
                          <li>Vähintään 300 merkkiä tekstiä</li>
                        </ul>
                        <p className="mt-2 text-xs text-purple-800 dark:text-purple-200">
                          {isLanguageSubject
                            ? 'Jos materiaali sisältää vain sanalistoja, valitse quiz-muoto.'
                            : 'Jos materiaali sisältää vain sanalistoja, valitse "Sanasto".'}
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : null;
            })()}

            <div>
              <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">
                <span className="inline-flex items-center gap-2">
                  <ChartBar weight="duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Sarjan pituus (kysymystä per sarja)
                </span>
              </label>
              <div className="space-y-4">
                <Slider
                  min={5}
                  max={20}
                  step={1}
                  value={[examLength]}
                  onValueChange={(value) => setExamLength(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">5 kysymystä</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{examLength}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">20 kysymystä</span>
                </div>
              </div>
            </div>

            <MaterialUpload
              materialText={materialText}
              uploadedFiles={uploadedFiles}
              onMaterialTextChange={setMaterialText}
              onFilesChange={setUploadedFiles}
            />

            {/* Target Words Input (Language subjects only) */}
            {subjectType === 'language' && (
              <div>
                <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  <span className="inline-flex items-center gap-2">
                    <BookOpenText weight="duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Pakolliset sanat (valinnainen)
                  </span>
                </label>
                <Input
                  type="text"
                  placeholder="esim. omena, päärynä, banaani, kirsikka, mansikka"
                  value={targetWords}
                  onChange={(e) => setTargetWords(e.target.value)}
                  className="text-base"
                />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Anna pilkulla erotettu lista sanoista, jotka haluat sisällyttää kysymyksiin. AI varmistaa, että kaikki sanat tulevat käytettyä.
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => router.push('/')} variant="secondary" className="flex-1">
                Peruuta
              </Button>
              <Button
                onClick={() => {
                  void handleSubmit();
                }}
                mode="quiz"
                variant="primary"
                className="flex-1"
                disabled={!questionSetName.trim() || !hasSubject || !hasSubjectType || !hasRequiredGrade || !hasMaterials}
              >
                Luo kysymyssarjat
              </Button>
            </div>
            </div>
          )}

          {activeTab === 'extend' && (
            <div className="space-y-6">
              <div>
                  <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <Package weight="duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Valitse laajennettava kysymyssarja
                    </span>
                  </label>
                  <select
                    value={selectedSetToExtend}
                    onChange={(e) => setSelectedSetToExtend(e.target.value)}
                    className="w-full p-3 border rounded-lg text-slate-900 dark:text-slate-100 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="">-- Valitse kysymyssarja --</option>
                    {allQuestionSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.name} ({set.question_count} kysymystä) - {set.mode === 'flashcard' ? 'Kortit' : set.difficulty}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSetToExtend && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Valittu sarja:
                    </h3>
                    {(() => {
                      const selectedSet = allQuestionSets.find(s => s.id === selectedSetToExtend);
                      if (!selectedSet) return null;
                      return (
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                          <p><strong>Nimi:</strong> {selectedSet.name}</p>
                          <p><strong>Aine:</strong> {selectedSet.subject}</p>
                          <p><strong>Nykyinen määrä:</strong> {selectedSet.question_count} kysymystä</p>
                          <p><strong>Tyyppi:</strong> {selectedSet.mode === 'flashcard' ? 'Kortit' : `Koe (${selectedSet.difficulty})`}</p>
                          {selectedSet.grade && (
                            <p className="flex items-center gap-2">
                              <strong>Luokka:</strong>
                              <Badge
                                semantic="grade"
                                size="xs"
                                className={cn(getGradeBadgeClasses(selectedSet.grade))}
                              >
                                {selectedSet.grade}
                              </Badge>
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <Cpu weight="duotone" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      AI-palvelu
                    </span>
                  </label>
                  <select
                    value={providerPreference}
                    onChange={(e) => setProviderPreference(e.target.value as ProviderPreference)}
                    className="w-full rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 p-3 text-sm"
                  >
                    {providerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    {providerOptions.find((option) => option.value === providerPreference)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-base font-semibold mb-3 text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-2">
                      <PlusCircle weight="duotone" className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Lisättävien kysymysten määrä
                    </span>
                  </label>
                  <div className="space-y-4">
                    <Slider
                      min={5}
                      max={50}
                      step={5}
                      value={[questionsToAdd]}
                      onValueChange={(value) => setQuestionsToAdd(value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-400">5 kysymystä</span>
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{questionsToAdd}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">50 kysymystä</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Näin monta kysymystä lisätään sarjaan
                  </p>
                </div>

                <MaterialUpload
                  materialText={materialText}
                  uploadedFiles={uploadedFiles}
                  onMaterialTextChange={setMaterialText}
                  onFilesChange={setUploadedFiles}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={() => router.push('/')} variant="secondary" className="flex-1">
                    Peruuta
                  </Button>
                  <Button
                    onClick={handleExtendSet}
                    mode="neutral"
                    variant="primary"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    disabled={!selectedSetToExtend || (!materialText.trim() && uploadedFiles.length === 0)}
                  >
                    Lisää kysymyksiä
                  </Button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Uudet kysymykset luodaan palvelulla: {selectedProviderLabel}
              </p>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-4">
                {loadingQuestionSets ? (
                  <div className="flex justify-center py-12">
                    <CircleNotch weight="bold" className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
                  </div>
                ) : allQuestionSets.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p className="text-base">Ei kysymyssarjoja.</p>
                    <p className="text-sm mt-2">Luo uusi kysymyssarja tai korttisarja "Luo uusi" -välilehdeltä.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Kysymyssarjat ({allQuestionSets.length})
                      </h3>
                      <Button
                        onClick={loadQuestionSets}
                        variant="outline"
                        size="sm"
                        disabled={loadingQuestionSets}
                      >
                        Päivitä
                      </Button>
                    </div>
                    {allQuestionSets.map((set) => {
                      const status = set.status ?? 'created';
                      return (
                        <Card
                          key={set.id}
                          variant="standard"
                          padding="compact"
                          className="transition-shadow duration-150 hover:shadow-md"
                        >
                          <CardContent>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{set.name}</h4>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      status === 'published'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-slate-100 text-gray-800 dark:bg-slate-600 dark:text-gray-300'
                                    }`}
                                  >
                                    {status === 'published' ? (
                                      <>
                                        <Eye weight="fill" className="w-3 h-3" />
                                        Julkaistu
                                      </>
                                    ) : (
                                      <>
                                        <EyeSlash weight="fill" className="w-3 h-3" />
                                        Luonnos
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="flex gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="inline-flex items-center gap-1">
                                    <BookOpenText weight="duotone" className="w-4 h-4" />
                                    {set.subject}
                                  </span>
                                  {set.grade && (
                                    <Badge
                                      semantic="grade"
                                      size="xs"
                                      className={cn(getGradeBadgeClasses(set.grade))}
                                    >
                                      <GraduationCap weight="duotone" className="w-3 h-3" />
                                      Luokka {set.grade}
                                    </Badge>
                                  )}
                                  <span className="inline-flex items-center gap-1">
                                    <ChartBar weight="duotone" className="w-4 h-4" />
                                    {set.difficulty}
                                  </span>
                                </div>
                                <div className="flex gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                  <span>{set.question_count} kysymystä</span>
                                  <span>•</span>
                                  <span>
                                    Koodi:{' '}
                                    <code className="font-mono font-bold text-slate-900 dark:text-slate-100">{set.code}</code>
                                  </span>
                                </div>
                                {set.created_at && (
                                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                    Luotu: {new Date(set.created_at).toLocaleDateString('fi-FI')}
                                  </p>
                                )}
                                {set.type_distribution && Object.keys(set.type_distribution).length > 0 && (() => {
                                  const total = set.question_count;
                                  const getPercentage = (count: number) => Math.round((count / total) * 100);

                                  return (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {(set.type_distribution.multiple_choice || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                          <span className="font-medium">Monivalinta</span>
                                          <span className="text-blue-600 dark:text-blue-400">{getPercentage(set.type_distribution.multiple_choice)}%</span>
                                        </span>
                                      )}
                                      {(set.type_distribution.fill_blank || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                          <span className="font-medium">Täytä</span>
                                          <span className="text-purple-600 dark:text-purple-400">{getPercentage(set.type_distribution.fill_blank)}%</span>
                                        </span>
                                      )}
                                      {(set.type_distribution.true_false || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                          <span className="font-medium">T/E</span>
                                          <span className="text-green-600 dark:text-green-400">{getPercentage(set.type_distribution.true_false)}%</span>
                                        </span>
                                      )}
                                      {(set.type_distribution.matching || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                          <span className="font-medium">Yhdistä</span>
                                          <span className="text-orange-600 dark:text-orange-400">{getPercentage(set.type_distribution.matching)}%</span>
                                        </span>
                                      )}
                                      {(set.type_distribution.short_answer || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                                          <span className="font-medium">Kirjoita</span>
                                          <span className="text-cyan-600 dark:text-cyan-400">{getPercentage(set.type_distribution.short_answer)}%</span>
                                        </span>
                                      )}
                                      {(set.type_distribution.sequential || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                          <span className="font-medium">Järjestä</span>
                                          <span className="text-emerald-600 dark:text-emerald-400">{getPercentage(set.type_distribution.sequential)}%</span>
                                        </span>
                                      )}
                                      {(set.type_distribution.flashcard || 0) > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                                          <span className="font-medium">Kortti</span>
                                          <span className="text-teal-600 dark:text-teal-400">{getPercentage(set.type_distribution.flashcard)}%</span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                                {set.topic_distribution && Object.keys(set.topic_distribution).length > 0 && (
                                  <>
                                    <button
                                      onClick={() => setExpandedTopicSets(prev => {
                                        const next = new Set(prev);
                                        next.has(set.id) ? next.delete(set.id) : next.add(set.id);
                                        return next;
                                      })}
                                      className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                      <CaretDown weight="bold" className={cn("w-3 h-3 transition-transform", expandedTopicSets.has(set.id) && "rotate-180")} />
                                      Hallinnoi aiheita ({Object.keys(set.topic_distribution).length} aihetta)
                                    </button>

                                    {expandedTopicSets.has(set.id) && (
                                      <div className="mt-2 border-t border-slate-100 dark:border-slate-700 pt-2 space-y-1">
                                        {Object.entries(set.topic_distribution)
                                          .sort(([, a], [, b]) => b - a)
                                          .map(([topicKey, count]) => {
                                            const label = topicKey === '__null__' ? 'Ei aihetta' : topicKey;
                                            const topicValue = topicKey === '__null__' ? null : topicKey;
                                            const isDeleting = deletingTopic?.setId === set.id && deletingTopic?.topic === topicValue;
                                            return (
                                              <div key={topicKey} className="flex items-center justify-between text-sm">
                                                <span className="text-slate-700 dark:text-slate-300">
                                                  {label}
                                                  <span className="ml-2 text-xs text-slate-400">{count} kys</span>
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  disabled={isDeleting}
                                                  onClick={() => handleDeleteByTopic(set.id, topicKey, label, count)}
                                                  className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                  {isDeleting ? (
                                                    <CircleNotch weight="bold" className="w-3 h-3 animate-spin" />
                                                  ) : (
                                                    <Trash weight="duotone" className="w-3 h-3" />
                                                  )}
                                                </Button>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  onClick={() => {
                                    const openUrl = isAdmin && status !== 'published'
                                      ? `/play/${set.code}?draft=1`
                                      : `/play/${set.code}`;
                                    router.push(openUrl);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Avaa
                                </Button>
                                {isAdmin && (
                                  <Button
                                    onClick={() => handlePublishToggle(set.id, status)}
                                    variant={status === 'published' ? 'outline' : 'default'}
                                    size="sm"
                                    disabled={publishingId === set.id}
                                    aria-label={status === 'published' ? 'Piilota kysymyssarja' : 'Julkaise kysymyssarja'}
                                    className={`gap-2 ${status === 'published' ? '' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                  >
                                    {publishingId === set.id ? (
                                      <>
                                        <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                                        Päivitetään
                                      </>
                                    ) : status === 'published' ? (
                                      <>
                                        <EyeSlash weight="duotone" className="w-4 h-4" />
                                        Piilota
                                      </>
                                    ) : (
                                      <>
                                        <Eye weight="duotone" className="w-4 h-4" />
                                        Julkaise
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDeleteQuestionSet(set.id)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingId === set.id}
                                  aria-label="Poista kysymyssarja"
                                >
                                  {deletingId === set.id ? (
                                    <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash weight="duotone" className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={() => router.push('/')} variant="secondary" className="w-full">
                    Takaisin valikkoon
                  </Button>
              </div>
            </div>
          )}

          {activeTab === 'test-questions' && (
            <div className="space-y-4">
              <TestQuestionsTab
                allQuestionSets={allQuestionSets}
                loadingQuestionSets={loadingQuestionSets}
                onRefreshSets={loadQuestionSets}
              />
            </div>
          )}

          {activeTab === 'notifications' && isAdmin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag weight="duotone" className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Ilmoitetut kysymykset ({flaggedQuestions.length})
                      </h3>
                    </div>
                    <Button
                      onClick={loadFlaggedQuestions}
                      variant="outline"
                      size="sm"
                      disabled={loadingFlags}
                    >
                      Päivitä
                    </Button>
                  </div>

                  {flagLoadError && (
                    <Alert variant="destructive">
                      <AlertDescription>{flagLoadError}</AlertDescription>
                    </Alert>
                  )}

                  {loadingFlags ? (
                    <div className="flex justify-center py-6">
                      <CircleNotch weight="bold" className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : flaggedQuestions.length === 0 ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Ei ilmoitettuja kysymyksiä tällä hetkellä.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flaggedQuestions.map((flag) => (
                        <Card
                          key={flag.questionId}
                          variant="standard"
                          padding="compact"
                          className="transition-shadow duration-150 hover:shadow-md"
                        >
                          <CardContent>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1">
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                                    <Flag weight="duotone" className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {flag.questionText}
                                      </p>
                                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                                        <div>
                                          {flag.questionSetName ?? 'Tuntematon sarja'}
                                          {flag.questionSetCode ? ` • Koodi ${flag.questionSetCode}` : ''}
                                        </div>
                                        {flag.questionSetId && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 dark:text-slate-500">ID:</span>
                                            <button
                                              onClick={async () => {
                                                try {
                                                  await navigator.clipboard.writeText(flag.questionSetId);
                                                  toast.success('ID kopioitu leikepöydälle');
                                                } catch {
                                                  toast.error('ID:n kopiointi epäonnistui');
                                                }
                                              }}
                                              className="group inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                                              title="Klikkaa kopioidaksesi kysymyssarjan tietokanta-ID"
                                              aria-label={`Kopioi kysymyssarjan tietokanta-ID ${flag.questionSetId}`}
                                            >
                                              <span className="hidden sm:inline">{flag.questionSetId}</span>
                                              <span className="sm:hidden">{flag.questionSetId.substring(0, 8)}...</span>
                                              <ClipboardText className="h-3 w-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      <Badge semantic="info" size="sm">
                                        Ilmoituksia {flag.flagCount}
                                      </Badge>
                                      <Badge size="sm">
                                        Väärä vastaus {flag.reasonCounts.wrong_answer}
                                      </Badge>
                                      <Badge size="sm">Epäselvä {flag.reasonCounts.ambiguous}</Badge>
                                      <Badge size="sm">Typo {flag.reasonCounts.typo}</Badge>
                                      <Badge size="sm">Muu {flag.reasonCounts.other}</Badge>
                                    </div>
                                    {flag.latestNote && (
                                      <div className="rounded-lg border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                                        <span className="font-semibold">Huomio:</span> {flag.latestNote}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row gap-2 lg:flex-col lg:items-end">
                                <Button
                                  onClick={() => openFlagEdit(flag)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <PencilSimple weight="duotone" className="w-4 h-4" />
                                  Muokkaa
                                </Button>
                                <Button
                                  onClick={() => handleDismissFlag(flag)}
                                  variant="outline"
                                  size="sm"
                                  disabled={dismissingFlagId === flag.questionId}
                                  className="gap-2 text-slate-600 hover:text-slate-900"
                                >
                                  {dismissingFlagId === flag.questionId ? (
                                    <CircleNotch weight="bold" className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash weight="duotone" className="w-4 h-4" />
                                  )}
                                  Poista ilmoitukset
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
            </div>
          )}

          {activeTab === 'metrics' && isAdmin && (
            <MetricsTab />
          )}

              <Dialog.Root open={Boolean(editingFlag)} onOpenChange={(open) => !open && setEditingFlag(null)}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Muokkaa ilmoitettua kysymystä
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

                    {editingFlag && (
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

                        {/* multiple_choice: single correct answer + options list */}
                        {editingFlag.questionType === 'multiple_choice' && (
                          <>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Oikea vastaus
                              </label>
                              <Input
                                value={editCorrectAnswer}
                                onChange={(event) => setEditCorrectAnswer(event.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Vaihtoehdot (yksi per rivi)
                              </label>
                              <Textarea
                                value={editOptions}
                                onChange={(event) => setEditOptions(event.target.value)}
                                className="min-h-[90px]"
                              />
                            </div>
                          </>
                        )}

                        {/* multiple_select: 2-3 correct answers + exactly 5 options */}
                        {editingFlag.questionType === 'multiple_select' && (
                          <>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Oikeat vastaukset (2–3, yksi per rivi)
                              </label>
                              <Textarea
                                value={editCorrectAnswer}
                                onChange={(event) => setEditCorrectAnswer(event.target.value)}
                                className="min-h-[70px]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Vaihtoehdot (tasan 5, yksi per rivi)
                              </label>
                              <Textarea
                                value={editOptions}
                                onChange={(event) => setEditOptions(event.target.value)}
                                className="min-h-[110px]"
                              />
                            </div>
                          </>
                        )}

                        {/* fill_blank / short_answer: primary answer + optional alternatives */}
                        {(editingFlag.questionType === 'fill_blank' || editingFlag.questionType === 'short_answer') && (
                          <>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Oikea vastaus
                              </label>
                              <Input
                                value={editCorrectAnswer}
                                onChange={(event) => setEditCorrectAnswer(event.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Hyväksyttävät vastaukset (valinnainen, yksi per rivi)
                              </label>
                              <Textarea
                                value={editAcceptableAnswers}
                                onChange={(event) => setEditAcceptableAnswers(event.target.value)}
                                className="min-h-[70px]"
                              />
                            </div>
                          </>
                        )}

                        {/* flashcard: simple answer */}
                        {editingFlag.questionType === 'flashcard' && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                              Oikea vastaus
                            </label>
                            <Input
                              value={editCorrectAnswer}
                              onChange={(event) => setEditCorrectAnswer(event.target.value)}
                            />
                          </div>
                        )}

                        {/* true_false: dropdown */}
                        {editingFlag.questionType === 'true_false' && (
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

                        {/* matching: structured pair editor */}
                        {editingFlag.questionType === 'matching' && (
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

                        {/* sequential: ordered list with up/down controls */}
                        {editingFlag.questionType === 'sequential' && (
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

                        {editingFlag.questionType === 'map' && (
                          <>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Oikea vastaus (teksti tai JSON)
                              </label>
                              <Textarea
                                value={editCorrectAnswer}
                                onChange={(event) => setEditCorrectAnswer(event.target.value)}
                                className="min-h-[90px] font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                Vaihtoehdot (JSON)
                              </label>
                              <Textarea
                                value={editOptions}
                                onChange={(event) => setEditOptions(event.target.value)}
                                className="min-h-[120px] font-mono text-xs"
                              />
                            </div>
                          </>
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
                              <p>
                                Hyväksytään myös: {smartAlternatives.join(', ')}
                              </p>
                            )}
                          </div>
                        )}

                        {editError && (
                          <Alert variant="destructive">
                            <AlertDescription>{editError}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Dialog.Close asChild>
                            <Button variant="secondary" type="button">
                              Peruuta
                            </Button>
                          </Dialog.Close>
                          <Button
                            onClick={handleSaveFlagEdit}
                            disabled={savingEdit}
                            mode="quiz"
                            variant="primary"
                          >
                            {savingEdit ? 'Tallennetaan...' : 'Tallenna muutokset'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
        </div>
      </div>
      </div>

      {topicConfirmation && (
        <TopicConfirmationDialog
          isOpen={true}
          onClose={() => setTopicConfirmation(null)}
          onConfirm={handleTopicConfirmation}
          topicAnalysis={topicConfirmation.analysis}
          initialQuestionCount={topicConfirmation.requestedCount}
        />
      )}

      {capacityWarning && (
        <CapacityWarningDialog
          capacity={capacityWarning.capacity}
          validation={capacityWarning.validation}
          requestedCount={capacityWarning.requestedCount}
          minimumCount={minQuestionCount}
          onProceed={() => {
            const requested = capacityWarning.requestedCount;
            setCapacityWarning(null);
            void handleSubmit({
              bypassCapacityCheck: true,
              questionCountOverride: requested,
            });
          }}
          onAdjust={(count) => {
            const adjustedCount = Math.max(minQuestionCount, count);
            setQuestionCount(adjustedCount);
            setCapacityWarning(null);
            void handleSubmit({
              bypassCapacityCheck: true,
              questionCountOverride: adjustedCount,
            });
          }}
          onAddMaterial={() => {
            setCapacityWarning(null);
            setState('form');
            focusMaterialInput();
          }}
          onCancel={() => {
            setCapacityWarning(null);
            setState('form');
          }}
        />
      )}

      {state === 'loading' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200/60 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Luodaan kysymyssarjoja
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Tämä voi kestää muutaman minuutin. Pidä tämä välilehti auki.
              </p>
              <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                AI-palvelu: {selectedProviderLabel}
              </div>
            </div>
            <div className="px-6 py-6">
              {creationSteps.length > 0 ? (
                <>
                  <CreationProgressStepper steps={creationSteps} />
                  {(() => {
                    const topicsStep = creationSteps.find((step) => step.id === 'topics');
                    const topics = topicsStep?.metadata?.topics;

                    if (topicsStep?.status === 'completed' && topics && topics.length > 0) {
                      return (
                        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/20">
                          <div className="flex items-start gap-2">
                            <CheckCircle
                              weight="fill"
                              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                                Tunnistetut aihealueet ({topics.length})
                              </div>
                              <ul className="mt-2 space-y-1 text-sm text-emerald-800 dark:text-emerald-200">
                                {topics.map((topic, index) => (
                                  <li key={`${topic}-${index}`} className="flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                                    <span className="min-w-0 break-words">{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}
                  {creationSteps.some((step) => step.status === 'error') && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100">
                      <div className="font-semibold">Osa vaiheista epäonnistui</div>
                      <ul className="mt-2 space-y-1">
                        {creationSteps
                          .filter((step) => step.status === 'error')
                          .map((step) => (
                            <li key={step.id}>
                              {step.label}: {step.metadata?.message ?? 'Epäonnistui'}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <CircleNotch weight="bold" className="h-5 w-5 animate-spin text-emerald-600" />
                  <span>Käsitellään…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
