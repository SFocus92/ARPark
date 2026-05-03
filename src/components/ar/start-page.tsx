/**
 * =====================================================
 * СТАРТОВАЯ СТРАНИЦА КВЕСТА
 * =====================================================
 * 
 * Эта страница показывается перед началом квеста.
 * Содержит кнопку "Начать", которая запускает камеру
 * (критично для iOS Safari - нужен жест пользователя).
 * 
 * =====================================================
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PARK_CONFIG } from '@/lib/quest-config';
import { Compass, Camera, MapPin, AlertCircle } from 'lucide-react';

interface StartPageProps {
  onStart: () => void;
}

export function StartPage({ onStart }: StartPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStart = async () => {
    setIsLoading(true);
    // Небольшая задержка для плавности
    await new Promise(resolve => setTimeout(resolve, 300));
    onStart();
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-3 sm:p-4 bg-gradient-to-b from-green-800 via-green-700 to-green-900 overflow-y-auto overflow-x-hidden">
      {/* Фоновый паттерн */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Контент с возможностью скролла */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center py-6 sm:py-8 min-h-screen">
        {/* Логотип и заголовок */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Compass className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight">
            AR-Квест
          </h1>

          <h2 className="text-xl sm:text-2xl md:text-3xl text-amber-400 font-semibold">
            {PARK_CONFIG.name}
          </h2>
        </div>

        {/* Карточка с описанием */}
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-2xl border-0 mb-6">
          <CardContent className="p-4 sm:p-6">
            {/* Описание */}
            <div className="text-center mb-5 sm:mb-6">
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-medium">
                Добро пожаловать в AR-квест парка{' '}
                <span className="font-bold text-green-700">{PARK_CONFIG.name}</span>!
              </p>
              <p className="text-sm sm:text-base text-gray-600 mt-2 sm:mt-3">
                Найдите тайные метки, разгадайте загадки и получите награду!
              </p>
            </div>

            {/* Кнопка "Начать" с пульсацией и градиентом */}
            <Button
              onClick={handleStart}
              disabled={isLoading}
              className="w-full h-14 sm:h-16 md:h-20 text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 relative overflow-hidden border-2 border-yellow-300/50"
              style={{
                animation: !isLoading ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
              }}
            >
              <style>{`
                @keyframes pulse-glow {
                  0%, 100% {
                    box-shadow: 0 0 30px rgba(251, 191, 36, 0.8),
                                0 0 60px rgba(249, 115, 22, 0.6),
                                0 0 90px rgba(239, 68, 68, 0.4),
                                inset 0 0 20px rgba(255, 255, 255, 0.2);
                    transform: scale(1);
                  }
                  50% {
                    box-shadow: 0 0 40px rgba(251, 191, 36, 1),
                                0 0 80px rgba(249, 115, 22, 0.8),
                                0 0 120px rgba(239, 68, 68, 0.6),
                                inset 0 0 30px rgba(255, 255, 255, 0.3);
                    transform: scale(1.02);
                  }
                }
              `}</style>
              {/* Анимированный фоновый слой */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" style={{
                animation: 'shimmer 2s infinite',
                backgroundSize: '200% 100%'
              }} />
              <style>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>

              {isLoading ? (
                <span className="flex items-center gap-2 sm:gap-3 relative z-10">
                  <svg className="animate-spin h-5 sm:h-6 w-5 sm:w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Загрузка...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                  <Camera className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7" />
                  Начать квест
                </span>
              )}
            </Button>

            {/* Инструкции */}
            <div className="space-y-3 sm:space-y-4 mt-5 sm:mt-6">
              <div className="flex items-start gap-3 sm:gap-4 text-gray-600">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base md:text-lg">Ходите по парку и ищите спрятанные маркеры</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 text-gray-600">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base md:text-lg">Наводите камеру на маркеры для обнаружения</span>
              </div>
              <div className="flex items-start gap-3 sm:gap-4 text-gray-600">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base md:text-lg">Соберите все метки и получите промокод</span>
              </div>
            </div>

            {/* Предупреждение для iOS */}
            <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm md:text-base text-amber-700">
                  <strong>Важно:</strong> Нажмите «Разрешить» когда браузер запросит доступ к камере.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default StartPage;
