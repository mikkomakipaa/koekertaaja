'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { GradeSelector } from '@/components/create/GradeSelector';
import { MaterialUpload } from '@/components/create/MaterialUpload';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import { Difficulty, MapInputMode, MapRegion, QuestionSet } from '@/types';
import {
  CircleNotch,
  Star,
  Trash,
  ListBullets,
  Plus,
  Tag,
  BookOpenText,
  Compass,
  ClipboardText,
  Cards,
  ChartBar,
  ListNumbers,
  Package,
  PlusCircle,
  GraduationCap,
  CheckCircle,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserMenu } from '@/components/auth/UserMenu';
import { CreationProgressStepper } from '@/components/create/CreationProgressStepper';

type CreateState = 'form' | 'loading' | 'success';

type CreationStep = {
  id: 'topics' | 'quiz' | 'flashcard';
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  metadata?: {
    count?: number;
    message?: string;
  };
};

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

export default function CreatePage() {
  const router = useRouter();
  const subjectTypeOptions: Array<{ value: SubjectType; label: string; description: string }> = [
    {
      value: 'language',
      label: 'Kielet',
      description: 'Sanasto, kielioppi, luetun ymmärtäminen',
    },
    {
      value: 'written',
      label: 'Teoria-aineet',
      description: 'Historia, yhteiskuntaoppi, biologia ja muut lukuaineet',
    },
    {
      value: 'geography',
      label: 'Maantieto',
      description: 'Kartat, alueet, sijainnit ja maantiedon käsitteet',
    },
    {
      value: 'math',
      label: 'Matematiikka',
      description: 'Laskut, matemaattiset käsitteet ja ongelmanratkaisu',
    },
    {
      value: 'skills',
      label: 'Taidot',
      description: 'Kuvataide, musiikki, käsityö tai liikunta',
    },
    {
      value: 'concepts',
      label: 'Käsitteet',
      description: 'Uskonto, elämänkatsomus tai filosofiset aiheet',
    },
  ];
  const subjectTypesRequiringGrade = new Set<SubjectType>([
    'language',
    'math',
    'written',
    'geography',
    'skills',
    'concepts',
  ]);
  const defaultQuestionCounts = {
    min: 20,
    max: 200,
    default: 50,
  };

  // Form state
  const [state, setState] = useState<CreateState>('form');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [subjectType, setSubjectType] = useState<SubjectType | ''>('');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [examLength, setExamLength] = useState(15);
  const [questionCount, setQuestionCount] = useState(defaultQuestionCounts.default);
  const [questionSetName, setQuestionSetName] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [generationMode, setGenerationMode] = useState<'quiz' | 'flashcard' | 'both'>('quiz');
  const [targetWords, setTargetWords] = useState('');
  const [error, setError] = useState('');

  // Creation progress state
  const [creationSteps, setCreationSteps] = useState<CreationStep[]>([]);

  // Success state
  const [questionSetsCreated, setQuestionSetsCreated] = useState<any[]>([]);
  const [totalQuestionsCreated, setTotalQuestionsCreated] = useState(0);

  // All question sets state
  const [allQuestionSets, setAllQuestionSets] = useState<QuestionSet[]>([]);
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [creatingMapQuestion, setCreatingMapQuestion] = useState(false);
  const [mapQuestionError, setMapQuestionError] = useState('');

  // Extend existing set state
  const [selectedSetToExtend, setSelectedSetToExtend] = useState<string>('');
  const [questionsToAdd, setQuestionsToAdd] = useState(20);

  // Map question form state
  const [mapQuestionSetId, setMapQuestionSetId] = useState('');
  const [mapQuestionSubject, setMapQuestionSubject] = useState('Maantieto');
  const [mapQuestionGrade, setMapQuestionGrade] = useState<number | ''>('');
  const [mapQuestionDifficulty, setMapQuestionDifficulty] = useState<Difficulty | ''>('');
  const [mapQuestionText, setMapQuestionText] = useState('');
  const [mapQuestionExplanation, setMapQuestionExplanation] = useState('');
  const [mapQuestionTopic, setMapQuestionTopic] = useState('');
  const [mapQuestionSubtopic, setMapQuestionSubtopic] = useState('');
  const [mapQuestionSkill, setMapQuestionSkill] = useState('');
  const [mapQuestionMapAsset, setMapQuestionMapAsset] = useState('');
  const [mapQuestionInputMode, setMapQuestionInputMode] = useState<MapInputMode>('single_region');
  const [mapQuestionRegions, setMapQuestionRegions] = useState('');
  const [mapQuestionCorrectAnswer, setMapQuestionCorrectAnswer] = useState('');
  const [mapQuestionAcceptableAnswers, setMapQuestionAcceptableAnswers] = useState('');

  const minQuestionCount = defaultQuestionCounts.min;
  const maxQuestionCount = defaultQuestionCounts.max;
  const defaultQuestionCount = defaultQuestionCounts.default;
  const hasResolvedSubjectType = subjectType !== '';
  const requiresGrade = hasResolvedSubjectType
    ? subjectTypesRequiringGrade.has(subjectType as SubjectType)
    : false;
  const selectedSubjectTypeOption = subjectTypeOptions.find(
    (option) => option.value === subjectType
  );
  const hasSubject = Boolean(subject.trim());
  const hasSubjectType = Boolean(subjectType);
  const hasRequiredGrade = !requiresGrade || Boolean(grade);
  const hasMaterials = materialText.trim().length > 0 || uploadedFiles.length > 0;
  const selectedMapQuestionSet = mapQuestionSetId
    ? allQuestionSets.find((set) => set.id === mapQuestionSetId)
    : null;

  // Helper functions for creation progress
  const initializeCreationSteps = (): CreationStep[] => {
    const steps: CreationStep[] = [
      {
        id: 'topics',
        label: 'Tunnistetaan aiheita materiaalista',
        status: 'pending',
      },
    ];

    if (generationMode === 'quiz' || generationMode === 'both') {
      steps.push({
        id: 'quiz',
        label: 'Luodaan visaa',
        status: 'pending',
      });
    }

    if (generationMode === 'flashcard' || generationMode === 'both') {
      steps.push({
        id: 'flashcard',
        label: 'Luodaan muistikortteja',
        status: 'pending',
      });
    }

    return steps;
  };

  const updateCreationStep = (
    stepId: string,
    status: CreationStep['status'],
    metadata?: { count?: number; message?: string }
  ) => {
    setCreationSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, metadata: { ...step.metadata, ...metadata } } : step
      )
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!questionSetName.trim()) {
      setError('Anna kysymyssarjalle nimi!');
      return;
    }

    if (!subject.trim()) {
      setError('Anna aineen nimi!');
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

    setError('');
    setState('loading');
    setCreationSteps(initializeCreationSteps());

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('questionCount', questionCount.toString());
      formData.append('examLength', examLength.toString());
      formData.append('questionSetName', questionSetName);
      if (topic.trim()) {
        formData.append('topic', topic.trim());
      }
      if (subtopic.trim()) {
        formData.append('subtopic', subtopic.trim());
      }

      if (grade) {
        formData.append('grade', grade.toString());
      }

      formData.append('subjectType', subjectType);

      formData.append('generationMode', generationMode);

      if (materialText.trim()) {
        formData.append('materialText', materialText);
      }

      if (targetWords.trim()) {
        formData.append('targetWords', targetWords);
      }

      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Track results across separate API calls
      const results: {
        quizSets: Array<{ code: string; name: string; difficulty: string; mode: 'quiz' | 'flashcard'; questionCount: number }>;
        flashcardSet: { code: string; name: string; mode: 'quiz' | 'flashcard'; questionCount: number } | null;
        errors: Array<{ mode: 'quiz' | 'flashcard'; error: string }>;
      } = { quizSets: [], flashcardSet: null, errors: [] };

      // Step 1: Identify topics (shared across quiz and flashcard)
      updateCreationStep('topics', 'in_progress', { message: 'Analysoidaan materiaalia...' });
      let topics: string[] = [];
      try {
        const topicsResponse = await fetch('/api/identify-topics', { method: 'POST', body: formData });
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json();
          topics = topicsData.topics || [];
          updateCreationStep('topics', 'completed', {
            count: topics.length,
            message: `Tunnistettiin ${topics.length} aihetta`,
          });
        }
      } catch (error) {
        console.warn('Topic identification failed:', error);
        updateCreationStep('topics', 'error', { message: 'Aiheiden tunnistaminen epäonnistui' });
      }

      // Add topics to form data for subsequent requests
      if (topics.length > 0) {
        formData.append('identifiedTopics', JSON.stringify(topics));
      }

      // Step 2: Generate quiz sets (if requested)
      if (generationMode === 'quiz' || generationMode === 'both') {
        updateCreationStep('quiz', 'in_progress', { message: 'Luodaan visaa...' });
        try {
          const quizResponse = await fetch('/api/generate-questions/quiz', { method: 'POST', body: formData });
          const quizData = await quizResponse.json();
          if (quizData.success && quizData.questionSets) {
            results.quizSets = quizData.questionSets;
            updateCreationStep('quiz', 'completed', {
              count: quizData.totalQuestions,
              message: `Luotiin ${quizData.questionSets.length} visaa (${quizData.totalQuestions} kysymystä)`,
            });
          } else {
            throw new Error(quizData.error || 'Visan luonti epäonnistui');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Visan luonti epäonnistui';
          results.errors.push({ mode: 'quiz', error: errorMessage });
          updateCreationStep('quiz', 'error', { message: errorMessage });
        }
      }

      // Step 3: Generate flashcard set (if requested)
      if (generationMode === 'flashcard' || generationMode === 'both') {
        updateCreationStep('flashcard', 'in_progress', { message: 'Luodaan muistikortteja...' });
        try {
          const flashcardResponse = await fetch('/api/generate-questions/flashcard', { method: 'POST', body: formData });
          const flashcardData = await flashcardResponse.json();
          if (flashcardData.success && flashcardData.questionSet) {
            results.flashcardSet = flashcardData.questionSet;
            updateCreationStep('flashcard', 'completed', {
              count: flashcardData.questionSet.questionCount,
              message: `Luotiin muistikortit (${flashcardData.questionSet.questionCount} kysymystä)`,
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
        // Navigate to play page to view created sets
        router.push('/play');
      } else {
        // Total failure
        const errorDetails = results.errors.map(e => `${e.mode === 'flashcard' ? 'Kortit' : 'Visa'}: ${e.error}`).join('\n');
        toast.error('Kysymyssarjojen luonti epäonnistui', { description: errorDetails, duration: 10000 });
        setState('form');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
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
    console.log('Question generation: full success', {
      setsCreated: questionSets.length,
      totalQuestions,
    });
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
    console.warn('Question generation: partial success', {
      succeeded: stats?.succeeded,
      failed: stats?.failed,
      failures: failures?.map(f => ({ mode: f.mode, difficulty: f.difficulty, errorType: f.errorType })),
    });
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
    console.error('Question generation: total failure', {
      message,
      failures,
    });
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  const handleBrowseSets = () => {
    router.push('/play');
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
      console.error('Error loading question sets:', error);
    } finally {
      setLoadingQuestionSets(false);
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
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const parseMapRegions = (rawInput: string): MapRegion[] => {
    return rawInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [idRaw, labelRaw, aliasesRaw] = line.split(',').map((part) => part.trim());
        if (!idRaw || !labelRaw) {
          return null;
        }
        const aliases = aliasesRaw
          ? aliasesRaw.split('|').map((alias) => alias.trim()).filter(Boolean)
          : undefined;
        return aliases && aliases.length > 0
          ? { id: idRaw, label: labelRaw, aliases }
          : { id: idRaw, label: labelRaw };
      })
      .filter((region): region is MapRegion => Boolean(region));
  };

  const handleCreateMapQuestion = async () => {
    if (!mapQuestionText.trim()) {
      setMapQuestionError('Anna karttakysymyksen teksti!');
      return;
    }

    if (!mapQuestionExplanation.trim()) {
      setMapQuestionError('Anna selitys karttakysymykselle!');
      return;
    }

    if (!mapQuestionMapAsset.trim()) {
      setMapQuestionError('Anna karttakuvan polku tai URL!');
      return;
    }

    const regions = parseMapRegions(mapQuestionRegions);
    if (regions.length === 0) {
      setMapQuestionError('Syötä vähintään yksi alue muodossa "id, nimi, alias1|alias2".');
      return;
    }

    const correctAnswer = mapQuestionInputMode === 'multi_region'
      ? mapQuestionCorrectAnswer
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : mapQuestionCorrectAnswer.trim();

    if (mapQuestionInputMode === 'multi_region' && (!Array.isArray(correctAnswer) || correctAnswer.length === 0)) {
      setMapQuestionError('Anna vähintään yksi oikea alue (pilkulla erotettuna).');
      return;
    }

    if (mapQuestionInputMode !== 'multi_region' && typeof correctAnswer === 'string' && !correctAnswer) {
      setMapQuestionError('Anna oikea vastaus.');
      return;
    }

    const selectedSet = mapQuestionSetId
      ? allQuestionSets.find((set) => set.id === mapQuestionSetId)
      : null;
    const subjectValue = selectedSet?.subject || mapQuestionSubject.trim();

    if (!subjectValue) {
      setMapQuestionError('Anna aine karttakysymykselle.');
      return;
    }

    const acceptableAnswers = mapQuestionAcceptableAnswers
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setMapQuestionError('');
    setCreatingMapQuestion(true);

    try {
      const response = await fetch('/api/map-questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionSetId: mapQuestionSetId || null,
          subject: subjectValue,
          grade: selectedSet?.grade ?? (mapQuestionGrade === '' ? null : Number(mapQuestionGrade)),
          difficulty: selectedSet?.difficulty ?? (mapQuestionDifficulty || null),
          question: mapQuestionText.trim(),
          explanation: mapQuestionExplanation.trim(),
          topic: mapQuestionTopic.trim() || undefined,
          subtopic: mapQuestionSubtopic.trim() || undefined,
          skill: mapQuestionSkill.trim() || undefined,
          mapAsset: mapQuestionMapAsset.trim(),
          inputMode: mapQuestionInputMode,
          regions,
          correctAnswer,
          acceptableAnswers: acceptableAnswers.length > 0 ? acceptableAnswers : undefined,
          metadata: {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Karttakysymyksen luonti epäonnistui';
        const errorDetails = data.details ? `\n\n${data.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      setMapQuestionText('');
      setMapQuestionExplanation('');
      setMapQuestionTopic('');
      setMapQuestionSubtopic('');
      setMapQuestionSkill('');
      setMapQuestionMapAsset('');
      setMapQuestionRegions('');
      setMapQuestionCorrectAnswer('');
      setMapQuestionAcceptableAnswers('');

    } catch (error) {
      console.error('Error creating map question:', error);
      const errorMessage = error instanceof Error ? error.message : 'Karttakysymyksen luonti epäonnistui';
      setMapQuestionError(errorMessage);
    } finally {
      setCreatingMapQuestion(false);
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
      console.error('Error updating question set status:', error);
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
      console.error('Error deleting question set:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kysymyssarjan poistaminen epäonnistui';
      alert(`Virhe: ${errorMessage}`);
    } finally {
      setDeletingId(null);
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
      console.error('Error extending question set:', err);
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
    setQuestionCount(defaultQuestionCount);
  }, [defaultQuestionCount]);

  useEffect(() => {
    if (!requiresGrade) {
      setGrade(undefined);
    }
  }, [requiresGrade]);

  // Loading screen
  if (state === 'loading') {
    return (
      <AuthGuard>
        <UserMenu />
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Luodaan kysymyssarjoja</CardTitle>
              <CardDescription className="text-white text-base">
                Tämä kestää muutaman minuutin. Älä sulje ikkunaa.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <CreationProgressStepper steps={creationSteps} />
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

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
        <UserMenu />
        <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-12 flex items-center justify-center transition-colors">
        <Card className="max-w-3xl shadow-2xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white rounded-t-lg">
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle weight="duotone" className="w-8 h-8" />
              Kysymyssarjat luotu onnistuneesti!
            </CardTitle>
            <CardDescription className="text-white text-lg font-medium">
              Luotiin {questionSetsCreated.length} kysymyssarjaa ({totalQuestionsCreated} kysymystä yhteensä)
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Luodut kysymyssarjat:</h3>
              <div className="space-y-2">
                {questionSetsCreated.map((set, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {set.mode === 'flashcard'
                            ? `${set.name} - ${modeLabels[set.mode]}`
                            : difficultyLabels[set.difficulty] || set.difficulty}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {set.questionCount} kysymystä
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Koodi:</p>
                        <code className="px-3 py-1 bg-gray-100 dark:bg-gray-600 rounded font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
                          {set.code}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleBrowseSets}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 rounded-xl text-lg font-semibold"
              >
                Selaa kysymyssarjoja
              </Button>
              <Button
                onClick={handleBackToMenu}
                variant="outline"
                className="flex-1 py-6 rounded-xl text-lg font-semibold"
              >
                Takaisin valikkoon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </AuthGuard>
    );
  }

  // Form screen
  return (
    <AuthGuard>
      <UserMenu />
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-12 transition-colors">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white rounded-t-lg">
            <CardTitle className="text-3xl flex items-center gap-2 text-white">
              <Star className="w-8 h-8" />
              Kysymyssarjat
            </CardTitle>
            <CardDescription className="text-white text-lg font-medium">
              Luo uusia kysymyssarjoja tai hallitse olemassa olevia
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="create" className="text-base">
                  <Star className="w-4 h-4 mr-2" />
                  Luo uusi
                </TabsTrigger>
                <TabsTrigger value="extend" className="text-base">
                  <Plus className="w-4 h-4 mr-2" />
                  Laajenna
                </TabsTrigger>
                <TabsTrigger value="map-question" className="text-base">
                  <Compass className="w-4 h-4 mr-2" />
                  Karttakysymys
                </TabsTrigger>
                <TabsTrigger value="manage" className="text-base">
                  <ListBullets weight="duotone" className="w-4 h-4 mr-2" />
                  Hallitse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
            <div>
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <Tag weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Kysymyssarjan nimi
                </span>
              </label>
              <Input
                type="text"
                value={questionSetName}
                onChange={(e) => setQuestionSetName(e.target.value)}
                placeholder="Esim. Englanti 7. luokka - Kappale 3"
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <BookOpenText weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Aine
                </span>
              </label>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Esim. Maantieto, Biologia, Matematiikka"
                  className="text-lg"
                />
                <div>
                  <label className="block text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-2">
                      <Compass weight="duotone" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Aineen tyyppi (pakollinen)
                    </span>
                  </label>
                  <select
                    value={subjectType}
                    onChange={(e) => setSubjectType(e.target.value as SubjectType | '')}
                    className="w-full p-3 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                  >
                    <option value="">-- Valitse tyyppi --</option>
                    {subjectTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Valitse aineen tyyppi, jotta kysymykset ja vaikeusjakaumat sopivat luokka-asteelle.
                    {selectedSubjectTypeOption ? ` ${selectedSubjectTypeOption.description}.` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <Tag weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Aihe
                </span>
              </label>
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Esim. Suomen maakunnat"
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <Tag weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Alateema
                </span>
              </label>
              <Input
                type="text"
                value={subtopic}
                onChange={(e) => setSubtopic(e.target.value)}
                placeholder="Esim. Länsi-Suomi"
                className="text-lg"
              />
            </div>

            {requiresGrade && (
              <GradeSelector
                selectedGrade={grade}
                onGradeChange={setGrade}
                required
              />
            )}

            {/* Generation Mode Selector */}
            <div className="border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-5">
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <ClipboardText weight="duotone" className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
                  Mitä haluat luoda?
                </span>
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors">
                  <input
                    type="radio"
                    name="generationMode"
                    value="quiz"
                    checked={generationMode === 'quiz'}
                    onChange={(e) => setGenerationMode(e.target.value as 'quiz')}
                    className="mt-1 w-5 h-5 border-indigo-300 text-indigo-600 focus:ring-indigo-500 dark:border-indigo-600 dark:bg-gray-800"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BookOpenText weight="duotone" className="w-4 h-4" />
                      Koe (2 vaikeustasoa)
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      Luo kaksi kysymyssarjaa: Helppo ja Normaali. Sopii kokeiden harjoitteluun.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors">
                  <input
                    type="radio"
                    name="generationMode"
                    value="flashcard"
                    checked={generationMode === 'flashcard'}
                    onChange={(e) => setGenerationMode(e.target.value as 'flashcard')}
                    className="mt-1 w-5 h-5 border-purple-300 text-purple-600 focus:ring-purple-500 dark:border-purple-600 dark:bg-gray-800"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Cards weight="duotone" className="w-4 h-4" />
                      Kortit (vain 1 sarja)
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Luo yksi korttisarja oppimiseen. Sisältää avoimia kysymyksiä ja yksityiskohtaisia selityksiä.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors">
                  <input
                    type="radio"
                    name="generationMode"
                    value="both"
                    checked={generationMode === 'both'}
                    onChange={(e) => setGenerationMode(e.target.value as 'both')}
                    className="mt-1 w-5 h-5 border-green-300 text-green-600 focus:ring-green-500 dark:border-green-600 dark:bg-gray-800"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <BookOpenText weight="duotone" className="w-4 h-4" />
                        <Plus className="w-3 h-3" />
                        <Cards weight="duotone" className="w-4 h-4" />
                      </span>
                      Molemmat (2 koetta + 1 korttisarja)
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Luo sekä koesarjat että korttisarja. Kattavin vaihtoehto monipuoliseen harjoitteluun.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <ChartBar weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">5 kysymystä</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{examLength}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">20 kysymystä</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Harjoituskerta sisältää tämän määrän kysymyksiä
              </p>
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                <span className="inline-flex items-center gap-2">
                  <ListNumbers weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Materiaalista luotavien kysymysten määrä
                </span>
              </label>
              <div className="space-y-4">
                <Slider
                  min={minQuestionCount}
                  max={maxQuestionCount}
                  step={10}
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{minQuestionCount} kysymystä</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{questionCount}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{maxQuestionCount} kysymystä</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                AI luo tämän määrän kysymyksiä materiaalista (jaetaan vaikeusasteille)
              </p>
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
                <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                  <span className="inline-flex items-center gap-2">
                    <BookOpenText weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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
              <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
                Peruuta
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                disabled={!questionSetName.trim() || !hasSubject || !hasSubjectType || !hasRequiredGrade || !hasMaterials}
              >
                Luo kysymyssarjat
              </Button>
            </div>
              </TabsContent>

              <TabsContent value="extend" className="space-y-6">
                <div>
                  <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-2">
                      <Package weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Valitse laajennettava kysymyssarja
                    </span>
                  </label>
                  <select
                    value={selectedSetToExtend}
                    onChange={(e) => setSelectedSetToExtend(e.target.value)}
                    className="w-full p-3 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
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
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
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
                          {selectedSet.grade && <p><strong>Luokka:</strong> {selectedSet.grade}</p>}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">
                    <span className="inline-flex items-center gap-2">
                      <PlusCircle weight="duotone" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">5 kysymystä</span>
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{questionsToAdd}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">50 kysymystä</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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
                  <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
                    Peruuta
                  </Button>
                  <Button
                    onClick={handleExtendSet}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    disabled={!selectedSetToExtend || (!materialText.trim() && uploadedFiles.length === 0)}
                  >
                    Lisää kysymyksiä
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="map-question" className="space-y-6">
                <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Luo karttakysymys</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Luo yksittäinen karttakysymys ja liitä se halutessa kysymyssarjaan.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Liitä kysymyssarjaan (valinnainen)
                      </label>
                      <select
                        value={mapQuestionSetId}
                        onChange={(e) => setMapQuestionSetId(e.target.value)}
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                      >
                        <option value="">-- Ei sarjaa (standalone) --</option>
                        {allQuestionSets.map((set) => (
                          <option key={set.id} value={set.id}>
                            {set.name} ({set.mode === 'flashcard' ? 'Kortit' : set.difficulty})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedMapQuestionSet ? (
                      <div className="rounded-lg border border-blue-200 dark:border-blue-700 bg-white/70 dark:bg-gray-800/70 p-3 text-sm text-blue-900 dark:text-blue-200">
                        <p><strong>Nimi:</strong> {selectedMapQuestionSet.name}</p>
                        <p><strong>Aine:</strong> {selectedMapQuestionSet.subject}</p>
                        {selectedMapQuestionSet.grade && <p><strong>Luokka:</strong> {selectedMapQuestionSet.grade}</p>}
                        <p><strong>Vaikeus:</strong> {selectedMapQuestionSet.difficulty}</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Aine
                          </label>
                          <Input
                            value={mapQuestionSubject}
                            onChange={(e) => setMapQuestionSubject(e.target.value)}
                            placeholder="Maantieto"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Luokka (valinnainen)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={13}
                            value={mapQuestionGrade}
                            onChange={(e) => setMapQuestionGrade(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="6"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Vaikeus (valinnainen)
                          </label>
                          <select
                            value={mapQuestionDifficulty}
                            onChange={(e) => setMapQuestionDifficulty(e.target.value as Difficulty | '')}
                            className="w-full p-3 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                          >
                            <option value="">-- Valitse --</option>
                            <option value="helppo">Helppo</option>
                            <option value="normaali">Normaali</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Kysymys
                      </label>
                      <Input
                        value={mapQuestionText}
                        onChange={(e) => setMapQuestionText(e.target.value)}
                        placeholder="Esim. Valitse kartalta Uusimaa."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Selitys
                      </label>
                      <Textarea
                        value={mapQuestionExplanation}
                        onChange={(e) => setMapQuestionExplanation(e.target.value)}
                        placeholder="Selitä lyhyesti miksi vastaus on oikea."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Kartta-asset (polku tai URL)
                        </label>
                        <Input
                          value={mapQuestionMapAsset}
                          onChange={(e) => setMapQuestionMapAsset(e.target.value)}
                          placeholder="/maps/topojson/finland_counties_v1.topojson"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Vastaustapa
                        </label>
                        <select
                          value={mapQuestionInputMode}
                          onChange={(e) => setMapQuestionInputMode(e.target.value as MapInputMode)}
                          className="w-full p-3 border rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-600"
                        >
                          <option value="single_region">Yksi alue</option>
                          <option value="multi_region">Useita alueita</option>
                          <option value="text">Teksti</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Aihe (valinnainen)
                        </label>
                        <Input
                          value={mapQuestionTopic}
                          onChange={(e) => setMapQuestionTopic(e.target.value)}
                          placeholder="Esim. Suomen maakunnat"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Alateema (valinnainen)
                        </label>
                        <Input
                          value={mapQuestionSubtopic}
                          onChange={(e) => setMapQuestionSubtopic(e.target.value)}
                          placeholder="Esim. Länsi-Suomi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Taitotunniste (valinnainen)
                      </label>
                      <Input
                        value={mapQuestionSkill}
                        onChange={(e) => setMapQuestionSkill(e.target.value)}
                        placeholder="maakunnat"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Alueet (rivi per alue, muodossa: id, nimi, alias1|alias2)
                      </label>
                      <Textarea
                        value={mapQuestionRegions}
                        onChange={(e) => setMapQuestionRegions(e.target.value)}
                        placeholder="uusimaa, Uusimaa, Uusimaa|Uusimaa maakunta"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Oikea vastaus{mapQuestionInputMode === 'multi_region' ? ' (pilkulla eroteltu)' : ''}
                      </label>
                      <Input
                        value={mapQuestionCorrectAnswer}
                        onChange={(e) => setMapQuestionCorrectAnswer(e.target.value)}
                        placeholder={mapQuestionInputMode === 'multi_region' ? 'uusimaa, varsinais-suomi' : 'uusimaa'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Hyväksyttävät vastaukset (valinnainen, pilkulla eroteltu)
                      </label>
                      <Input
                        value={mapQuestionAcceptableAnswers}
                        onChange={(e) => setMapQuestionAcceptableAnswers(e.target.value)}
                        placeholder="Uusimaa, Uudenmaan maakunta"
                      />
                    </div>

                    {mapQuestionError && (
                      <Alert variant="destructive">
                        <AlertDescription>{mapQuestionError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={handleCreateMapQuestion}
                        disabled={creatingMapQuestion}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {creatingMapQuestion ? (
                          <CircleNotch weight="bold" className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Luo karttakysymys
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manage" className="space-y-4">
                {loadingQuestionSets ? (
                  <div className="flex justify-center py-12">
                    <CircleNotch weight="bold" className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
                  </div>
                ) : allQuestionSets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">Ei kysymyssarjoja.</p>
                    <p className="text-sm mt-2">Luo uusi kysymyssarja tai korttisarja "Luo uusi" -välilehdeltä.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
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
                        <div
                          key={set.id}
                          className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">{set.name}</h4>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    status === 'published'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
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
                              <div className="flex gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center gap-1">
                                  <BookOpenText weight="duotone" className="w-4 h-4" />
                                  {set.subject}
                                </span>
                                {set.grade && (
                                  <span className="inline-flex items-center gap-1">
                                    <GraduationCap weight="duotone" className="w-4 h-4" />
                                    Luokka {set.grade}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                  <ChartBar weight="duotone" className="w-4 h-4" />
                                  {set.difficulty}
                                </span>
                              </div>
                              <div className="flex gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span>{set.question_count} kysymystä</span>
                                <span>•</span>
                                <span>Koodi: <code className="font-mono font-bold text-gray-900 dark:text-gray-100">{set.code}</code></span>
                              </div>
                              {set.created_at && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Luotu: {new Date(set.created_at).toLocaleDateString('fi-FI')}
                                </p>
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
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                    Takaisin valikkoon
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  );
}
