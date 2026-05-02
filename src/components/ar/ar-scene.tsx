/**
 * =====================================================
 * AR-СЦЕНА - MindAR JS API с отдельными маркерами
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
  const scannerRef = useRef<any>(null);

  const { handleMarkerFound, setCameraReady, setCameraError, currentMarker, showingContent, completedSteps } = useQuest();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        setStatus('Ожидание A-Frame...');
        await waitForGlobal('AFRAME', 15000);
        await waitForGlobal('THREE', 5000);
        console.log('[AR] A-Frame + THREE готовы');

        setStatus('Загрузка MindAR...');

        // Загружаем MindAR через глобальный скрипт
        await loadMindARScript();

        const MINDAR = (window as any).MINDAR;
        if (!MINDAR || !MINDAR.IMAGE || !MINDAR.IMAGE.MindARThree) {
          console.error('[AR] window.MINDAR:', (window as any).MINDAR);
          throw new Error('MindAR не загружен корректно');
        }

        console.log('[AR] MindAR загружен');

        const nftSteps = STEPS.filter(s => s.markerType === 'nft' && s.nftDescriptor);
        if (nftSteps.length === 0) throw new Error('Нет NFT маркеров');

        const firstMarker = nftSteps[0];
        setStatus('Создание сканера...');

        console.log('[AR] Первый маркер:', firstMarker.nftDescriptor + '.mind');

        // Правильный API MindAR
        const mindarThree = new MINDAR.IMAGE.MindARThree({
          container: containerRef.current!,
          imageTargetSrc: firstMarker.nftDescriptor + '.mind',
        });

        const { renderer, scene, camera } = mindarThree;
        console.log('[AR] Сканер создан');

        // Добавляем обработчики для первого маркера
        const anchor = mindarThree.addAnchor(0);
        anchor.onTargetFound = () => {
          console.log('[AR] Маркер найден! Индекс: 0');
          handleMarkerFound(firstMarker.id);
          setStatus('✅ ' + firstMarker.title);
        };
        anchor.onTargetLost = () => {
          setStatus('🔍 Ищите маркер...');
        };

        // Загружаем остальные маркеры
        const remainingMarkers = nftSteps.slice(1);
        if (remainingMarkers.length > 0) {
          setStatus('Загрузка ' + remainingMarkers.length + ' маркеров...');
          for (let i = 0; i < remainingMarkers.length; i++) {
            const step = remainingMarkers[i];
            const targetIndex = i + 1;

            // Добавляем якорь для каждого маркера
            const anchor = mindarThree.addAnchor(targetIndex);
            anchor.onTargetFound = () => {
              console.log('[AR] Маркер найден! Индекс:', targetIndex);
              handleMarkerFound(step.id);
              setStatus('✅ ' + step.title);
            };
            anchor.onTargetLost = () => {
              setStatus('🔍 Ищите маркер...');
            };

            console.log('[AR] Добавлен якорь:', step.nftDescriptor);
          }
        }

        setStatus('Запуск камеры...');
        await mindarThree.start();
        scannerRef.current = mindarThree;
        console.log('[AR] Сканер запущен!');

        setIsLoading(false);
        setCameraReady(true);
        onReady?.();
        setStatus('📷 Наведите камеру на маркер');

      } catch (err: any) {
        console.error('[AR] Ошибка:', err);
        setError(err.message || 'Ошибка');
        setCameraError(err.message);
        onError?.(err.message);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      if (scannerRef.current?.stop) {
        scannerRef.current.stop();
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
    // Используем правильный CDN URL для UMD версии
    script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';
    script.type = 'text/javascript'; // Явно указываем тип
    script.async = false; // Синхронная загрузка
    script.onload = () => {
      console.log('[AR] MindAR скрипт загружен, window.MINDAR:', !!(window as any).MINDAR);
      resolve();
    };
    script.onerror = () => reject(new Error('Не удалось загрузить MindAR'));
    document.head.appendChild(script);
  });
}

export default ARScene;