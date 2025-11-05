'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GradeSelector } from '@/components/create/GradeSelector';
import { MaterialUpload } from '@/components/create/MaterialUpload';
import { Loader2, Star } from 'lucide-react';

type CreateState = 'form' | 'loading' | 'success';

export default function CreatePage() {
  const router = useRouter();

  // Form state
  const [state, setState] = useState<CreateState>('form');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [examLength, setExamLength] = useState(20);
  const [questionCount, setQuestionCount] = useState(100);
  const [questionSetName, setQuestionSetName] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  // Success state
  const [questionSetsCreated, setQuestionSetsCreated] = useState<any[]>([]);
  const [totalQuestionsCreated, setTotalQuestionsCreated] = useState(0);

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
        const errorMessage = data.details
          ? `${data.error}: ${data.details.join(', ')}`
          : data.error || 'Kysymysten luonti epäonnistui';
        throw new Error(errorMessage);
      }

      // Success
      setQuestionSetsCreated(data.questionSets || []);
      setTotalQuestionsCreated(data.totalQuestions || 0);
      setState('success');
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err instanceof Error ? err.message : 'Kysymysten luonti epäonnistui');
      setState('form');
    }
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  const handleBrowseSets = () => {
    router.push('/play');
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-xl font-bold text-indigo-700">
              Luodaan kysymyssarjoja...
            </p>
            <p className="text-gray-600 mt-2 font-medium">4 vaikeustasoa × {examLength} kysymystä</p>
            <p className="text-gray-500 text-sm mt-1">Tämä kestää muutaman minuutin</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (state === 'success') {
    const difficultyLabels: Record<string, string> = {
      helppo: 'Helppo',
      normaali: 'Normaali',
      vaikea: 'Vaikea',
      mahdoton: 'Mahdoton',
    };

    return (
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
    );
  }

  // Form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl flex items-center gap-2 text-white">
              <Star className="w-8 h-8" />
              Luo kysymyssarja
            </CardTitle>
            <CardDescription className="text-white text-lg font-medium">
              Valitse asetukset ja lataa oppimateriaalisi
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
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
              <Input
                type="number"
                min={10}
                max={50}
                value={examLength}
                onChange={(e) => setExamLength(parseInt(e.target.value) || 20)}
                placeholder="20"
                className="text-lg"
              />
              <p className="text-sm text-gray-600 mt-2">
                Jokainen vaikeustaso sisältää tämän määrän kysymyksiä
              </p>
            </div>

            <div>
              <label className="block text-lg font-bold mb-3 text-gray-800">
                🔢 Materiaalista luotavien kysymysten määrä
              </label>
              <Input
                type="number"
                min={50}
                max={200}
                step={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 100)}
                placeholder="100"
                className="text-lg"
              />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
