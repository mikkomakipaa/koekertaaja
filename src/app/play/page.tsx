'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import { QuestionSet } from '@/types';
import { Loader2, BookOpen, Clock, BarChart3, Star } from 'lucide-react';

type BrowseState = 'loading' | 'loaded' | 'error';

export default function PlayBrowsePage() {
  const router = useRouter();
  const [state, setState] = useState<BrowseState>('loading');
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuestionSets = async () => {
      try {
        setState('loading');
        const sets = await getRecentQuestionSets(50); // Load last 50 sets

        if (sets.length === 0) {
          setError('Ei vielä kysymyssarjoja. Luo ensimmäinen!');
        }

        setQuestionSets(sets);
        setState('loaded');
      } catch (err) {
        console.error('Error loading question sets:', err);
        setError('Kysymyssarjojen lataaminen epäonnistui');
        setState('error');
      }
    };

    loadQuestionSets();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fi-FI', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDifficultyStars = (difficulty: string) => {
    const difficultyMap: Record<string, number> = {
      helppo: 1,
      normaali: 2,
      vaikea: 3,
      mahdoton: 4,
    };
    const starCount = difficultyMap[difficulty] || 2;

    return (
      <div className="flex items-center gap-1">
        {[...Array(4)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < starCount
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      english: '🇬🇧 Englanti',
      math: '🔢 Matematiikka',
      history: '📜 Historia',
      society: '🏛️ Yhteiskuntaoppi',
    };
    return labels[subject] || subject;
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
          <p className="text-lg text-gray-600">Ladataan kokealueita...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-7 h-7 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Kokealueet</h1>
          </div>
          <p className="text-gray-600">Valitse alue aloittaaksesi harjoittelun</p>
        </div>

        {state === 'error' && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {questionSets.length === 0 && state === 'loaded' && (
          <Alert className="mb-6">
            <AlertDescription>
              Ei vielä kysymyssarjoja. Luo ensimmäinen kysymyssarja!
            </AlertDescription>
          </Alert>
        )}

        {questionSets.length > 0 && (
          <div className="space-y-3">
            {questionSets.map((set) => (
              <button
                key={set.id}
                onClick={() => router.push(`/play/${set.code}`)}
                className="w-full text-left p-5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
              >
                <div className="flex flex-col gap-3">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                    {set.name}
                  </h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">
                      {getSubjectLabel(set.subject)}
                    </span>
                    {set.grade && (
                      <span className="text-sm text-gray-500">
                        • Grade {set.grade}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      • {set.question_count} questions
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div className="flex items-center gap-2">
                    {getDifficultyStars(set.difficulty)}
                  </div>

                  {(set.topic || set.subtopic) && (
                    <p className="text-sm text-gray-500">
                      {[set.topic, set.subtopic].filter(Boolean).join(' → ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
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
