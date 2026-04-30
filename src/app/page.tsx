/**
 * =====================================================
 * ГЛАВНАЯ СТРАНИЦА AR-КВЕСТА
 * =====================================================
 * 
 * Эта страница управляет всем приложением:
 * - Показывает стартовую страницу
 * - Инициализирует AR-сцену
 * - Управляет состоянием квеста
 * 
 * =====================================================
 */

'use client';

import { useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { StartPage } from '@/components/ar/start-page';
import { QuestUI } from '@/components/ar/quest-ui';
import { ErrorScreen } from '@/components/ar/error-screen';
import { useQuest } from '@/hooks/use-quest';

// =====================================================
// ЗАГРУЗКА MINDAR через динамический import() + A-FRAME
// =====================================================

async function loadARLibs(): Promise<boolean> {
  if ((window as any).MINDAR && (window as any).THREE) {
    console.log('[AR] Уже загружено');
    return true;
  }
  
  // 1. Загружаем A-Frame
  console.log('[AR] Загрузка A-Frame...');
  await new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      console.log('[AR] A-Frame загружен');
      resolve();
    };
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
  
  // 2. Ждём THREE
  console.log('[AR] Ожидание THREE...');
  await new Promise<void>(resolve => {
    let count = 0;
    const check = setInterval(() => {
      if ((window as any).THREE || ++count > 30) {
        clearInterval(check);
        console.log('[AR] THREE готов');
        resolve();
      }
    }, 200);
  });
  
  // 3. Загружаем MindAR через динамический import (ESM)
  console.log('[AR] Загрузка MindAR (ESM)...');
  try {
    const mindarModule = await import(
      'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js'
    );
    (window as any).MINDAR = mindarModule.default || mindarModule;
    console.log('[AR] MindAR загружен!');
  } catch (err) {
    console.log('[AR] MindAR не загружен, используем fallback');
  }
  
  return true;
}

// =====================================================
// ДИНАМИЧЕСКИЙ ИМПОРТ AR-СЦЕНЫ (SSR = false)
// =====================================================

const ARScene = dynamic(
  () => import('@/components/ar/ar-scene').then(mod => mod.ARScene),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Загрузка AR...</p>
        </div>
      </div>
    )
  }
);



// =====================================================
// ГЛАВНЫЙ КОМПОНЕНТ
// =====================================================

export default function QuestApp() {
  const { 
    isStarted, 
    startQuest, 
    cameraReady, 
    cameraError, 
    setCameraError,
    setCameraReady 
  } = useQuest();
  
  const [showAR, setShowAR] = useState(false);
  
  // ---------------------------------------------------
  // ОБРАБОТЧИК НАЧАЛА КВЕСТА
  // ---------------------------------------------------
  
  const handleStart = useCallback(() => {
    // Проверяем HTTPS (кроме localhost и облачных платформ)
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const isHttps = protocol === 'https:';
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isCloud = hostname.includes('.vercel.app') || hostname.includes('.netlify.app');
      
      if (!isHttps && !isLocalhost && !isCloud) {
        setCameraError('Для работы AR требуется HTTPS. Откройте приложение по защищённой ссылке.');
        return;
      }
    }
    
    // Запускаем квест (AR загрузится в фоне)
    startQuest();
    setShowAR(true);
    
    // Пробуем загрузить AR библиотеки (не блокируем)
    loadARLibs().catch(() => {});
  }, [startQuest, setCameraError]);
  
  // ---------------------------------------------------
  // ОБРАБОТЧИК ГОТОВНОСТИ AR
  // ---------------------------------------------------
  
  const handleARReady = useCallback(() => {
    setCameraReady(true);
  }, [setCameraReady]);
  
  // ---------------------------------------------------
  // ОБРАБОТЧИК ОШИБКИ AR
  // ---------------------------------------------------
  
  const handleARError = useCallback((error: string) => {
    setCameraError(error);
  }, [setCameraError]);
  
  // ---------------------------------------------------
  // ОПРЕДЕЛЕНИЕ ТИПА ОШИБКИ
  // ---------------------------------------------------
  
  const getErrorType = (): 'camera' | 'https' | 'webrtc' | 'unknown' => {
    if (!cameraError) return 'unknown';
    
    if (cameraError.includes('HTTPS') || cameraError.includes('защищён')) {
      return 'https';
    }
    if (cameraError.includes('камер') || cameraError.includes('camera')) {
      return 'camera';
    }
    if (cameraError.includes('WebRTC') || cameraError.includes('поддерживает')) {
      return 'webrtc';
    }
    return 'unknown';
  };
  
  // ---------------------------------------------------
  // РЕНДЕРИНГ
  // ---------------------------------------------------
  
  // Показываем экран ошибки если есть ошибка
  if (cameraError && isStarted) {
    return (
      <ErrorScreen 
        error={cameraError} 
        type={getErrorType()}
        onRetry={() => {
          setCameraError(null);
          window.location.reload();
        }}
      />
    );
  }
  
  // Показываем стартовую страницу если квест не начат
  if (!isStarted || !showAR) {
    return <StartPage onStart={handleStart} />;
  }
  
  // Показываем AR-сцену
  return (
    <div className="relative min-h-screen bg-black">
      {/* AR-сцена */}
      <Suspense fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p>Загрузка AR...</p>
          </div>
        </div>
      }>
        <ARScene 
          onReady={handleARReady}
          onError={handleARError}
        />
      </Suspense>
      
      {/* UI Overlay */}
      <QuestUI />
      
      {/* Экран загрузки камеры */}
      {!cameraReady && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center text-white p-6">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium mb-2">Инициализация камеры...</p>
            <p className="text-white/60 text-sm">Разрешите доступ к камере в браузере</p>
          </div>
        </div>
      )}
    </div>
  );
}
