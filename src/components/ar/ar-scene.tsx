/**
 * =====================================================
 * AR-СЦЕНА - ПРОСТОЙ СКАНЕР С КАМЕРОЙ
 * =====================================================
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuest } from '@/hooks/use-quest';
import { STEPS, QuestStep } from '@/lib/quest-config';

interface ARSceneProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function ARScene({ onReady, onError }: ARSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { 
    handleMarkerFound, 
    handleMarkerLost,
    setCameraReady, 
    setCameraError,
    currentMarker,
    showingContent,
    completedSteps,
  } = useQuest();

  // ---------------------------------------------------
  // ИНИЦИАЛИЗАЦИЯ КАМЕРЫ
  // ---------------------------------------------------
  
  const initCamera = useCallback(async () => {
    try {
      console.log('[AR] Инициализация камеры...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера не поддерживается браузером');
      }
      
      // Запрашиваем доступ к камере
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('[AR] Камера доступна');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsLoading(false);
      setCameraReady(true);
      onReady?.();
      
      console.log('[AR] Готов к работе!');
      
    } catch (error: any) {
      console.error('[AR] Ошибка камеры:', error);
      
      let msg = 'Ошибка камеры';
      if (error.name === 'NotAllowedError') {
        msg = 'Доступ к камере запрещён. Разрешите в настройках браузера.';
      } else if (error.name === 'NotFoundError') {
        msg = 'Камера не найдена на устройстве.';
      }
      
      setErrorMessage(msg);
      setCameraError(msg);
      onError?.(msg);
      setIsLoading(false);
    }
  }, [setCameraReady, setCameraError, onReady, onError]);

  // ---------------------------------------------------
  // ОБРАБОТЧИК ТАПА ПО ЭКРАНУ (СИМУЛЯЦИЯ)
  // ---------------------------------------------------
  
  const handleScreenTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // При тапе имитируем обнаружение маркера
    // Это позволяет тестировать без реального AR
    const step = STEPS[completedSteps];
    if (step) {
      handleMarkerFound(step.id);
      
      // Через 3 секунды скрываем
      setTimeout(() => {
        handleMarkerLost();
      }, 3000);
    }
  }, [handleMarkerFound, handleMarkerLost, completedSteps]);

  // ---------------------------------------------------
  // МОНТИРОВАНИЕ
  // ---------------------------------------------------
  
  useEffect(() => {
    initCamera();
    
    return () => {
      // Останавливаем камеру при выходе
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [initCamera]);

  // ---------------------------------------------------
  // РЕНДЕРИНГ
  // ---------------------------------------------------
  
  const displayStep = currentMarker && showingContent 
    ? STEPS.find(s => s.id === currentMarker) 
    : null;
  
  const currentStep = STEPS[completedSteps];

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 0,
        backgroundColor: '#000',
      }}
      onClick={handleScreenTap}
    >
      {/* Видео с камеры */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Статус */}
      {!isLoading && !errorMessage && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: '12px 24px',
          borderRadius: 25,
          color: '#22c55e',
          fontSize: '16px',
          zIndex: 60,
          fontWeight: 'bold',
          border: '2px solid #22c55e',
        }}>
          📷 Тапните по экрану для теста
        </div>
      )}

      {/* Прогресс */}
      {!isLoading && !errorMessage && (
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '15px 25px',
          borderRadius: 30,
          color: 'white',
          fontSize: '15px',
          zIndex: 50,
        }}>
          📍 Этап {completedSteps + 1} из {STEPS.length}: {currentStep?.title || 'Квест завершён'}
        </div>
      )}

      {/* 3D объект */}
      {displayStep && showingContent && (
        <MarkerObject step={displayStep} />
      )}

      {/* Загрузка */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.95)',
          color: 'white',
          zIndex: 100,
        }}>
          <div style={{
            width: 60,
            height: 60,
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: 20, fontSize: 18 }}>Инициализация камеры...</p>
          <p style={{ marginTop: 10, fontSize: 14, opacity: 0.7 }}>
            Разрешите доступ к камере
          </p>
        </div>
      )}

      {/* Ошибка */}
      {errorMessage && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.95)',
          color: 'white',
          zIndex: 100,
          padding: '20px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 24, color: '#ef4444', marginBottom: 20 }}>⚠️ Ошибка</p>
          <p style={{ fontSize: 16 }}>{errorMessage}</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// =====================================================
// 3D-ОБЪЕКТ
// =====================================================

interface MarkerObjectProps {
  step: QuestStep;
}

function MarkerObject({ step }: MarkerObjectProps) {
  const animations: Record<string, string> = {
    fadeIn: 'animate-[fadeIn_0.5s_ease-out_forwards]',
    scaleIn: 'animate-[scaleIn_0.5s_ease-out_forwards]',
    bounceIn: 'animate-[bounceIn_0.6s_ease-out_forwards]',
    rotateIn: 'animate-[rotateIn_0.5s_ease-out_forwards]',
    portalIn: 'animate-[scaleIn_0.8s_ease-out_forwards]',
  };
  
  const animClass = animations[step.animation] || animations.scaleIn;

  const content = (
    <div style={{ transform: `scale(${step.scale})`, textAlign: 'center', maxWidth: '90%' }}>
      <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl mx-auto">
        <span style={{ fontSize: '48px' }}>✨</span>
      </div>
      <p className="text-white text-2xl font-bold mt-4">{step.title}</p>
      {step.scrollText && (
        <div className="mt-4 bg-black/80 border-2 border-yellow-500 rounded-lg p-4 max-w-sm mx-auto">
          <p className="text-yellow-300 text-base">{step.scrollText}</p>
        </div>
      )}
      {step.clueForNext && (
        <div className="mt-3 bg-blue-900/80 border border-blue-400 rounded-lg p-3 max-w-sm mx-auto">
          <p className="text-blue-200 text-sm">{step.clueForNext}</p>
        </div>
      )}
      {step.id === 'marker_lake' && (
        <div className="mt-6 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl p-6">
          <p className="text-white text-3xl font-bold">🎉 SEVA2024AR</p>
          <p className="text-white text-lg mt-2">Скидка 25%!</p>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-30 ${animClass}`}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      {content}
    </div>
  );
}

export default ARScene;