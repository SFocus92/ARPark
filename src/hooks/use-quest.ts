/**
 * =====================================================
 * ХУК УПРАВЛЕНИЯ СОСТОЯНИЕМ КВЕСТА (7 ЭТАПОВ)
 * =====================================================
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STEPS, PARK_CONFIG, isValidNextStep, QuestStep } from '@/lib/quest-config';

// =====================================================
// ТИПЫ СОСТОЯНИЯ
// =====================================================

interface QuestState {
  // Состояние квеста
  isStarted: boolean;
  completedSteps: number;
  foundMarkers: string[];
  isComplete: boolean;
  
  // Текущее состояние AR
  currentMarker: string | null;
  showingContent: boolean;
  lastFoundStep: QuestStep | null; // Последний найденный этап для озвучки
  message: string | null;
  messageType: 'success' | 'error' | 'info' | null;
  
  // Состояние камеры
  cameraReady: boolean;
  cameraError: string | null;
  
  // Настройки
  soundEnabled: boolean;
  
  // Действия
  startQuest: () => void;
  resetQuest: () => void;
  handleMarkerFound: (markerId: string) => void;
  handleMarkerLost: () => void;
  setCameraReady: (ready: boolean) => void;
  setCameraError: (error: string | null) => void;
  clearMessage: () => void;
  toggleSound: () => void;
  getCurrentStep: () => QuestStep | null;
  getProgress: () => { current: number; total: number; percentage: number };
}

// =====================================================
// ZUSTAND STORE С PERSIST
// =====================================================

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      isStarted: false,
      completedSteps: 0,
      foundMarkers: [],
      isComplete: false,
      currentMarker: null,
      showingContent: false,
      lastFoundStep: null,
      message: null,
      messageType: null,
      cameraReady: false,
      cameraError: null,
      soundEnabled: true,
      
      // ---------------------------------------------------
      // НАЧАТЬ КВЕСТ
      // ---------------------------------------------------
      startQuest: () => {
        const currentStep = STEPS[0];
        set({
          isStarted: true,
          completedSteps: 0,
          foundMarkers: [],
          isComplete: false,
          currentMarker: null,
          showingContent: false,
          message: `🎮 Добро пожаловать в AR-квест "${PARK_CONFIG.name}"!\n📍 Этап 1 из 7: ${currentStep.title}\n\n${currentStep.hint}`,
          messageType: 'info',
        });
      },
      
      // ---------------------------------------------------
      // СБРОСИТЬ КВЕСТ
      // ---------------------------------------------------
      resetQuest: () => {
        set({
          isStarted: false,
          completedSteps: 0,
          foundMarkers: [],
          isComplete: false,
          currentMarker: null,
          showingContent: false,
          message: null,
          messageType: null,
        });
      },
      
      // ---------------------------------------------------
      // ОБРАБОТКА ОБНАРУЖЕНИЯ МАРКЕРА
      // ---------------------------------------------------
      handleMarkerFound: (markerId: string) => {
        const state = get();
        
        // Если квест уже завершён
        if (state.isComplete) {
          set({
            message: '🏆 Квест уже пройден! Сбросьте прогресс для повторного прохождения.',
            messageType: 'info',
          });
          return;
        }
        
        // Проверяем валидность шага
        const validation = isValidNextStep(markerId, state.completedSteps);
        
        if (validation.valid) {
          // Правильный маркер!
          const newCompletedSteps = state.completedSteps + 1;
          const isNowComplete = newCompletedSteps >= STEPS.length;
          const foundStep = STEPS.find(s => s.id === markerId)!;
          const nextStep = STEPS[newCompletedSteps];
          
          // Формируем сообщение
          let message = '';
          if (isNowComplete) {
            message = `🎉 ПОЗДРАВЛЯЕМ!\n\nВы прошли весь квест!\n\n🎁 Ваш промокод: ${PARK_CONFIG.promoCode}\n💰 Скидка: ${PARK_CONFIG.discount}\n\nПокажите этот промокод на кассе!`;
          } else if (foundStep.clueForNext) {
            message = `✅ ${foundStep.clueForNext}`;
          } else {
            message = `✅ Отлично! Этап ${newCompletedSteps} из 7 пройден!\n\n📍 Следующая цель: ${nextStep.title}\n${nextStep.hint}`;
          }
          
          set({
            currentMarker: markerId,
            showingContent: true,
            lastFoundStep: foundStep, // Сохраняем найденный этап для озвучки
            completedSteps: newCompletedSteps,
            foundMarkers: [...state.foundMarkers, markerId],
            isComplete: isNowComplete,
            message: message,
            messageType: 'success',
          });
        } else {
          // Неправильный маркер
          let errorMessage = '❌ Не тот маркер!';
          const expectedStep = STEPS[state.completedSteps];
          
          switch (validation.reason) {
            case 'wrong_order':
              errorMessage = `❌ Не тот маркер!\n\n📍 Ищите маркер №${state.completedSteps + 1}: ${expectedStep?.title || 'неизвестно'}\n${expectedStep?.location || ''}`;
              break;
            case 'already_found':
              errorMessage = '✓ Ты уже нашёл эту метку!\n\nИщи следующую цель.';
              break;
            case 'quest_complete':
              errorMessage = '🏆 Квест уже пройден!';
              break;
          }
          
          set({
            currentMarker: markerId,
            showingContent: false,
            message: errorMessage,
            messageType: 'error',
          });
        }
      },
      
      // ---------------------------------------------------
      // ОБРАБОТКА ПОТЕРИ МАРКЕРА
      // ---------------------------------------------------
      handleMarkerLost: () => {
        set({
          currentMarker: null,
          showingContent: false,
        });
      },
      
      // ---------------------------------------------------
      // УСТАНОВИТЬ СОСТОЯНИЕ КАМЕРЫ
      // ---------------------------------------------------
      setCameraReady: (ready: boolean) => {
        set({
          cameraReady: ready,
          cameraError: ready ? null : get().cameraError,
        });
      },
      
      // ---------------------------------------------------
      // УСТАНОВИТЬ ОШИБКУ КАМЕРЫ
      // ---------------------------------------------------
      setCameraError: (error: string | null) => {
        set({
          cameraError: error,
          cameraReady: false,
        });
      },
      
      // ---------------------------------------------------
      // ОЧИСТИТЬ СООБЩЕНИЕ
      // ---------------------------------------------------
      clearMessage: () => {
        set({
          message: null,
          messageType: null,
        });
      },
      
      // ---------------------------------------------------
      // ПЕРЕКЛЮЧИТЬ ЗВУК
      // ---------------------------------------------------
      toggleSound: () => {
        set({ soundEnabled: !get().soundEnabled });
      },
      
      // ---------------------------------------------------
      // ПОЛУЧИТЬ ТЕКУЩИЙ ШАГ
      // ---------------------------------------------------
      getCurrentStep: () => {
        const state = get();
        if (state.completedSteps >= STEPS.length) {
          return null;
        }
        return STEPS[state.completedSteps];
      },
      
      // ---------------------------------------------------
      // ПОЛУЧИТЬ ПРОГРЕСС
      // ---------------------------------------------------
      getProgress: () => {
        const state = get();
        return {
          current: state.completedSteps,
          total: STEPS.length,
          percentage: Math.round((state.completedSteps / STEPS.length) * 100),
        };
      },
    }),
    {
      name: 'ar-quest-sevapark',
      partialize: (state) => ({
        isStarted: state.isStarted,
        completedSteps: state.completedSteps,
        foundMarkers: state.foundMarkers,
        isComplete: state.isComplete,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// =====================================================
// ХУК ДЛЯ КОМПОНЕНТОВ
// =====================================================

export function useQuest() {
  const store = useQuestStore();
  
  return {
    // Состояние
    isStarted: store.isStarted,
    completedSteps: store.completedSteps,
    isComplete: store.isComplete,
    currentMarker: store.currentMarker,
    showingContent: store.showingContent,
    message: store.message,
    messageType: store.messageType,
    cameraReady: store.cameraReady,
    cameraError: store.cameraError,
    soundEnabled: store.soundEnabled,
    
    // Вычисляемые значения
    currentStep: store.getCurrentStep(),
    progress: store.getProgress(),
    
    // Действия
    startQuest: store.startQuest,
    resetQuest: store.resetQuest,
    handleMarkerFound: store.handleMarkerFound,
    handleMarkerLost: store.handleMarkerLost,
    setCameraReady: store.setCameraReady,
    setCameraError: store.setCameraError,
    clearMessage: store.clearMessage,
    toggleSound: store.toggleSound,
  };
}
