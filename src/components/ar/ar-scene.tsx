/**
 * =====================================================
 * AR-СЦЕНА С AR.JS NFT РАСПОЗНАВАНИЕМ
 * =====================================================
 * 
 * AR.js NFT работает с .fset файлами из public/assets/nft/
 * Распознаёт фото из парка и показывает 3D-объекты
 * 
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
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Инициализация AR...');
  const [arReady, setArReady] = useState(false);
  
  const { 
    handleMarkerFound, 
    setCameraReady, 
    setCameraError,
    currentMarker,
    showingContent,
  } = useQuest();

  // ---------------------------------------------------
  // ИНИЦИАЛИЗАЦИЯ AR.JS NFT
  // ---------------------------------------------------
  
  const initAR = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_NOT_SUPPORTED');
      }
      
      setLoadingMessage('Загрузка AR.js...');
      
      // Проверяем загрузку A-Frame
      const waitForAframe = () => new Promise<void>((resolve, reject) => {
        const check = () => {
          if ((window as any).AFRAME) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        setTimeout(() => reject(new Error('A-Frame timeout')), 10000);
        check();
      });
      
      await waitForAframe();
      
      setLoadingMessage('Настройка камеры...');
      
      // Создаём сцену A-Frame
      const scene = document.createElement('a-scene');
      scene.setAttribute('embedded', '');
      scene.setAttribute('renderer', 'antialias: true, alpha: true');
      scene.setAttribute('vr-mode-ui', 'enabled: false');
      scene.setAttribute('arjs', 'sourceType: webcam, debugUIEnabled: false, detectionMode: mono_and_matrix, matrixCodeType: 3x3');
      scene.setAttribute('gesture-detector', '');
      
      // Добавляем камеру
      const camera = document.createElement('a-entity');
      camera.setAttribute('camera', '');
      
      // Создаём маркеры для каждого NFT
      STEPS.forEach((step, index) => {
        if (step.markerType === 'nft' && step.nftDescriptor) {
          const marker = document.createElement('a-entity');
          marker.setAttribute('nft', `type: nft, src: ${step.nftDescriptor}`);
          marker.setAttribute('marker-handler', '');
          marker.setAttribute('id', step.id);
          
          // При обнаружении - вызываем handleMarkerFound
          marker.addEventListener('click', () => {
            console.log('Marker found:', step.id);
            handleMarkerFound(step.id);
          });
          
          // Добавляем видимый объект при обнаружении
          const entity = document.createElement('a-entity');
          entity.setAttribute('gltf-model', '#' + step.objectType);
          entity.setAttribute('scale', `${step.scale} ${step.scale} ${step.scale}`);
          entity.setAttribute('position', '0 0 0');
          entity.setAttribute('rotation', '0 0 0');
          entity.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 5000');
          entity.style.display = 'none';
          entity.classList.add('marker-entity');
          
          // Показываем при обнаружении маркера
          marker.addEventListener('markerFound', () => {
            console.log('NFT Marker found:', step.id);
            handleMarkerFound(step.id);
            entity.style.display = 'block';
          });
          
          marker.addEventListener('markerLost', () => {
            entity.style.display = 'none';
          });
          
          marker.appendChild(entity);
          scene.appendChild(marker);
        }
      });
      
      scene.appendChild(camera);
      sceneRef.current?.appendChild(scene);
      
      // Ждём инициализации AR
      scene.addEventListener('loaded', () => {
        console.log('AR scene loaded');
        setIsLoading(false);
        setArReady(true);
        setCameraReady(true);
        onReady?.();
        
        setLoadingMessage('AR готов! Наведите на фото');
        setTimeout(() => setLoadingMessage(''), 3000);
      });
      
      // Обработчик ошибок
      scene.addEventListener('error', (e: any) => {
        console.error('AR error:', e);
        setCameraError('Ошибка AR');
        onError?.('Ошибка AR');
      });
      
    } catch (error: any) {
      console.error('Init error:', error);
      let msg = 'Ошибка инициализации AR';
      if (error.message?.includes('timeout')) msg = 'Не загрузился A-Frame';
      else if (error.message === 'CAMERA_NOT_SUPPORTED') msg = 'Камера не поддерживается';
      
      setCameraError(msg);
      onError?.(msg);
      setIsLoading(false);
    }
  }, [handleMarkerFound, setCameraReady, setCameraError, onReady, onError]);

  // ---------------------------------------------------
  // МОНТИРОВАНИЕ
  // ---------------------------------------------------
  
  useEffect(() => {
    initAR();
  }, [initAR]);

  // ---------------------------------------------------
  // ТЕКУЩИЙ ШАГ
  // ---------------------------------------------------
  
  const displayStep = currentMarker && showingContent 
    ? STEPS.find(s => s.id === currentMarker) 
    : null;

  // ---------------------------------------------------
  // РЕНДЕРИНГ
  // ---------------------------------------------------
  
  return (
    <div 
      ref={sceneRef}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        zIndex: 0,
      }}
    >
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
          padding: '20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 60,
            height: 60,
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: 20, fontSize: 18 }}>{loadingMessage}</p>
          <p style={{ marginTop: 10, fontSize: 14, opacity: 0.7 }}>
            Распечатайте фото из public/assets/nft-sources/
          </p>
        </div>
      )}

      {/* 3D объект при обнаружении */}
      {displayStep && showingContent && (
        <MarkerObject step={displayStep} />
      )}

      {/* Подсказка */}
      {arReady && !isLoading && (
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '12px 24px',
          borderRadius: 30,
          color: 'white',
          zIndex: 50,
        }}>
          📷 Наведите камеру на фото маркера
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
// 3D-ОБЪЕКТ МАРКЕРА
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
  
  useEffect(() => {
    if (step.soundUrl) {
      new Audio(step.soundUrl).play().catch(() => {});
    }
  }, [step.soundUrl]);

  const content = (() => {
    switch (step.objectType) {
      case 'scroll':
        return (
          <div className="relative bg-amber-100 border-4 border-amber-800 rounded-lg p-6 shadow-2xl max-w-xs"
               style={{ transform: `scale(${step.scale})` }}>
            <div className="text-center mb-3 border-b border-amber-400">
              <span className="text-amber-800 font-bold text-lg">📜 {step.title}</span>
            </div>
            <p className="text-amber-900 text-sm">{step.scrollText}</p>
          </div>
        );
      case 'key':
        return (
          <div style={{ transform: `scale(${step.scale})` }}>
            <div className="w-32 h-40 flex items-center justify-center">🔑</div>
            <p className="text-white text-center text-xl font-bold">Ключ найден!</p>
          </div>
        );
      case 'gem':
        return (
          <div style={{ transform: `scale(${step.scale})` }}>
            <div className="w-32 h-40 flex items-center justify-center">💎</div>
            <p className="text-white text-center text-xl font-bold">Кристалл!</p>
          </div>
        );
      case 'portal':
        return (
          <div style={{ transform: `scale(${step.scale})` }}>
            <div className="w-32 h-40 flex items-center justify-center">🌀</div>
            <p className="text-white text-center text-xl font-bold">Портал!</p>
          </div>
        );
      case 'compass':
        return (
          <div style={{ transform: `scale(${step.scale})` }}>
            <div className="w-32 h-40 flex items-center justify-center">🧭</div>
            <p className="text-white text-center text-xl font-bold">Компас!</p>
          </div>
        );
      case 'chest':
      default:
        return (
          <div style={{ transform: `scale(${step.scale})` }}>
            <div className="w-32 h-40 flex items-center justify-center">🎁</div>
            <p className="text-white text-center text-xl font-bold">Сундук!</p>
            <div className="mt-4 bg-black/80 border-2 border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-300 text-2xl font-mono">{step.scrollText || 'SEVA2024AR'}</p>
            </div>
          </div>
        );
    }
  })();

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-20 ${animClass}`}
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      {content}
    </div>
  );
}

export default ARScene;