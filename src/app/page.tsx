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
// ЗАГРУЗКА MINDAR + A-FRAME 1.4.0 (ВНЕ КОМПОНЕНТА)
// =====================================================

function loadMindAR(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Проверяем уже загружено
    if ((window as any).AFRAME && (window as any).MINDAR) {
      console.log('[AR] Уже загружено');
      resolve();
      return;
    }
    
    const loadScript = (src: string) => new Promise<void>((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        console.log('[AR] Уже загружен:', src);
        res();
        return;
      }
      console.log('[AR] Загрузка:', src);
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => {
        console.log('[AR] Загружено:', src);
        res();
      };
      s.onerror = (e) => {
        console.error('[AR] Ошибка загрузки:', src, e);
        rej(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(s);
    });
    
    // Загружаем A-Frame 1.4.0 (имеет встроенный THREE.js), затем MindAR
    loadScript('https://aframe.io/releases/1.4.0/aframe.min.js')
      .then(() => {
        console.log('[AR] A-Frame загружен, ожидание THREE...');
        // Ждём немного чтобы A-Frame инициализировал THREE
        return new Promise<void>(r => setTimeout(r, 500));
      })
      .then(() => loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js'))
      .then(() => {
        console.log('[AR] MindAR загружен');
        resolve();
      })
      .catch((err) => {
        console.error('[AR] Ошибка:', err);
        reject(err);
      });
  });
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
  
  const handleStart = useCallback(async () => {
    // Проверяем HTTPS (кроме localhost)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      const isVercel = location.hostname.includes('.vercel.app');
      const isNetlify = location.hostname.includes('.netlify.app');
      if (!isVercel && !isNetlify) {
        setCameraError('Для работы AR требуется HTTPS. Откройте приложение по защищённой ссылке.');
        return;
      }
    }
    
    // Загружаем MindAR перед показом AR
    try {
      await loadMindAR();
    } catch (e) {
      setCameraError('Не удалось загрузить AR библиотеки');
      return;
    }
    
    startQuest();
    setShowAR(true);
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
