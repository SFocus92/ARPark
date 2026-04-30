/**
 * =====================================================
 * AR-СЦЕНА - ПРОДАКШН ВЕРСИЯ С MINDAR NFT
 * =====================================================
 * 
 * Реальное распознавание NFT маркеров с камеры
 * 
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Инициализация AR...');
  const [error, setError] = useState<string | null>(null);
  const isInitedRef = useRef(false);
  
  const { 
    handleMarkerFound, 
    setCameraReady, 
    setCameraError,
    currentMarker,
    showingContent,
    completedSteps,
  } = useQuest();

  // ---------------------------------------------------
  // ИНИЦИАЛИЗАЦИЯ MINDAR NFT
  // ---------------------------------------------------
  
  useEffect(() => {
    if (isInitedRef.current) return;
    isInitedRef.current = true;
    
    const init = async () => {
      try {
        // Ждём A-Frame
        setStatus('Загрузка A-Frame...');
        
        for (let i = 0; i < 30; i++) {
          if ((window as any).AFRAME) break;
          await new Promise(r => setTimeout(r, 200));
        }
        
        if (!(window as any).AFRAME) {
          throw new Error('A-Frame не загружен');
        }
        
        // Ждём THREE.js
        setStatus('Настройка 3D...');
        
        for (let i = 0; i < 30; i++) {
          if ((window as any).THREE) break;
          await new Promise(r => setTimeout(r, 200));
        }
        
        if (!(window as any).THREE) {
          throw new Error('THREE.js не загружен');
        }
        
        // Загружаем MindAR
        setStatus('Загрузка MindAR...');
        
        // Пробуем загрузить MindAR UMD
        if (!(window as any).MINDAR) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.umd.prod.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve();
            script.onerror = () => resolve(); // Не блокируем
            document.head.appendChild(script);
          });
        }
        
        await new Promise(r => setTimeout(r, 500));
        
        const MINDAR = (window as any).MINDAR;
        const THREE = (window as any).THREE;
        
        if (!MINDAR || !THREE) {
          throw new Error('MindAR недоступен');
        }
        
        setStatus('Настройка камеры...');
        
        // Создаём MindAR с правильными путями к .mind файлам
        // MindAR ищет файлы в корне или по абсолютному пути
        const targets = STEPS
          .filter(s => s.markerType === 'nft' && s.nftDescriptor)
          .map(s => s.nftDescriptor)
          .join(',');
        
        console.log('[AR] Инициализация с маркерами:', targets);
        
        const mindar = new MINDAR.Image({
          imageTargetsSrc: targets,
          filterThreshold: 0.6,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
        });
        
        // Рендерер
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const scene = new THREE.Scene();
        
        // Камера
        const camera = new THREE.PerspectiveCamera(1, 1, 0.1, 1000);
        
        // Свет
        const light = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(light);
        
        // Обработчики маркеров
        const onTargetFound = (targetIndex: number) => {
          console.log('[AR] Найден маркер:', targetIndex);
          const step = STEPS[targetIndex];
          if (step) {
            handleMarkerFound(step.id);
            setStatus(`Найден: ${step.title} ✅`);
          }
        };
        
        const onTargetLost = (targetIndex: number) => {
          setStatus('Сканирование...');
        };
        
        // Добавляем якоря для всех маркеров
        STEPS.forEach((step, idx) => {
          if (step.markerType !== 'nft') return;
          
          const anchor = mindar.addAnchor(idx);
          
          const group = new THREE.Group();
          group.visible = false;
          anchor.group.add(group);
          
          anchor.onTargetFound = () => onTargetFound(idx);
          anchor.onTargetLost = () => onTargetLost(idx);
        });
        
        mindar.onStart = () => {
          console.log('[AR] MindAR запущен');
          
          // Настраиваем видео
          const video = document.querySelector('video') as HTMLVideoElement;
          if (video) {
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'cover';
          }
          
          // Добавляем canvas
          const canvas = renderer.domElement;
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          containerRef.current?.appendChild(canvas);
          
          setIsLoading(false);
          setCameraReady(true);
          onReady?.();
          setStatus('Наведите камеру на фото маркера');
          
          // Рендеринг
          const animate = () => {
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
          };
          animate();
        };
        
        mindar.onError = (err: any) => {
          console.error('[AR] MindAR error:', err);
          throw new Error('Ошибка MindAR');
        };
        
        // Запуск
        mindar.start();
        
      } catch (err: any) {
        console.error('[AR] Ошибка:', err.message);
        // Fallback - используем простую камеру
        initCameraFallback();
      }
    };
    
    // Fallback - простая камера с тапом
    const initCameraFallback = async () => {
      try {
        setStatus('Запуск камеры...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.autoplay = true;
        
        containerRef.current?.appendChild(video);
        
        setIsLoading(false);
        setCameraReady(true);
        onReady?.();
        setStatus('Готово! Тапните по экрану');
        
      } catch (err: any) {
        setError(err.message || 'Ошибка камеры');
        setCameraError(err.message);
        onError?.(err.message);
        setIsLoading(false);
      }
    };
    
    init();
    
  }, [handleMarkerFound, setCameraReady, setCameraError, onReady, onError]);

  // ---------------------------------------------------
  // ТАП ПО ЭКРАНУ (FALLBACK)
  // ---------------------------------------------------
  
  const handleTap = useCallback(() => {
    const step = STEPS[completedSteps];
    if (step) {
      handleMarkerFound(step.id);
      setStatus(`Найден: ${step.title} ✅`);
      setTimeout(() => {
        if (!currentMarker) setStatus('Тапните для следующего этапа');
      }, 3000);
    }
  }, [handleMarkerFound, completedSteps, currentMarker]);

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
      onClick={handleTap}
      style={{ 
        position: 'fixed', top: 0, left: 0, 
        width: '100%', height: '100%', zIndex: 0, 
        backgroundColor: '#000',
        cursor: 'pointer'
      }}
    >
      {/* Статус сканера */}
      <div style={{
        position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.9)', 
        padding: '10px 20px', borderRadius: 20,
        color: '#22c55e', fontSize: '14px', zIndex: 60,
        border: '2px solid #22c55e', fontWeight: 'bold'
      }}>
        📷 {status}
      </div>

      {/* Прогресс */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.85)', 
        padding: '12px 20px', borderRadius: 25,
        color: 'white', fontSize: '14px', zIndex: 50
      }}>
        📍 {completedSteps + 1}/7: {currentStep?.title || 'Готово!'}
      </div>

      {/* 3D объект при обнаружении */}
      {displayStep && showingContent && <MarkerContent step={displayStep} />}

      {/* Загрузка */}
      {isLoading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.95)', color: 'white', zIndex: 100
        }}>
          <div style={{
            width: 50, height: 50,
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid #22c55e', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: 15, fontSize: 16 }}>{status}</p>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.95)', color: 'white', zIndex: 100, padding: 20, textAlign: 'center'
        }}>
          <p style={{ fontSize: 20, color: '#ef4444', marginBottom: 15 }}>⚠️ Ошибка</p>
          <p style={{ fontSize: 14 }}>{error}</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// =====================================================
// 3D-ОБЪЕКТ ПРИ ОБНАРУЖЕНИИ МАРКЕРА
// =====================================================

function MarkerContent({ step }: { step: QuestStep }) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-30"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ transform: `scale(${step.scale})`, textAlign: 'center', maxWidth: '90%' }}>
        
        {/* Заголовок */}
        <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-blue-500 rounded-full 
                       flex items-center justify-center mx-auto shadow-2xl">
          <span style={{ fontSize: '40px' }}>🎯</span>
        </div>
        
        <p className="text-white text-2xl font-bold mt-4">{step.title}</p>
        
        {/* Текст свитка */}
        {step.scrollText && (
          <div className="mt-4 bg-black/90 border-2 border-yellow-500 rounded-xl p-4 max-w-sm mx-auto">
            <p className="text-yellow-300 text-sm">{step.scrollText}</p>
          </div>
        )}
        
        {/* Подсказка для следующего */}
        {step.clueForNext && (
          <div className="mt-3 bg-blue-900/90 border border-blue-400 rounded-lg p-3 max-w-sm mx-auto">
            <p className="text-blue-200 text-xs">{step.clueForNext}</p>
          </div>
        )}
        
        {/* Финал - промокод */}
        {step.id === 'marker_lake' && (
          <div className="mt-6 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-xl p-6">
            <p className="text-white text-3xl font-bold">🎉 {step.scrollText || 'SEVA2024AR'}</p>
            <p className="text-white text-lg mt-1">Скидка 25%!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ARScene;