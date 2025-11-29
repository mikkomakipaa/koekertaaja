'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { QuestionSet, Difficulty } from '@/types';
import { Loader2, BookOpen } from 'lucide-react';

type BrowseState = 'loading' | 'loaded' | 'error';

interface GroupedQuestionSets {
  key: string;
  name: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  grade?: number;
  sets: QuestionSet[];
}

export default function PlayBrowsePage() {
  const router = useRouter();

  const [state, setState] = useState<BrowseState>('loading');
  const [groupedSets, setGroupedSets] = useState<GroupedQuestionSets[]>([]);
  const [error, setError] = useState('');

  const difficultyLabels: Record<string, string> = {
    helppo: 'Helppo',
    normaali: 'Normaali',
    vaikea: 'Vaikea',
  };

  const difficultyColors: Record<string, { bg: string; hover: string; text: string }> = {
    helppo: { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'text-green-700' },
    normaali: { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'text-blue-700' },
    vaikea: { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-700' },
  };

  const difficultyEmojis: Record<string, string> = {
    helppo: '😊',
    normaali: '🎯',
    vaikea: '💪',
  };

  useEffect(() => {
    const loadQuestionSets = async () => {
      try {
        setState('loading');
        const sets = await getRecentQuestionSets(100); // Load more sets

        // Helper function to remove difficulty suffix from name
        const stripDifficultySuffix = (name: string): string => {
          const suffixes = [' - Helppo', ' - Normaali', ' - Vaikea'];
          for (const suffix of suffixes) {
            if (name.endsWith(suffix)) {
              return name.slice(0, -suffix.length);
            }
          }
          return name;
        };

        // Group question sets by name (without difficulty), subject, topic, subtopic
        const grouped = sets.reduce((acc, set) => {
          const cleanName = stripDifficultySuffix(set.name);
          const key = `${cleanName}|${set.subject}|${set.topic || ''}|${set.subtopic || ''}`;

          if (!acc[key]) {
            acc[key] = {
              key,
              name: cleanName,
              subject: set.subject,
              topic: set.topic,
              subtopic: set.subtopic,
              grade: set.grade,
              sets: [],
            };
          }

          acc[key].sets.push(set);
          return acc;
        }, {} as Record<string, GroupedQuestionSets>);

        const groupedArray = Object.values(grouped);

        if (groupedArray.length === 0) {
          setError('Ei vielä kysymyssarjoja. Luo ensimmäinen!');
        }

        setGroupedSets(groupedArray);
        setState('loaded');
      } catch (err) {
        console.error('Error loading question sets:', err);
        setError('Kysymyssarjojen lataaminen epäonnistui');
        setState('error');
      }
    };

    loadQuestionSets();
  }, []);

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      english: '🇬🇧 Englanti',
      math: '🔢 Matematiikka',
      history: '📜 Historia',
      society: '🏛️ Yhteiskuntaoppi',
    };
    return labels[subject] || subject;
  };

  const getAvailableDifficulties = (sets: QuestionSet[]) => {
    return ['helppo', 'normaali', 'vaikea'].filter(difficulty =>
      sets.some(set => set.difficulty === difficulty)
    );
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-lg text-gray-600">Ladataan aihealueita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-12 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Valitse aihealue</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Valitse aihealue ja vaikeustaso</p>
        </div>

        {state === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {groupedSets.length === 0 && state === 'loaded' && (
          <Alert className="mb-6">
            <AlertDescription>
              Ei vielä kysymyssarjoja. Luo ensimmäinen kysymyssarja!
            </AlertDescription>
          </Alert>
        )}

        {groupedSets.length > 0 && (
          <div className="space-y-4">
            {groupedSets.map((group) => {
              const availableDifficulties = getAvailableDifficulties(group.sets);

              return (
                <div
                  key={group.key}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 hover:shadow-md transition-all"
                >
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {group.name}
                  </h3>

                  {/* Subject */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {getSubjectLabel(group.subject)}
                    </span>
                  </div>

                  {/* Info Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.grade && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        Luokka: {group.grade}
                      </span>
                    )}
                    {(group.topic || group.subtopic) && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Aihealue: {[group.topic, group.subtopic].filter(Boolean).join(' → ')}
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {group.sets[0]?.question_count || 0} kysymystä
                    </span>
                  </div>

                  {/* Difficulty Buttons - Inline */}
                  <div className="flex flex-wrap gap-2">
                    {availableDifficulties.map((difficulty) => {
                      const set = group.sets.find(s => s.difficulty === difficulty);
                      const colors = difficultyColors[difficulty];
                      const emoji = difficultyEmojis[difficulty];

                      return (
                        <button
                          key={difficulty}
                          onClick={() => set && router.push(`/play/${set.code}`)}
                          className={`${colors.bg} ${colors.hover} text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95`}
                          aria-label={`${difficultyLabels[difficulty]} vaikeustaso`}
                        >
                          <span className="mr-1.5" role="img" aria-hidden="true">{emoji}</span>
                          {difficultyLabels[difficulty]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Takaisin valikkoon
          </Button>
        </div>
      </div>
    </div>
  );
}
