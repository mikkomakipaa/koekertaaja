'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <Star className="w-8 h-8 text-purple-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Koekertaaja</h1>
          </div>
          <p className="text-lg text-gray-600 mt-2">Harjoittele kokeisiin ja opi uutta</p>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
            Valitse vaikeustaso
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => router.push('/play?difficulty=helppo')}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-2xl mr-2">😊</span>
              Helppo
            </Button>
            <Button
              onClick={() => router.push('/play?difficulty=normaali')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-2xl mr-2">🎯</span>
              Normaali
            </Button>
            <Button
              onClick={() => router.push('/play?difficulty=vaikea')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-2xl mr-2">💪</span>
              Vaikea
            </Button>
            <Button
              onClick={() => router.push('/play?difficulty=mahdoton')}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-6 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all"
            >
              <span className="text-2xl mr-2">🔥</span>
              Mahdoton
            </Button>
          </div>
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
