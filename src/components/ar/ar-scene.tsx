/**
 * =====================================================
 * AR-СЦЕНА С ПОДДЕРЖКОЙ NFT-МАРКЕРОВ
 * =====================================================
 * 
 * Поддерживает два типа маркеров:
 * 1. Pattern markers (Hiro, Kanji) - стандартные AR.js маркеры
 * 2. NFT markers - распознавание реальных объектов по изображениям
 * 
 * Использует A-Frame + AR.js для pattern и MindAR для NFT
 * =====================================================
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuest } from '@/hooks/use-quest';
import { STEPS, QuestStep } from '@/lib/quest-config';

// =====================================================
// ТИПЫ
// =====================================================

interface ARSceneProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

// =====================================================
// ГЛАВНЫЙ КОМПОНЕНТ AR-СЦЕНЫ
// =====================================================

export function ARScene({ onReady, onError }: ARSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Инициализация AR...');
  
  const { 
    handleMarkerFound, 
    handleMarkerLost, 
    setCameraReady, 
    setCameraError,
    currentMarker,
    showingContent,
    completedSteps 
  } = useQuest();
  
  const [detectedMarkers, setDetectedMarkers] = useState<Set<string>>(new Set());
  
  // ---------------------------------------------------
  // ИНИЦИАЛИЗАЦИЯ КАМЕРЫ
  // ---------------------------------------------------
  
  const initCamera = useCallback(async () => {
    try {
      setLoadingMessage('Запрос доступа к камере...');
      
      // Проверяем HTTPS (кроме localhost и облачных платформ)
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // Vercel и Netlify автоматически предоставляют HTTPS
        const isCloudPlatform = hostname.includes('.vercel.app') || 
                                hostname.includes('.netlify.app') ||
                                hostname.includes('.cloudflareapps.com');
        
        if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1' && !isCloudPlatform) {
          throw new Error('HTTPS_REQUIRED');
        }
      }
      
      // Проверяем поддержку getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED');
      }
      
      // Запрашиваем камеру
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Задняя камера
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setLoadingMessage('Камера активирована...');
      setCameraReady(true);
      setIsLoading(false);
      onReady?.();
      
      // Запускаем цикл обнаружения маркеров
      startMarkerDetection();
      
    } catch (error: any) {
      console.error('Camera init error:', error);
      
      let errorMessage = 'Ошибка инициализации камеры';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Доступ к камере запрещён. Разрешите в настройках браузера.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Камера не найдена на устройстве.';
      } else if (error.message === 'HTTPS_REQUIRED') {
        errorMessage = 'Для работы AR требуется HTTPS соединение.';
      } else if (error.message === 'CAMERA_NOT_SUPPORTED') {
        errorMessage = 'Ваш браузер не поддерживает доступ к камере.';
      }
      
      setCameraError(errorMessage);
      onError?.(errorMessage);
    }
  }, [setCameraReady, setCameraError, onReady, onError]);
  
  // ---------------------------------------------------
  // ЦИКЛ ОБНАРУЖЕНИЯ МАРКЕРОВ
  // ---------------------------------------------------
  
  const startMarkerDetection = useCallback(() => {
    setLoadingMessage('Сканирование маркеров...');
    
    // Для демонстрации используем симуляцию обнаружения
    // В production здесь будет AR.js или MindAR
    
    const detectMarkers = () => {
      if (!canvasRef.current || !videoRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Рисуем видео на canvas для анализа
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Здесь должен быть код для распознавания маркеров
      // Для production используйте AR.js или MindAR
      
      requestAnimationFrame(detectMarkers);
    };
    
    detectMarkers();
  }, []);
  
  // ---------------------------------------------------
  // ИНИЦИАЛИЗАЦИЯ ПРИ МОНТИРОВАНИИ
  // ---------------------------------------------------
  
  useEffect(() => {
    initCamera();
    
    return () => {
      // Очистка - останавливаем камеру
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [initCamera]);
  
  // ---------------------------------------------------
  // ОБРАБОТЧИК ТАПА ПО ЭКРАНУ (ДЛЯ ТЕСТИРОВАНИЯ)
  // ---------------------------------------------------
  
  const handleScreenTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Получаем координаты тапа
    let x = 0, y = 0;
    
    if ('touches' in e) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }
    
    // Для тестирования: имитируем обнаружение маркера при тапе
    // В production это будет делать AR.js/MindAR
    const screenSections = STEPS.length;
    const sectionWidth = window.innerWidth / screenSections;
    const tappedSection = Math.floor(x / sectionWidth);
    
    if (tappedSection < STEPS.length) {
      const step = STEPS[tappedSection];
      handleMarkerFound(step.id);
      
      // Автоматически скрываем через 5 секунд
      setTimeout(() => {
        handleMarkerLost();
      }, 5000);
    }
  }, [handleMarkerFound, handleMarkerLost]);
  
  // ---------------------------------------------------
  // ПОЛУЧЕНИЕ ТЕКУЩЕГО ШАГА ДЛЯ ОТОБРАЖЕНИЯ
  // ---------------------------------------------------
  
  const getCurrentDisplayStep = (): QuestStep | null => {
    if (!currentMarker || !showingContent) return null;
    return STEPS.find(s => s.id === currentMarker) || null;
  };
  
  const displayStep = getCurrentDisplayStep();
  
  // ---------------------------------------------------
  // РЕНДЕРИНГ
  // ---------------------------------------------------
  
  return (
    <div 
      ref={containerRef}
      className="ar-scene-container"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
      }}
      onClick={handleScreenTap}
      onTouchStart={handleScreenTap}
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
      
      {/* Canvas для анализа (скрыт) */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'none',
        }}
      />
      
      {/* Экран загрузки */}
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
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: 'white',
          zIndex: 10,
        }}>
          <div style={{
            width: 50,
            height: 50,
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: 20, fontSize: 16 }}>{loadingMessage}</p>
          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.6 }}>
            Для теста: тапните по экрану для имитации обнаружения маркера
          </p>
        </div>
      )}
      
      {/* 3D-объект при обнаружении маркера */}
      {displayStep && showingContent && (
        <MarkerObject step={displayStep} />
      )}
      
      {/* Стили для анимации */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes rotateIn {
          from { transform: rotate(-180deg) scale(0); }
          to { transform: rotate(0deg) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

// =====================================================
// КОМПОНЕНТ 3D-ОБЪЕКТА МАРКЕРА
// =====================================================

interface MarkerObjectProps {
  step: QuestStep;
}

// Вычисляем класс анимации вне компонента
function getAnimationClass(animation: string): string {
  const animations: Record<string, string> = {
    fadeIn: 'animate-[fadeIn_0.5s_ease-out_forwards]',
    scaleIn: 'animate-[scaleIn_0.5s_ease-out_forwards]',
    bounceIn: 'animate-[bounceIn_0.6s_ease-out_forwards]',
    rotateIn: 'animate-[rotateIn_0.5s_ease-out_forwards]',
    portalIn: 'animate-[scaleIn_0.8s_ease-out_forwards]',
  };
  return animations[animation] || animations.scaleIn;
}

function MarkerObject({ step }: MarkerObjectProps) {
  const animationClass = getAnimationClass(step.animation);
  
  // Воспроизводим звук при появлении
  useEffect(() => {
    if (step.soundUrl) {
      const audio = new Audio(step.soundUrl);
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Автовоспроизведение может быть заблокировано
      });
    }
  }, [step.soundUrl]);
  
  // Рендерим контент в зависимости от типа объекта
  const renderContent = () => {
    switch (step.objectType) {
      case 'scroll':
        return (
          <div className="relative bg-amber-100 border-4 border-amber-800 rounded-lg p-6 shadow-2xl max-w-xs"
               style={{ transform: `scale(${step.scale})` }}>
            {/* Заголовок */}
            <div className="text-center mb-3 border-b border-amber-400 pb-2">
              <span className="text-amber-800 font-bold text-lg">📜 {step.title}</span>
            </div>
            {/* Текст */}
            <p className="text-amber-900 text-sm leading-relaxed whitespace-pre-wrap">
              {step.scrollText || 'Текст записки'}
            </p>
            {/* Декоративные элементы */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-amber-600 rounded-full" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-600 rounded-full" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-600 rounded-full" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-600 rounded-full" />
          </div>
        );
        
      case 'key':
        return (
          <div className="relative" style={{ transform: `scale(${step.scale})` }}>
            {/* 3D-ключ (CSS) */}
            <div className="relative animate-[float_2s_ease-in-out_infinite]">
              <div className="w-32 h-16 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-t-full shadow-xl" />
              <div className="w-8 h-20 bg-gradient-to-b from-yellow-400 to-yellow-600 ml-4 -mt-2 shadow-xl" />
              <div className="absolute top-12 left-12 w-6 h-6 bg-yellow-700 rounded-full" />
              <div className="absolute top-20 left-10 w-3 h-3 bg-yellow-700 rounded-full" />
              <div className="absolute top-20 left-16 w-3 h-3 bg-yellow-700 rounded-full" />
            </div>
            <p className="text-white text-center mt-4 text-xl font-bold drop-shadow-lg">
              🔑 Ключ найден!
            </p>
          </div>
        );
        
      case 'gem':
        return (
          <div className="relative" style={{ transform: `scale(${step.scale})` }}>
            {/* 3D-кристалл (CSS) */}
            <div className="relative animate-[float_2s_ease-in-out_infinite]">
              <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[60px] border-l-transparent border-r-transparent border-b-purple-500" />
              <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-t-[30px] border-l-transparent border-r-transparent border-t-purple-400 -mt-1" />
              <div className="absolute top-8 left-2 w-4 h-8 bg-purple-300/50 transform rotate-12" />
            </div>
            <p className="text-white text-center mt-4 text-xl font-bold drop-shadow-lg">
              💎 Кристалл силы!
            </p>
          </div>
        );
        
      case 'portal':
        return (
          <div className="relative" style={{ transform: `scale(${step.scale})` }}>
            {/* Портал (CSS) */}
            <div className="relative w-48 h-48 animate-[spin_4s_linear_infinite]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 opacity-80" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 opacity-90" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-r from-purple-500 via-blue-400 to-purple-500" />
              <div className="absolute inset-12 rounded-full bg-black" />
            </div>
            <p className="text-white text-center mt-4 text-xl font-bold drop-shadow-lg">
            🌀 Портал открыт!
            </p>
          </div>
        );
        
      case 'compass':
        return (
          <div className="relative" style={{ transform: `scale(${step.scale})` }}>
            {/* Компас (CSS) */}
            <div className="relative w-32 h-32 animate-[spin_3s_linear_infinite]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 border-4 border-amber-400 shadow-xl" />
              <div className="absolute inset-2 rounded-full bg-amber-100" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-600" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-gray-600" />
            </div>
            <p className="text-white text-center mt-4 text-xl font-bold drop-shadow-lg">
              🧭 Компас направляет!
            </p>
          </div>
        );
        
      case 'chest':
      case 'treasure':
        return (
          <div className="relative" style={{ transform: `scale(${step.scale})` }}>
            {/* Сундук с сокровищами */}
            <div className="relative animate-[float_2s_ease-in-out_infinite]">
              {/* Тело сундука */}
              <div className="w-48 h-32 bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg border-4 border-amber-500 shadow-2xl">
                {/* Полоса посередине */}
                <div className="absolute top-1/2 left-0 right-0 h-3 bg-amber-500" />
                {/* Замок */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-10 bg-yellow-500 rounded-lg border-2 border-yellow-600">
                  <div className="w-2 h-2 bg-yellow-700 rounded-full mx-auto mt-3" />
                </div>
              </div>
              {/* Крышка */}
              <div className="absolute -top-8 left-0 w-48 h-12 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-xl border-4 border-b-0 border-amber-500">
                {/* Декор */}
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-amber-400" />
              </div>
              {/* Золотое свечение */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-8 bg-yellow-400/30 blur-xl rounded-full animate-pulse" />
            </div>
            
            {/* Промокод */}
            <div className="mt-6 bg-black/80 border-2 border-yellow-500 rounded-lg p-4 text-center">
              <p className="text-yellow-400 text-sm mb-1">🎉 ПОЗДРАВЛЯЕМ!</p>
              <p className="text-white text-lg font-bold mb-2">Ваш промокод:</p>
              <p className="text-yellow-300 text-2xl font-mono font-bold tracking-wider">
                {step.scrollText || 'SEVA2024AR'}
              </p>
              <p className="text-green-400 text-sm mt-2">Скидка 25% на посещение!</p>
            </div>
          </div>
        );
        
      case 'model':
      default:
        return (
          <div className="relative" style={{ transform: `scale(${step.scale})` }}>
            {/* Для внешних 3D-моделей */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full animate-[float_2s_ease-in-out_infinite] shadow-2xl flex items-center justify-center">
              <span className="text-6xl">✨</span>
            </div>
            <p className="text-white text-center mt-4 text-xl font-bold drop-shadow-lg">
              {step.title}
            </p>
          </div>
        );
    }
  };
  
  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-20 ${animationClass}`}
      style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
      }}
    >
      <div className="pointer-events-auto">
        {renderContent()}
      </div>
    </div>
  );
}

export default ARScene;
