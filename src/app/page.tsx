'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-cyan-500 via-teal-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-3xl md:text-4xl flex items-center justify-center gap-3 text-white">
              <Star className="w-10 h-10 md:w-12 md:h-12 animate-pulse text-yellow-300" />
              Koekertaaja
            </CardTitle>
            <CardDescription className="text-white text-lg md:text-xl font-medium text-center mt-2">
              Harjoittele kokeisiin ja opi uutta! 🚀
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-4">
            <Button
              onClick={() => router.push('/play')}
              className="w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-purple-600 hover:from-cyan-600 hover:via-teal-600 hover:to-purple-700 text-xl py-8 min-h-[72px] shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <span className="text-3xl mr-3">🎮</span>
              Aloita harjoittelu
            </Button>

            <div className="mt-6 p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 rounded-xl border-2 border-purple-200 shadow-sm">
              <h3 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Näin pääset alkuun:
              </h3>
              <ul className="text-base text-purple-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-xl">🎯</span>
                  <span><strong>Valitse koealue</strong> ja aloita harjoittelu heti</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl">💎</span>
                  <span><strong>Kerää pisteitä</strong> ja rakenna putkia oikeilla vastauksilla</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xl">🏆</span>
                  <span><strong>Avaa saavutuksia</strong> ja ylitä itsesi!</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
