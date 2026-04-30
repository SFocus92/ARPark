/**
 * =====================================================
 * AR-СЦЕНА - ПРОДАКШН ВЕРСИЯ (БЕЗ ТАПОВ!)
 * Реальное распознавание NFT-маркеров
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

  const {
    handleMarkerFound,
    setCameraReady,
    setCameraError,
    currentMarker,
    showingContent,
    completedSteps,
  } = useQuest();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        // 1. Ждём A-Frame (он грузится в page.tsx)
        setStatus('Ожидание A-Frame...');
        await waitForGlobal('AFRAME', 10000);
        console.log('[AR] A-Frame готов');

        // 2. Ждём THREE.js
        setStatus('Ожидание THREE.js...');
        await waitForGlobal('THREE', 5000);
        console.log('[AR] THREE готов');

        // 3. Загружаем MindAR через тег script (локальный файл)
        setStatus('Загрузка MindAR...');
        
        // Создаём тег script для загрузки MindAR
        await new Promise<void>((resolve, reject) => {
          if ((window as any).MINDAR) {
            resolve();
            return;
          }
          
          const s = document.createElement('script');
          s.src = '/js/mindar-image-three.prod.js';
          s.type = 'module';
          s.onload = () => {
            console.log('[AR] MindAR script загружен');
            resolve();
          };
          s.onerror = (e) => {
            console.error('[AR] MindAR load error:', e);
            reject(new Error('MindAR не загрузился'));
          };
          document.head.appendChild(s);
        });

        // Даём время на инициализацию модуля
        await new Promise(r => setTimeout(r, 500));

        // Проверяем загрузку
        const MINDAR = (window as any).MINDAR;
        if (!MINDAR) {
          // Пробуем найти экспорт из модуля
          throw new Error('MindAR не найден в window');
        }

        // 4. Готовим список маркеров
        const targets = STEPS
          .filter(s => s.markerType === 'nft' && s.nftDescriptor)
          .map(s => s.nftDescriptor!);

        console.log('[AR] Маркеры:', targets);

        // 5. Создаём сканер
        setStatus('Создание сканера...');
        const scanner = new MINDAR.Image({
          imageTargetSrc: targets.join(','),
          filterMinCF: 0.1,
          filterBeta: 0.001,
        });

        // 6. Обработчики
        scanner.onTargetFound = (targetIndex: number) => {
          console.log(`[AR] 🎯 Маркер: ${targetIndex}`);
          const step = STEPS.find((s, i) => i === targetIndex);
          if (step) {
            handleMarkerFound(step.id);
            setStatus(`✅ ${step.title}`);
          }
        };

        scanner.onTargetLost = () => {
          setStatus('🔍 Ищите маркер...');
        };

        // 7. Запуск
        setStatus('Запуск камеры...');
        await scanner.start(containerRef.current!);

        scannerRef.current = scanner;
        console.log('[AR] ✅ Сканер запущен!');

        setIsLoading(false);
        setCameraReady(true);
        onReady?.();
        setStatus('📷 Наведите камеру на маркер');

      } catch (err: any) {
        console.error('[AR] ❌ Ошибка:', err);
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
  const displayStep = currentMarker && showingContent
    ? STEPS.find(s => s.id === currentMarker)
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%', zIndex: 0,
        backgroundColor: '#000', overflow: 'hidden',
      }}
    >
      <StatusBar status={status} />
      <ProgressBar current={completedSteps} total={STEPS.length} title={currentStep?.title} />
      {displayStep && <MarkerOverlay step={displayStep} />}
      {isLoading && <LoadingScreen status={status} />}
      {error && <ErrorScreen error={error} />}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ========================================================
// КОМПОНЕНТЫ
// ========================================================

function StatusBar({ status }: { status: string }) {
  return (
    <div style={{
      position: 'absolute', top: 15, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.9)', padding: '10px 20px', borderRadius: 25,
      color: '#4ade80', fontSize: 14, fontWeight: 'bold', zIndex: 60,
      border: '2px solid #4ade80', whiteSpace: 'nowrap', animation: 'fadeIn 0.3s ease-out',
    }}>
      {status}
    </div>
  );
}

function ProgressBar({ current, total, title }: { current: number; total: number; title?: string }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)', padding: '12px 20px', borderRadius: 25,
      color: 'white', fontSize: 14, zIndex: 50, animation: 'fadeIn 0.3s ease-out', textAlign: 'center',
    }}>
      <div style={{ fontWeight: 'bold' }}>📍 {current + 1}/{total}: {title || '...'}</div>
      <div style={{ marginTop: 6, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #4ade80, #22c55e)', borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function MarkerOverlay({ step }: { step: QuestStep }) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 30, animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ transform: `scale(${step.scale})`, textAlign: 'center', maxWidth: '90%' }}>
        <div style={{ width: 80, height: 80, margin: '0 auto', background: 'radial-gradient(circle, #4ade80, #3b82f6)', borderRadius: '50%', boxShadow: '0 0 40px rgba(74,222,128,0.5), 0 0 80px rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 36 }}>🎯</span>
        </div>
        <p style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 16, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{step.title}</p>
        
        {step.scrollText && (
          <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.85)', border: '2px solid rgba(250,204,21,0.5)', borderRadius: 12, padding: '12px 16px', maxWidth: 280, margin: '12px auto 0' }}>
            <p style={{ color: '#fde047', fontSize: 14, margin: 0 }}>{step.scrollText}</p>
          </div>
        )}
        
        {step.clueForNext && (
          <div style={{ marginTop: 8, background: 'rgba(30,58,138,0.9)', border: '1px solid rgba(96,165,250,0.4)', borderRadius: 10, padding: '10px 14px', maxWidth: 280, margin: '8px auto 0' }}>
            <p style={{ color: '#93c5fd', fontSize: 13, margin: 0 }}>💡 {step.clueForNext}</p>
          </div>
        )}
        
        {step.id === 'marker_lake' && (
          <div style={{ marginTop: 16, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: 12, padding: '16px 24px' }}>
            <p style={{ color: 'white', fontSize: 28, fontWeight: 'bold', margin: 0 }}>🎉 SEVA2024AR</p>
            <p style={{ color: 'white', fontSize: 16, marginTop: 4 }}>Скидка 25%!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen({ status }: { status: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white', zIndex: 100 }}>
      <div style={{ width: 50, height: 50, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #4ade80', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: 16, fontSize: 16 }}>{status}</p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', color: 'white', zIndex: 100, padding: 20, textAlign: 'center' }}>
      <p style={{ fontSize: 48, marginBottom: 10 }}>⚠️</p>
      <p style={{ fontSize: 20, color: '#ef4444', marginBottom: 10 }}>Ошибка AR</p>
      <p style={{ fontSize: 14, opacity: 0.8, maxWidth: 300 }}>{error}</p>
    </div>
  );
}

function waitForGlobal(name: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = setInterval(() => {
      if ((window as any)[name]) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(check);
        reject(new Error(`Timeout: ${name}`));
      }
    }, 100);
  });
}

export default ARScene;