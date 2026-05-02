/**
 * =====================================================
 * AR-СЦЕНА - MindAR A-Frame Integration
 * =====================================================
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuest } from '@/hooks/use-quest';
import { STEPS, QuestStep } from '@/lib/quest-config';

interface ARSceneProps {
  onReady?: () => void;
  onError?: (error: string) => void;
}

export function ARScene({ onReady, onError }: ARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Инициализация...');
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  const { handleMarkerFound, setCameraReady, setCameraError, currentMarker, showingContent, completedSteps } = useQuest();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        setStatus('Загрузка A-Frame...');
        await waitForGlobal('AFRAME', 15000);
        console.log('[AR] A-Frame готов');

        setStatus('Загрузка MindAR...');
        await loadMindARScript();
        console.log('[AR] MindAR загружен');

        const nftSteps = STEPS.filter(s => s.markerType === 'nft' && s.nftDescriptor);
        if (nftSteps.length === 0) throw new Error('Нет NFT маркеров');

        setStatus('Создание AR сцены...');

        // Создаём A-Frame сцену
        const scene = document.createElement('a-scene');
        scene.setAttribute('mindar-image', `imageTargetSrc: ${nftSteps[0].nftDescriptor}.mind; autoStart: false;`);
        scene.setAttribute('color-space', 'sRGB');
        scene.setAttribute('renderer', 'colorManagement: true, physicallyCorrectLights');
        scene.setAttribute('vr-mode-ui', 'enabled: false');
        scene.setAttribute('device-orientation-permission-ui', 'enabled: false');

        // Камера
        const camera = document.createElement('a-camera');
        camera.setAttribute('position', '0 0 0');
        camera.setAttribute('look-controls', 'enabled: false');
        scene.appendChild(camera);

        // Добавляем якоря для каждого маркера
        nftSteps.forEach((step, index) => {
          const anchor = document.createElement('a-entity');
          anchor.setAttribute('mindar-image-target', `targetIndex: ${index}`);

          // Простой плейсхолдер (можно заменить на 3D модели)
          const box = document.createElement('a-box');
          box.setAttribute('position', '0 0 0');
          box.setAttribute('scale', '0.5 0.5 0.5');
          box.setAttribute('color', '#4ade80');
          box.setAttribute('opacity', '0.8');
          anchor.appendChild(box);

          // Обработчики событий
          anchor.addEventListener('targetFound', () => {
            console.log('[AR] Маркер найден:', step.id);
            handleMarkerFound(step.id);
            setStatus('✅ ' + step.title);
          });

          anchor.addEventListener('targetLost', () => {
            console.log('[AR] Маркер потерян');
            setStatus('🔍 Ищите маркер...');
          });

          scene.appendChild(anchor);
        });

        containerRef.current!.appendChild(scene);

        // Ждём инициализации сцены
        scene.addEventListener('loaded', () => {
          console.log('[AR] Сцена загружена');
          setStatus('Запуск камеры...');

          // Запускаем AR
          const sceneEl = scene as any;
          if (sceneEl.systems['mindar-image-system']) {
            sceneEl.systems['mindar-image-system'].start().then(() => {
              console.log('[AR] AR запущен');
              setIsLoading(false);
              setCameraReady(true);
              onReady?.();
              setStatus('📷 Наведите камеру на маркер');
            }).catch((err: any) => {
              console.error('[AR] Ошибка запуска:', err);
              throw err;
            });
          }
        });

      } catch (err: any) {
        console.error('[AR] Ошибка:', err);
        setError(err.message || 'Ошибка инициализации AR');
        setCameraError(err.message);
        onError?.(err.message);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      // Очистка
      const scene = containerRef.current?.querySelector('a-scene');
      if (scene) {
        const sceneEl = scene as any;
        if (sceneEl.systems['mindar-image-system']) {
          sceneEl.systems['mindar-image-system'].stop();
        }
        scene.remove();
      }
    };
  }, []);

  const currentStep = STEPS[completedSteps];
  const displayStep = currentMarker && showingContent ? STEPS.find(s => s.id === currentMarker) : null;

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#000' }}>
      <StatusBar status={status} />
      <ProgressBar current={completedSteps} total={STEPS.length} title={currentStep?.title} />
      {displayStep && <MarkerOverlay step={displayStep} />}
      {isLoading && <LoadingScreen status={status} />}
      {error && <ErrorScreen error={error} />}
    </div>
  );
}

// ========================================================
// АДАПТИВНЫЕ КОМПОНЕНТЫ
// ========================================================

function StatusBar({ status }: { status: string }) {
  return (
    <div style={{
      position: 'absolute', top: 'clamp(8px, 2vh, 15px)', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.92)', padding: 'clamp(6px, 1.5vh, 10px) clamp(12px, 3vw, 20px)', 
      borderRadius: 'clamp(15px, 4vw, 25px)', color: '#4ade80', 
      fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 'bold', zIndex: 60,
      border: '2px solid #4ade80', maxWidth: '90%', textAlign: 'center', wordBreak: 'break-word',
    }}>
      {status}
    </div>
  );
}

function ProgressBar({ current, total, title }: { current: number; total: number; title?: string }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{
      position: 'absolute', bottom: 'clamp(10px, 2vh, 20px)', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.88)', padding: 'clamp(8px, 2vh, 12px) clamp(12px, 3vw, 20px)', 
      borderRadius: 'clamp(15px, 4vw, 25px)', color: 'white', 
      fontSize: 'clamp(11px, 2.5vw, 14px)', zIndex: 50, maxWidth: '95%', textAlign: 'center',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 'inherit' }}>
        📍 {current + 1}/{total}: {title || '...'}
      </div>
      <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, #4ade80, #22c55e)', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function MarkerOverlay({ step }: { step: QuestStep }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 30, padding: 20,
    }}>
      <div style={{ textAlign: 'center', transform: 'scale(' + Math.min(step.scale, 0.8) + ')', maxWidth: '100%', width: '100%', wordBreak: 'break-word' }}>
        <div style={{
          width: 'clamp(50px, 12vw, 80px)', height: 'clamp(50px, 12vw, 80px)',
          margin: '0 auto', borderRadius: '50%',
          background: 'radial-gradient(circle, #4ade80, #3b82f6)',
          boxShadow: '0 0 30px rgba(74,222,128,0.5), 0 0 60px rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 'clamp(24px, 7vw, 36px)' }}>🎯</span>
        </div>
        
        <p style={{
          color: 'white', fontSize: 'clamp(16px, 5vw, 24px)', fontWeight: 'bold', marginTop: 12,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)', padding: '0 10px',
        }}>
          {step.title}
        </p>
        
        {step.scrollText && (
          <div style={{
            marginTop: 10, background: 'rgba(0,0,0,0.85)', border: '2px solid rgba(250,204,21,0.5)',
            borderRadius: 10, padding: 'clamp(6px, 1.5vw, 12px)', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ color: '#fde047', fontSize: 'clamp(11px, 2.5vw, 14px)', margin: 0, lineHeight: 1.4 }}>
              {step.scrollText}
            </p>
          </div>
        )}
        
        {step.clueForNext && (
          <div style={{
            marginTop: 8, background: 'rgba(30,58,138,0.9)', border: '1px solid rgba(96,165,250,0.4)',
            borderRadius: 8, padding: 'clamp(6px, 1.5vw, 10px)', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ color: '#93c5fd', fontSize: 'clamp(10px, 2.5vw, 13px)', margin: 0 }}>
              💡 {step.clueForNext}
            </p>
          </div>
        )}
        
        {step.id === 'marker_lake' && (
          <div style={{
            marginTop: 15, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            borderRadius: 12, padding: 'clamp(10px, 2.5vw, 16px)', maxWidth: '80%', marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ color: 'white', fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', margin: 0 }}>
              🎉 SEVA2024AR
            </p>
            <p style={{ color: 'white', fontSize: 'clamp(12px, 3vw, 16px)', marginTop: 4 }}>
              Скидка 25%!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ status }: { status: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white', zIndex: 100,
    }}>
      <div style={{
        width: 'clamp(40px, 10vw, 50px)', height: 'clamp(40px, 10vw, 50px)',
        border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #4ade80',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <p style={{ marginTop: 'clamp(12px, 3vw, 16px)', fontSize: 'clamp(14px, 3vw, 16px)' }}>{status}</p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)',
      color: 'white', zIndex: 100, padding: 20, textAlign: 'center',
    }}>
      <p style={{ fontSize: 'clamp(32px, 10vw, 48px)', marginBottom: 10 }}>⚠️</p>
      <p style={{ fontSize: 'clamp(14px, 4vw, 20px)', color: '#ef4444', marginBottom: 10 }}>Ошибка AR</p>
      <p style={{ fontSize: 'clamp(11px, 3vw, 14px)', opacity: 0.8, maxWidth: '90%', wordBreak: 'break-word' }}>{error}</p>
    </div>
  );
}

function waitForGlobal(name: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = setInterval(() => {
      if ((window as any)[name]) { clearInterval(check); resolve(); }
      else if (Date.now() - start > timeoutMs) { clearInterval(check); reject(new Error('Timeout: ' + name)); }
    }, 100);
  });
}

async function loadMindARScript(): Promise<void> {
  if ((window as any).MINDAR) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // A-Frame версия MindAR
    script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js';
    script.type = 'text/javascript';
    script.async = false;
    script.onload = () => {
      console.log('[AR] MindAR-AFrame загружен');
      resolve();
    };
    script.onerror = () => reject(new Error('Не удалось загрузить MindAR'));
    document.head.appendChild(script);
  });
}

export default ARScene;