/**
 * =====================================================
 * СТРАНИЦА С МАРКЕРАМИ ДЛЯ ПЕЧАТИ (7 ЭТАПОВ)
 * =====================================================
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STEPS, PARK_CONFIG } from '@/lib/quest-config';
import { Printer, Info, Download, Camera, TreePine, Mountain, Landmark, Waves, MapPin } from 'lucide-react';

// Иконки для каждого этапа
const stepIcons = [MapPin, TreePine, MapPin, Mountain, Landmark, Landmark, Waves];

export default function MarkersPage() {
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Заголовок */}
      <div className="max-w-4xl mx-auto mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🗺️ Маркеры для печати — {PARK_CONFIG.name}
        </h1>
        <p className="text-gray-600 mb-4">
          Распечатайте эти маркеры и разместите их на объектах парка согласно инструкции.
        </p>
        
        <div className="flex gap-4">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Печать всех маркеров
          </Button>
        </div>
      </div>
      
      {/* Инструкция */}
      <Card className="max-w-4xl mx-auto mb-8 print:hidden bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-2">📋 Инструкция по использованию маркеров:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Распечатайте каждый маркер на плотной бумаге (рекомендуется 200-250 г/м²)</li>
                <li>Размер маркера должен быть не менее <strong>15×15 см</strong> (оптимально 20×20 см)</li>
                <li>Наклейте маркеры в указанных местах парка</li>
                <li>Убедитесь, что маркеры хорошо видны и не перекрыты предметами</li>
                <li>Для защиты от влаги используйте ламинирование</li>
                <li>Тестовые маркеры (Hiro) используются для проверки работы приложения</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Важное примечание о NFT-маркерах */}
      <Card className="max-w-4xl mx-auto mb-8 print:hidden bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">📸 О распознавании реальных объектов (NFT-маркеры):</p>
              <p className="mb-2">
                Этапы 2-7 используют технологию NFT (Natural Feature Tracking) для распознавания 
                реальных объектов парка — скамеек, деревьев, статуй и т.д.
              </p>
              <p className="mb-2">
                <strong>Для создания NFT-маркеров из ваших фотографий:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Сфотографируйте объект парка (скамейка, дерево, статуя)</li>
                <li>Используйте инструмент: <code className="bg-blue-100 px-1 rounded">https://ar-js-org.github.io/AR.js/three.js/examples/marker-training.html</code></li>
                <li>Загрузите фото и скачайте файлы дескриптора (.fset, .fset3, .iset)</li>
                <li>Поместите файлы в папку <code className="bg-blue-100 px-1 rounded">public/assets/nft/</code></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Маркеры */}
      <div className="max-w-4xl mx-auto space-y-8">
        {STEPS.map((step, index) => {
          const Icon = stepIcons[index] || MapPin;
          
          return (
            <Card key={step.id} className="print:break-inside-avoid print:shadow-none">
              <CardHeader className="print:border-b print:border-gray-300">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-green-600" />
                    Маркер #{step.order}: {step.title}
                  </span>
                  <span className={`text-sm font-normal px-2 py-1 rounded ${
                    step.markerType === 'nft' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {step.markerType === 'nft' ? 'NFT' : 'Pattern'}
                  </span>
                </CardTitle>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>📍 Место:</strong> {step.location}</p>
                  <p><strong>🔍 Описание:</strong> {step.description}</p>
                  <p><strong>💡 Подсказка:</strong> {step.hint}</p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 flex justify-center">
                {/* Маркер */}
                <div className="border-4 border-black bg-white p-2 print:p-4" style={{ width: '280px', height: '280px' }}>
                  {step.markerType === 'pattern' && step.patternType === 'hiro' && (
                    // Hiro Marker SVG
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white"/>
                      <path d="M15 15 L85 15 L85 85 L15 85 Z" fill="black"/>
                      <path d="M25 25 L75 25 L75 75 L25 75 Z" fill="white"/>
                      <path d="M35 35 L65 35 L65 65 L35 65 Z" fill="black"/>
                      {/* Hiro pattern */}
                      <rect x="30" y="30" width="10" height="10" fill="white"/>
                      <rect x="60" y="30" width="10" height="10" fill="white"/>
                      <rect x="30" y="60" width="10" height="10" fill="white"/>
                      <rect x="60" y="60" width="10" height="10" fill="white"/>
                      <rect x="45" y="45" width="10" height="10" fill="white"/>
                    </svg>
                  )}
                  
                  {step.markerType === 'nft' && (
                    // NFT placeholder - фото объекта
                    <div className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center p-2">
                      <Camera className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500 font-medium">NFT Маркер</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Загрузите фото объекта: {step.title}
                      </p>
                      <p className="text-xs text-gray-300 mt-2">
                        Файлы: {step.nftDescriptor?.split('/').pop()}.*
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {/* Информация для NFT маркеров */}
              {step.markerType === 'nft' && (
                <div className="px-6 pb-4 print:hidden">
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-800 mb-1">📸 Для этого маркера нужно:</p>
                    <ol className="list-decimal list-inside text-blue-700 space-y-1">
                      <li>Сфотографировать: <strong>{step.title}</strong></li>
                      <li>Место съёмки: {step.location}</li>
                      <li>Создать NFT-дескриптор и сохранить как: <code className="bg-blue-100 px-1">{step.nftDescriptor?.split('/').pop()}</code></li>
                    </ol>
                  </div>
                </div>
              )}
              
              <div className="px-6 pb-4 text-center text-sm text-gray-500 print:hidden">
                Рекомендуемый размер: 20×20 см | {step.markerType === 'nft' ? 'Требуется фото объекта' : 'Готов к печати'}
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Футер */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <Card className="bg-green-50 border-green-200 print:hidden">
          <CardContent className="p-4">
            <p className="text-green-800 text-sm">
              <strong>🏆 Промокод для финала:</strong> {PARK_CONFIG.promoCode} (скидка {PARK_CONFIG.discount})
            </p>
          </CardContent>
        </Card>
        
        <p className="text-sm text-gray-500 mt-4 print:block hidden">
          AR-Квест «{PARK_CONFIG.name}» — Распечатано: {new Date().toLocaleDateString('ru-RU')}
        </p>
      </div>
    </div>
  );
}
