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
        await waitForGlobal('AFRAME', 30000); // Увеличиваем таймаут до 30 секунд
        console.log('[AR] A-Frame готов');

        setStatus('Загрузка MindAR...');
        await loadMindARScript();
        console.log('[AR] MindAR загружен');

        const nftSteps = STEPS.filter(s => s.markerType === 'nft' && s.nftDescriptor);
        if (nftSteps.length === 0) throw new Error('Нет NFT маркеров');

        setStatus('Создание AR сцены...');

        // Создаём A-Frame сцену
        const scene = document.createElement('a-scene');
        scene.setAttribute('mindar-image', `imageTargetSrc: ${nftSteps[0].nftDescriptor}.mind; autoStart: true;`);
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

          // Только для этапов 1-6 показываем 3D модель ключа
          // Этап 7 (финальный) - без 3D объекта, только событие
          if (step.order < 7) {
            // 3D модель золотого ключа
            const model = document.createElement('a-gltf-model');
            model.setAttribute('src', '/assets/models/golden_key.glb');
            model.setAttribute('position', '0 0 0');
            model.setAttribute('scale', '0.002 0.002 0.002');
            model.setAttribute('rotation', '-90 0 0');
            model.setAttribute('animation', 'property: rotation; to: -90 360 0; loop: true; dur: 3000; easing: linear');
            anchor.appendChild(model);
          }
          // Для этапа 7 не добавляем никакой 3D объект - только обработчик события

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
        });

        // Ждём события arReady (MindAR готов)
        scene.addEventListener('arReady', () => {
          console.log('[AR] AR запущен');
          setIsLoading(false);
          setCameraReady(true);
          onReady?.();
          setStatus('📷 Наведите камеру на маркер');
        });

        // Обработка ошибок AR
        scene.addEventListener('arError', (event: any) => {
          console.error('[AR] Ошибка AR:', event.detail);
          throw new Error(event.detail?.message || 'Ошибка AR');
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
    <div ref={containerRef} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
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
      position: 'absolute', top: 'clamp(10px, 2.5vh, 20px)', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.92)', padding: 'clamp(8px, 2vh, 14px) clamp(16px, 4vw, 24px)',
      borderRadius: 'clamp(18px, 5vw, 30px)', color: '#4ade80',
      fontSize: 'clamp(13px, 3.5vw, 18px)', fontWeight: 'bold', zIndex: 60,
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
      position: 'absolute', bottom: 'clamp(12px, 2.5vh, 24px)', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.88)', padding: 'clamp(10px, 2.5vh, 16px) clamp(16px, 4vw, 24px)',
      borderRadius: 'clamp(18px, 5vw, 30px)', color: 'white',
      fontSize: 'clamp(13px, 3.5vw, 18px)', zIndex: 50, maxWidth: '95%', textAlign: 'center',
    }}>
      <div style={{ fontWeight: 'bold', fontSize: 'inherit' }}>
        📍 {current + 1}/{total}: {title || '...'}
      </div>
      <div style={{ marginTop: 8, height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
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
          width: 'clamp(60px, 15vw, 100px)', height: 'clamp(60px, 15vw, 100px)',
          margin: '0 auto', borderRadius: '50%',
          background: 'radial-gradient(circle, #4ade80, #3b82f6)',
          boxShadow: '0 0 30px rgba(74,222,128,0.5), 0 0 60px rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 'clamp(28px, 8vw, 42px)' }}>🎯</span>
        </div>

        <p style={{
          color: 'white', fontSize: 'clamp(18px, 5.5vw, 28px)', fontWeight: 'bold', marginTop: 16,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)', padding: '0 10px',
        }}>
          {step.title}
        </p>

        {step.scrollText && (
          <div style={{
            marginTop: 12, background: 'rgba(0,0,0,0.85)', border: '2px solid rgba(250,204,21,0.5)',
            borderRadius: 12, padding: 'clamp(8px, 2vw, 14px)', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ color: '#fde047', fontSize: 'clamp(13px, 3vw, 16px)', margin: 0, lineHeight: 1.5 }}>
              {step.scrollText}
            </p>
          </div>
        )}

        {step.clueForNext && (
          <div style={{
            marginTop: 10, background: 'rgba(30,58,138,0.9)', border: '1px solid rgba(96,165,250,0.4)',
            borderRadius: 10, padding: 'clamp(8px, 2vw, 12px)', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ color: '#93c5fd', fontSize: 'clamp(12px, 3vw, 15px)', margin: 0 }}>
              💡 {step.clueForNext}
            </p>
          </div>
        )}

        {step.id === 'marker_lake' && (
          <div style={{
            marginTop: 18, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            borderRadius: 14, padding: 'clamp(12px, 3vw, 18px)', maxWidth: '80%', marginLeft: 'auto', marginRight: 'auto',
          }}>
            <p style={{ color: 'white', fontSize: 'clamp(22px, 6vw, 32px)', fontWeight: 'bold', margin: 0 }}>
              🎉 SEVA2024AR
            </p>
            <p style={{ color: 'white', fontSize: 'clamp(14px, 3.5vw, 18px)', marginTop: 6 }}>
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
        width: 'clamp(50px, 12vw, 60px)', height: 'clamp(50px, 12vw, 60px)',
        border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #4ade80',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <p style={{ marginTop: 'clamp(16px, 4vw, 20px)', fontSize: 'clamp(15px, 3.5vw, 18px)' }}>{status}</p>
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
      <p style={{ fontSize: 'clamp(36px, 12vw, 56px)', marginBottom: 12 }}>⚠️</p>
      <p style={{ fontSize: 'clamp(16px, 4.5vw, 22px)', color: '#ef4444', marginBottom: 12 }}>Ошибка AR</p>
      <p style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', opacity: 0.8, maxWidth: '90%', wordBreak: 'break-word' }}>{error}</p>
    </div>
  );
}

function waitForGlobal(name: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Проверяем сразу
    if ((window as any)[name]) {
      console.log(`[AR] ${name} уже загружен`);
      resolve();
      return;
    }

    console.log(`[AR] Ожидание ${name}...`);
    const start = Date.now();
    const check = setInterval(() => {
      if ((window as any)[name]) {
        clearInterval(check);
        console.log(`[AR] ${name} загружен за ${Date.now() - start}ms`);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        console.error(`[AR] Таймаут ожидания ${name} (${timeoutMs}ms)`);
        reject(new Error('Timeout: ' + name));
      }
    }, 50); // Проверяем каждые 50ms вместо 100ms
  });
}

async function loadMindARScript(): Promise<void> {
  if ((window as any).MINDAR) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/libs/mindar-image.prod.js';
    script.type = 'text/javascript';
    script.async = false;
    script.onload = () => {
      console.log('[AR] MindAR Core загружен');
      resolve();
    };
    script.onerror = () => reject(new Error('Не удалось загрузить MindAR Core'));
    document.head.appendChild(script);
  });

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/libs/mindar-image-aframe.prod.js';
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