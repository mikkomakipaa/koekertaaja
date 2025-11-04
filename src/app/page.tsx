'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadByCode } from '@/components/shared/LoadByCode';
import { Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [loadCode, setLoadCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoadByCode = async () => {
    if (loadCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      // Navigate to play page with the code
      router.push(`/play/${loadCode}`);
    } catch (err) {
      setError('Virhe kysymyssarjan lataamisessa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl flex items-center gap-2 text-white">
              <Star className="w-8 h-8" />
              Kielikokeen kertaaja
            </CardTitle>
            <CardDescription className="text-white text-lg font-medium">
              Luo kysymyksiä oppimateriaalista tai lataa valmis sarja
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <Button
              onClick={() => router.push('/create')}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
            >
              📝 Luo uusi kysymyssarja
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 font-medium">TAI</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <LoadByCode
              code={loadCode}
              loading={loading}
              onCodeChange={setLoadCode}
              onLoad={handleLoadByCode}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-gray-800 mb-2">ℹ️ Miten tämä toimii?</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Luo uusi kysymyssarja lataamalla oppimateriaaleja tai kirjoittamalla tekstiä</li>
                <li>Jaa kysymyssarjan koodi ystäville</li>
                <li>Pelaa kysymyksiä ja opi uutta!</li>
                <li>Ei vaadi kirjautumista - kaikki toimii koodilla</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
