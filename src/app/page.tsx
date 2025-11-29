'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-12 transition-colors">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <Star className="w-8 h-8 text-purple-500 dark:text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">Koekertaaja</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Harjoittele kokeisiin ja opi uutta</p>
        </div>

        {/* Start Button */}
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/play')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-8 rounded-xl font-bold text-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <BookOpen className="w-8 h-8 mr-3" />
            Aloita harjoittelu
          </Button>
        </div>

        {/* Features */}
        <div className="mt-12 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <h3 className="font-semibold text-gray-900">Kerää pisteitä</h3>
              <p className="text-gray-600 text-sm">Saat 10 pistettä per oikea vastaus, +5 putkesta</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h3 className="font-semibold text-gray-900">Rakenna putkia</h3>
              <p className="text-gray-600 text-sm">Vastaa 3+ oikein peräkkäin bonuspisteisiin</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-semibold text-gray-900">Avaa saavutuksia</h3>
              <p className="text-gray-600 text-sm">Täydelliset pisteet ja pitkät putket ansaitsevat merkkejä</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
