'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubjectSelector } from '@/components/create/SubjectSelector';
import { DifficultySelector } from '@/components/create/DifficultySelector';
import { GradeSelector } from '@/components/create/GradeSelector';
import { QuestionCountSelector } from '@/components/create/QuestionCountSelector';
import { MaterialUpload } from '@/components/create/MaterialUpload';
import { ShareCodeDisplay } from '@/components/shared/ShareCodeDisplay';
import { Subject, Difficulty } from '@/types';
import { getSubject } from '@/config/subjects';
import { Loader2, Star } from 'lucide-react';

type CreateState = 'form' | 'loading' | 'success';

export default function CreatePage() {
  const router = useRouter();

  // Form state
  const [state, setState] = useState<CreateState>('form');
  const [subject, setSubject] = useState<Subject>('english');
  const [difficulty, setDifficulty] = useState<Difficulty>('normaali');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [questionCount, setQuestionCount] = useState(50);
  const [questionSetName, setQuestionSetName] = useState('');
  const [materialText, setMaterialText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');

  // Success state
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedQuestionCount, setGeneratedQuestionCount] = useState(0);

  const subjectConfig = getSubject(subject);

  const handleSubmit = async () => {
    // Validation
    if (!questionSetName.trim()) {
      setError('Anna kysymyssarjalle nimi!');
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
      formData.append('difficulty', difficulty);
      formData.append('questionCount', questionCount.toString());
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
        throw new Error(data.error || 'Kysymysten luonti epäonnistui');
      }

      // Success
      setGeneratedCode(data.code);
      setGeneratedQuestionCount(data.questionCount);
      setState('success');
    } catch (err) {
      console.error('Error generating questions:', err);
      setError(err instanceof Error ? err.message : 'Kysymysten luonti epäonnistui');
      setState('form');
    }
  };

  const handlePlayNow = () => {
    router.push(`/play/${generatedCode}`);
  };

  const handleBackToMenu = () => {
    router.push('/');
  };

  // Loading screen
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96 shadow-lg">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
            <p className="text-xl font-bold text-indigo-700">
              Luodaan {questionCount} kysymystä...
            </p>
            <p className="text-gray-600 mt-2 font-medium">Tämä kestää hetken (30-60 sekuntia)</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (state === 'success') {
    return (
      <ShareCodeDisplay
        code={generatedCode}
        questionSetName={questionSetName}
        questionCount={generatedQuestionCount}
        onPlayNow={handlePlayNow}
        onBackToMenu={handleBackToMenu}
      />
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

            <SubjectSelector selectedSubject={subject} onSubjectChange={setSubject} />

            <GradeSelector selectedGrade={grade} onGradeChange={setGrade} />

            <DifficultySelector
              selectedDifficulty={difficulty}
              onDifficultyChange={setDifficulty}
            />

            <QuestionCountSelector
              subject={subject}
              questionCount={questionCount}
              onQuestionCountChange={setQuestionCount}
            />

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
                disabled={!questionSetName.trim() || (!materialText.trim() && uploadedFiles.length === 0)}
              >
                Luo {questionCount} kysymystä
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
