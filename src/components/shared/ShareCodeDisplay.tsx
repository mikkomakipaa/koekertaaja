import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShareNetwork, Copy } from '@phosphor-icons/react';
import { useState } from 'react';

interface ShareCodeDisplayProps {
  code: string;
  questionSetName: string;
  questionCount: number;
  onPlayNow: () => void;
  onBackToMenu: () => void;
}

export function ShareCodeDisplay({
  code,
  questionSetName,
  questionCount,
  onPlayNow,
  onBackToMenu,
}: ShareCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg text-center">
            <div className="flex justify-center mb-4">
              <Share2 className="w-20 h-20 text-white" />
            </div>
            <CardTitle className="text-4xl text-white">Kysymyssarja tallennettu!</CardTitle>
            <CardDescription className="text-white text-xl mt-2 font-medium">
              {questionSetName}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <p className="text-lg font-bold text-gray-800 mb-3">📋 Jaa tämä koodi muille:</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white p-4 rounded-lg border-2 border-indigo-300">
                  <p className="text-3xl font-mono font-bold text-indigo-600 text-center">
                    {code}
                  </p>
                </div>
                <Button onClick={copyToClipboard} className="bg-indigo-600 hover:bg-indigo-700">
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 font-medium mt-2">✓ Kopioitu leikepöydälle!</p>
              )}
              <p className="text-sm text-gray-600 mt-3 font-medium">
                Muut voivat käyttää tätä koodia ladatakseen kysymyssarjan ja pelaamaan ilman
                kirjautumista!
              </p>
            </div>

            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-base">
                <strong>✨ Luotu {questionCount} kysymystä!</strong>
                <br />
                Jokaisessa pelissä valitaan 15 satunnaista kysymystä, joten sama sarja toimii
                moneen kertaan.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={onBackToMenu} variant="outline" className="flex-1">
                Palaa valikkoon
              </Button>
              <Button onClick={onPlayNow} className="flex-1">
                Pelaa nyt!
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
