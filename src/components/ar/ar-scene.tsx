/**
 * =====================================================
 * AR-СЦЕНА - MINDAR СКАНЕР
 * =====================================================
 * 
 * Использует MindAR для распознавания .mind маркеров
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Инициализация...');
  const [scanStatus, setScanStatus] = useState('Подготовка...');
  
  const { 
    handleMarkerFound, 
    setCameraReady, 
    setCameraError,
    currentMarker,
    showingContent,
    completedSteps,
  } = useQuest();

  // ---------------------------------------------------
  // ИНИЦИАЛИЗАЦИЯ MINDAR
  // ---------------------------------------------------
  
  const initAR = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера не поддерживается');
      }
      
      setLoadingMessage('Загрузка MindAR...');
      
      // Ждём MindAR THREE
      let mindarLoaded = false;
      for (let i = 0; i < 100; i++) {
        if ((window as any).MINDAR && (window as any).THREE) {
          mindarLoaded = true;
          break;
        }
        await new Promise(r => setTimeout(r, 100));
      }
      
      if (!mindarLoaded) {
        throw new Error('MindAR не загрузился');
      }
      
      setLoadingMessage('Настройка камеры...');
      
      const MINDAR = (window as any).MINDAR;
      const THREE = (window as any).THREE;
      
      // Собираем все маркеры
      const imageList = STEPS
        .filter(step => step.markerType === 'nft' && step.nftDescriptor)
        .map(step => ({
          name: step.id,
          path: step.nftDescriptor
        }));
      
      // Создаём MindAR
      const mindar = new MINDAR.Image({
        imageList: imageList,
        filterThreshold: 0.7,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no'
      });
      
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      
      // Создаём свет
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 10, 0);
      scene.add(directionalLight);
      
      // Добавляем якоря для каждого маркера
      const anchors = STEPS.map((step, idx) => {
        const anchor = mindar.addAnchor(idx);
        
        // Создаём группу для 3D объекта
        const group = new THREE.Group();
        group.visible = false;
        
        // Добавляем модель если есть
        if (step.modelUrl) {
          const loader = new THREE.GLTFLoader();
          try {
            loader.load(step.modelUrl, (gltf) => {
              const model = gltf.scene;
              model.scale.set(step.scale, step.scale, step.scale);
              model.rotation.x = Math.PI / 2;
              group.add(model);
            });
          } catch (e) {
            console.log('Model load error:', e);
          }
        }
        
        anchor.group.add(group);
        
        // Обработчик обнаружения
        anchor.onTargetFound = () => {
          console.log('Found:', step.id);
          group.visible = true;
          setScanStatus(`Найден: ${step.title} ✅`);
          handleMarkerFound(step.id);
          
          // Воспроизводим звук
          if (step.soundUrl) {
            new Audio(step.soundUrl).play().catch(() => {});
          }
        };
        
        anchor.onTargetLost = () => {
          group.visible = false;
          setScanStatus('Сканирование...');
        };
        
        return anchor;
      });
      
      // Рендеринг
      const render = () => {
        renderer.render(scene, camera);
        requestAnimationFrame(render);
      };
      
      mindar.onReady = () => {
        console.log('MindAR ready');
        
        const video = document.querySelector('video') as HTMLVideoElement;
        if (video) {
          video.style.objectFit = 'cover';
        }
        
        containerRef.current?.appendChild(renderer.domElement);
        render();
        
        mindar.start();
        
        setIsLoading(false);
        setCameraReady(true);
        onReady?.();
        setScanStatus('Сканирование... Наведите на фото');
      };
      
      mindar.onError = (err: any) => {
        console.error('MindAR error:', err);
        setCameraError('Ошибка AR');
        onError?.('Ошибка');
      };
      
    } catch (error: any) {
      console.error('Init error:', error);
      let msg = 'Ошибка инициализации';
      if (error.message?.includes('timeout')) msg = 'Не загрузились AR библиотеки';
      else if (error.message?.includes('камер')) msg = 'Камера недоступна';
      
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
    >
      {/* Статус сканирования */}
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
        maxWidth: '90%',
        textAlign: 'center',
      }}>
        📷 {scanStatus}
      </div>

      {/* Прогресс */}
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
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span>📍</span>
        <span>Этап {completedSteps + 1} из {STEPS.length}:</span>
        <span style={{ color: '#22c55e', fontWeight: 'bold' }}>
          {STEPS[completedSteps]?.title || 'Квест завершён'}
        </span>
      </div>

      {/* 3D объект при обнаружении */}
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
          <p style={{ marginTop: 20, fontSize: 18 }}>{loadingMessage}</p>
          <p style={{ marginTop: 10, fontSize: 14, opacity: 0.7, maxWidth: '300px', textAlign: 'center' }}>
            Наведите камеру на фото маркера
          </p>
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