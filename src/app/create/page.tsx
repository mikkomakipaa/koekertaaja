'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GradeSelector } from '@/components/create/GradeSelector';
import { MaterialUpload } from '@/components/create/MaterialUpload';
import { getAllQuestionSets } from '@/lib/supabase/queries';
import { QuestionSet } from '@/types';
import { Loader2, Star, Trash2, List } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserMenu } from '@/components/auth/UserMenu';

type CreateState = 'form' | 'loading' | 'success';

export default function CreatePage() {
  const router = useRouter();

  // Form state
  const [state, setState] = useState<CreateState>('form');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [examLength, setExamLength] = useState(15);
  const [questionCount, setQuestionCount] = useState(100);
  const [questionSetName, setQuestionSetName] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  // Success state
  const [questionSetsCreated, setQuestionSetsCreated] = useState<any[]>([]);
  const [totalQuestionsCreated, setTotalQuestionsCreated] = useState(0);

  // All question sets state
  const [allQuestionSets, setAllQuestionSets] = useState<QuestionSet[]>([]);
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    if (!materialText.trim() && uploadedFiles.length === 0) {
      setError('Syötä materiaali tai lataa tiedosto!');
      return;
    }

    setError('');
    setState('loading');

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('questionCount', questionCount.toString());
      formData.append('examLength', examLength.toString());
      formData.append('questionSetName', questionSetName);

      if (grade) {
        formData.append('grade', grade.toString());
      }

      if (materialText.trim()) {
        formData.append('materialText', materialText);
      }

      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Call API
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Kysymysten luonti epäonnistui';
        const errorDetails = data.details ? `\n\n${data.details}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      // Success
      setQuestionSetsCreated(data.questionSets || []);
      setTotalQuestionsCreated(data.totalQuestions || 0);
      setState('success');
    } catch (err) {
      console.error('Error generating questions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Kysymysten luonti epäonnistui';
      setError(errorMessage);
      setState('form');
    }
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
      const sets = await getAllQuestionSets();
      setAllQuestionSets(sets);
    } catch (error) {
      console.error('Error loading question sets:', error);
    } finally {
      setLoadingQuestionSets(false);
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

  // Load question sets when component mounts
  useEffect(() => {
    loadQuestionSets();
  }, []);

  // Loading screen
  if (state === 'loading') {
    return (
      <AuthGuard>
        <UserMenu />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Card className="w-96 shadow-lg">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-xl font-bold text-indigo-700">
                Luodaan kysymyssarjoja...
              </p>
              <p className="text-gray-600 mt-2 font-medium">2 vaikeustasoa × {examLength} kysymystä</p>
              <p className="text-gray-500 text-sm mt-1">Tämä kestää muutaman minuutin</p>
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

    return (
      <AuthGuard>
        <UserMenu />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
        <Card className="max-w-3xl shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl flex items-center gap-2">
              ✓ Kysymyssarjat luotu onnistuneesti!
            </CardTitle>
            <CardDescription className="text-white text-lg font-medium">
              Luotiin {questionSetsCreated.length} kysymyssarjaa ({totalQuestionsCreated} kysymystä yhteensä)
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Luodut kysymyssarjat:</h3>
              <div className="space-y-2">
                {questionSetsCreated.map((set, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {difficultyLabels[set.difficulty] || set.difficulty}
                        </p>
                        <p className="text-sm text-gray-600">
                          {set.questionCount} kysymystä
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Koodi:</p>
                        <code className="px-3 py-1 bg-gray-100 rounded font-mono text-lg font-bold">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create" className="text-base">
                  <Star className="w-4 h-4 mr-2" />
                  Luo uusi
                </TabsTrigger>
                <TabsTrigger value="manage" className="text-base">
                  <List className="w-4 h-4 mr-2" />
                  Hallitse sarjoja
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
            <div>
              <label className="block text-lg font-bold mb-3 text-gray-800">
                📌 Kysymyssarjan nimi
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
              <label className="block text-lg font-bold mb-3 text-gray-800">
                📚 Aine
              </label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Esim. Englanti, Matematiikka, Historia"
                className="text-lg"
              />
            </div>

            <GradeSelector selectedGrade={grade} onGradeChange={setGrade} />

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-800">
                📊 Kokeen pituus (kysymystä per vaikeustaso)
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
                  <span className="text-sm text-gray-600">5 kysymystä</span>
                  <span className="text-2xl font-bold text-indigo-600">{examLength}</span>
                  <span className="text-sm text-gray-600">20 kysymystä</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Jokainen vaikeustaso sisältää tämän määrän kysymyksiä
              </p>
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-800">
                🔢 Materiaalista luotavien kysymysten määrä
              </label>
              <div className="space-y-4">
                <Slider
                  min={40}
                  max={400}
                  step={20}
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">40 kysymystä</span>
                  <span className="text-2xl font-bold text-indigo-600">{questionCount}</span>
                  <span className="text-sm text-gray-600">400 kysymystä</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                AI luo tämän määrän kysymyksiä materiaalista (jaetaan vaikeusasteille)
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
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                disabled={!questionSetName.trim() || !subject.trim() || (!materialText.trim() && uploadedFiles.length === 0)}
              >
                Luo kysymyssarjat
              </Button>
            </div>
              </TabsContent>

              <TabsContent value="manage" className="space-y-4">
                {loadingQuestionSets ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : allQuestionSets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">Ei kysymyssarjoja vielä.</p>
                    <p className="text-sm mt-2">Luo ensimmäinen sarjasi "Luo uusi" -välilehdeltä.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Kaikki kysymyssarjat ({allQuestionSets.length})
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
                    {allQuestionSets.map((set) => (
                      <div
                        key={set.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{set.name}</h4>
                            <div className="flex gap-3 mt-2 text-sm text-gray-600">
                              <span>📚 {set.subject}</span>
                              {set.grade && <span>🎓 Luokka {set.grade}</span>}
                              <span>📊 {set.difficulty}</span>
                            </div>
                            <div className="flex gap-3 mt-1 text-sm text-gray-500">
                              <span>{set.question_count} kysymystä</span>
                              <span>•</span>
                              <span>Koodi: <code className="font-mono font-bold">{set.code}</code></span>
                            </div>
                            {set.created_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                Luotu: {new Date(set.created_at).toLocaleDateString('fi-FI')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => router.push(`/play/${set.code}`)}
                              variant="outline"
                              size="sm"
                            >
                              Avaa
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuestionSet(set.id)}
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === set.id}
                              aria-label="Poista kysymyssarja"
                            >
                              {deletingId === set.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
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
