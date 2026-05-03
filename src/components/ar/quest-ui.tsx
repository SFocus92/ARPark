/**
 * =====================================================
 * UI ОВЕРЛЕЙ ВО ВРЕМЯ КВЕСТА (7 ЭТАПОВ)
 * =====================================================
 */

'use client';

import { useQuest } from '@/hooks/use-quest';
import { useQuestStore } from '@/hooks/use-quest';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { PARK_CONFIG, STEPS } from '@/lib/quest-config';
import { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Trophy,
  Gift,
  Volume2,
  VolumeX,
  MapPin
} from 'lucide-react';

export function QuestUI() {
  const {
    progress,
    currentStep,
    message,
    messageType,
    isComplete,
    soundEnabled,
    clearMessage,
    resetQuest,
    toggleSound
  } = useQuest();

  const lastFoundStep = useQuestStore(state => state.lastFoundStep);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [lastStepId, setLastStepId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  // Воспроизведение голоса и автоскрытие после окончания
  useEffect(() => {
    if (message && messageType === 'success' && lastFoundStep?.voiceUrl && soundEnabled && !isPlayingVoice) {
      setIsPlayingVoice(true);

      // Создаём и воспроизводим аудио
      const audio = new Audio(lastFoundStep.voiceUrl);
      audioRef.current = audio;

      audio.play().catch(err => {
        console.error('[Audio] Ошибка воспроизведения:', err);
        setIsPlayingVoice(false);
      });

      // Когда аудио закончилось - скрываем сообщение
      const handleEnded = () => {
        clearMessage();
        setIsPlayingVoice(false);
        audioRef.current = null;
      };

      audio.addEventListener('ended', handleEnded);

      // Cleanup только при размонтировании компонента, НЕ при изменении message
      return () => {
        audio.removeEventListener('ended', handleEnded);
        // НЕ останавливаем аудио - пусть доиграет до конца
      };
    }
  }, [lastFoundStep, soundEnabled]); // Убрали message из зависимостей!

  // Показываем подсказку при смене этапа и автоматически скрываем через 8 секунд
  useEffect(() => {
    if (currentStep && currentStep.id !== lastStepId) {
      setShowHint(true);
      setLastStepId(currentStep.id);

      const timeout = setTimeout(() => {
        setShowHint(false);
      }, 8000); // 8 секунд на чтение подсказки

      return () => clearTimeout(timeout);
    }
  }, [currentStep, lastStepId]);
  
  const handleReset = () => {
    if (showResetConfirm) {
      resetQuest();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };
  
  return (
    <>
      {/* =====================================================
          ВЕРХНИЙ БАР С ПРОГРЕССОМ
          ===================================================== */}
      <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-3 md:p-4">
        <Card className="bg-black/80 backdrop-blur-md border-white/20 shadow-xl">
          <CardContent className="p-3 sm:p-4">
            {/* Заголовок и прогресс */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base sm:text-lg md:text-xl">
                  {PARK_CONFIG.name}
                </span>
                <span className="text-amber-400 text-sm sm:text-base md:text-lg font-semibold">
                  {progress.current}/{progress.total}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Кнопка звука */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                {/* Кнопка сброса */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className={`h-8 px-2 text-white/70 hover:text-white hover:bg-white/10 ${
                    showResetConfirm ? 'bg-red-500/30 hover:bg-red-500/40' : ''
                  }`}
                >
                  <RotateCcw className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{showResetConfirm ? 'Подтвердить' : 'Сброс'}</span>
                </Button>
              </div>
            </div>
            
            {/* Прогресс-бар */}
            <Progress 
              value={progress.percentage} 
              className="h-2 sm:h-3 bg-white/20"
            />
            
            {/* Подсказка для текущего шага - автоматически исчезает через 8 секунд */}
            {currentStep && !isComplete && showHint && (
              <div className="mt-2 bg-amber-500/20 rounded-lg p-2 sm:p-3 animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 sm:gap-2 text-amber-400 text-sm sm:text-base md:text-lg font-semibold flex-1">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>Этап {currentStep.order} из 7: {currentStep.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(false)}
                    className="h-6 w-6 p-0 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/20 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white/70 text-xs sm:text-sm md:text-base mt-1 line-clamp-2">
                  {currentStep.location}
                </p>
              </div>
            )}
            
            {/* Если квест завершён */}
            {isComplete && (
              <div className="mt-2 flex items-center gap-1 sm:gap-2 text-green-400 text-sm sm:text-base md:text-lg font-semibold">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>🏆 Квест пройден! Найдите промокод!</span>
              </div>
            )}
            
            {/* Индикаторы этапов */}
            <div className="mt-2 flex justify-center gap-1">
              {STEPS.map((step, index) => {
                const isCompleted = index < progress.current;
                const isCurrent = index === progress.current;
                
                return (
                  <div
                    key={step.id}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-amber-500 text-white animate-pulse' 
                          : 'bg-white/20 text-white/50'
                    }`}
                  >
                    {isCompleted ? '✓' : step.order}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* =====================================================
          СООБЩЕНИЯ ДЛЯ ИГРОКА (только верхние уведомления)
          ===================================================== */}
      {message && (
        <div className="fixed top-36 sm:top-40 md:top-44 left-2 right-2 sm:left-3 sm:right-3 md:left-4 md:right-4 z-50">
          <Card className={`backdrop-blur-md border-2 shadow-2xl animate-in slide-in-from-top duration-300 ${
            messageType === 'success' ? 'bg-green-600/95 border-green-400' :
            messageType === 'error' ? 'bg-red-600/95 border-red-400' :
            'bg-blue-600/95 border-blue-400'
          }`}>
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div className="flex items-start gap-2 sm:gap-3">
                {messageType === 'success' && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5" />}
                {messageType === 'error' && <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5" />}
                {messageType === 'info' && <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0 mt-0.5" />}

                <p className="text-white text-sm sm:text-base md:text-lg flex-1 whitespace-pre-wrap leading-relaxed">{message}</p>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessage}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-white/70 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* =====================================================
          ФИНАЛЬНЫЙ ЭКРАН
          ===================================================== */}
      {isComplete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
          <Card className="w-full max-w-sm bg-gradient-to-b from-amber-900 to-amber-950 border-amber-500 shadow-2xl">
            <CardContent className="p-4 sm:p-6 text-center">
              {/* Иконка */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-bounce" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-amber-300 mb-2">
                🎉 Поздравляем!
              </h2>
              
              <p className="text-amber-100 text-sm sm:text-base mb-4">
                Вы прошли AR-квест парка &quot;{PARK_CONFIG.name}&quot;!
              </p>
              
              {/* Промокод */}
              <div className="bg-amber-800/50 rounded-lg p-3 sm:p-4 mb-4 border border-amber-600/50">
                <div className="flex items-center justify-center gap-2 text-amber-200 mb-1">
                  <Gift className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Ваш промокод</span>
                </div>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wider">
                  {PARK_CONFIG.promoCode}
                </p>
                <p className="text-amber-300 text-sm mt-1">
                  Скидка {PARK_CONFIG.discount} на посещение!
                </p>
              </div>
              
              <p className="text-amber-200/70 text-xs mb-4">
                Покажите этот промокод на кассе или используйте при онлайн-покупке
              </p>
              
              <Button
                onClick={resetQuest}
                variant="outline"
                className="w-full border-amber-600 text-amber-300 hover:bg-amber-800/50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Пройти заново
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* =====================================================
          ИНСТРУКЦИЯ ВНИЗУ
          ===================================================== */}
      {!isComplete && (
        <div className="fixed bottom-4 left-2 right-2 sm:left-3 sm:right-3 md:left-4 md:right-4 z-40">
          <Card className="bg-black/70 backdrop-blur-md border-white/20">
            <CardContent className="p-3 sm:p-4">
              <p className="text-white/70 text-sm sm:text-base md:text-lg text-center">
                📷 Наведите камеру на объект парка для обнаружения маркера
              </p>
              <p className="text-amber-400/70 text-xs sm:text-sm text-center mt-1">
                💡 Для теста: тапните по экрану для имитации
              </p>
              {/* Кнопка показа подсказки */}
              {!showHint && currentStep && (
                <Button
                  onClick={() => setShowHint(true)}
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 text-xs sm:text-sm"
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Показать подсказку
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default QuestUI;
