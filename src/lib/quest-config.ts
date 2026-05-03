/**
 * =====================================================
 * КОНФИГУРАЦИЯ AR-КВЕСТА ПАРКА "СеваПарк"
 * =====================================================
 * 
 * Полная версия с 7 этапами квеста
 * Поддержка NFT-маркеров для распознавания реальных объектов
 * 
 * =====================================================
 */

// =====================================================
// НАСТРОЙКИ ПАРКА (РЕДАКТИРУЙТЕ ЗДЕСЬ)
// =====================================================

export const PARK_CONFIG = {
  // Название парка - замените на своё
  name: "СеваПарк",
  
  // Финальный промокод - замените на свой
  promoCode: "SEVA2024AR",
  
  // Скидка, которую получает игрок
  discount: "25%",
  
  // Сообщение в финале
  finalMessage: "Поздравляем! Вы нашли все тайные метки и разгадали квест парка СеваПарк!",
};

// =====================================================
// ТИПЫ ДАННЫХ
// =====================================================

export interface QuestStep {
  id: string;                    // Уникальный идентификатор шага
  order: number;                 // Порядковый номер (1-7)
  
  // Тип маркера:
  // - 'pattern' - стандартный AR.js маркер (Hiro, Kanji)
  // - 'nft' - NFT маркер для распознавания реальных объектов (скамейка, дерево и т.д.)
  markerType: 'pattern' | 'nft';
  
  // Для pattern-маркеров: 'hiro' | 'kanji' или путь к .patt файлу
  patternType?: 'hiro' | 'kanji' | 'custom';
  patternUrl?: string;           // Путь к .patt файлу для custom
  
  // Для NFT-маркеров: путь к файлам дескриптора (без расширения)
  nftDescriptor?: string;        // Пример: '/assets/nft/bench'
  
  // Контент шага
  title: string;                 // Название локации
  description: string;           // Описание объекта для поиска
  location: string;              // Место в парке
  hint: string;                  // Подсказка где искать
  clueForNext: string;           // Подсказка для следующего шага
  
  // 3D-объект для отображения
  objectType: 'scroll' | 'model' | 'chest' | 'key' | 'gem' | 'compass' | 'treasure' | 'portal';
  modelUrl?: string;             // Путь к glTF модели (.glb)
  scrollText?: string;           // Текст для типа 'scroll'
  
  // Звук при обнаружении
  soundUrl?: string;             // Путь к звуковому файлу (.mp3)
  soundDescription?: string;     // Описание звука

  // Голосовое озвучивание текста
  voiceUrl?: string;             // Путь к голосовому файлу (.mp3) - озвучка scrollText
  
  // Анимация появления
  animation: 'fadeIn' | 'scaleIn' | 'rotateIn' | 'bounceIn' | 'portalIn';
  
  // Размер объекта (множитель)
  scale: number;
}

// =====================================================
// 7 ЭТАПОВ КВЕСТА (ПОЛНАЯ ВЕРСИЯ)
// =====================================================

export const STEPS: QuestStep[] = [
  // ---------------------------------------------------
  // ЭТАП 1: Вход в парк - Ворота
  // ---------------------------------------------------
  {
    id: 'marker_gate',
    order: 1,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-1',
    title: 'Главные ворота',
    description: 'Начните квест у входа в парк',
    location: 'У главных ворот парка',
    hint: 'Наведи камеру на объект у входа в парк',
    clueForNext: 'Отлично! Ты сделал первый шаг! Теперь ищи старый дуб слева от главной аллеи. Там спрятана следующая подсказка...',
    objectType: 'model',
    modelUrl: '/models/astronaut.glb',
    scrollText: 'Привет, путник! Ты вступил на путь тайн СеваПарка. Твоя первая задача — найти древний дуб. Остерегайся ложных путей!',
    soundUrl: '/assets/sounds/discover.mp3',
    soundDescription: 'Звук обнаружения',
    voiceUrl: '/assets/sounds/voice_quest_1.mp3',
    animation: 'fadeIn',
    scale: 1.5,
  },
  
  // ---------------------------------------------------
  // ЭТАП 2: Древний дуб - Дерево
  // ---------------------------------------------------
  {
    id: 'marker_tree',
    order: 2,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-2',
    title: 'Древний дуб',
    description: 'Найди старое дерево с дуплом',
    location: 'Слева от главной аллеи, рядом с фонтаном',
    hint: 'Ищи дерево с большим дуплом — там тайник!',
    clueForNext: 'Прекрасно! Ты нашёл ключ от следующей тайны. Теперь направляйся к деревянной скамейке у фонтана. Там тебя ждёт новая загадка...',
    objectType: 'model',
    modelUrl: '/models/shiba.glb',
    soundUrl: '/assets/sounds/magic-chime.mp3',
    soundDescription: 'Магический звон ключа',
    voiceUrl: '/assets/sounds/voice_quest_2.mp3',
    animation: 'scaleIn',
    scale: 1.5,
  },
  
  // ---------------------------------------------------
  // ЭТАП 3: Скамейка у фонтана
  // ---------------------------------------------------
  {
    id: 'marker_bench',
    order: 3,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-3',
    title: 'Тайная скамейка',
    description: 'Найди скамейку с резным узором',
    location: 'У центрального фонтана',
    hint: 'Ищи скамейку с изображением дракона на спинке',
    clueForNext: 'Ты разгадал загадку скамейки! Следующая подсказка спрятана у каменного грота. Ищи вход в небольшую пещеру...',
    objectType: 'model',
    modelUrl: '/models/cat.glb',
    scrollText: 'Ты близок к цели! Каменный грот хранит древний секрет. Найди вход и получишь награду. Но помни — путь не прост!',
    soundUrl: '/assets/sounds/scroll-unfurl.mp3',
    soundDescription: 'Звук разворачивающегося свитка',
    voiceUrl: '/assets/sounds/voice_quest_3.mp3',
    animation: 'fadeIn',
    scale: 1.5,
  },
  
  // ---------------------------------------------------
  // ЭТАП 4: Каменный грот
  // ---------------------------------------------------
  {
    id: 'marker_grotto',
    order: 4,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-4',
    title: 'Каменный грот',
    description: 'Найди вход в пещеру',
    location: 'В дальнем углу парка, за детской площадкой',
    hint: 'Ищи каменную арку, увитую плющом',
    clueForNext: 'Ты нашёл древний портал! Он ведёт к сокровищнице. Теперь ищи мостик через ручей — там ждёт дух-хранитель...',
    objectType: 'model',
    modelUrl: '/models/trex.glb',
    soundUrl: '/assets/sounds/portal-whoosh.mp3',
    soundDescription: 'Звук портала',
    voiceUrl: '/assets/sounds/voice_quest_4.mp3',
    animation: 'portalIn',
    scale: 1.2,
  },
  
  // ---------------------------------------------------
  // ЭТАП 5: Мостик через ручей
  // ---------------------------------------------------
  {
    id: 'marker_bridge',
    order: 5,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-5',
    title: 'Мост желаний',
    description: 'Найди деревянный мостик',
    location: 'За каменным гротом, через ручей',
    hint: 'Ищи мостик с вырезанными на перилах символами',
    clueForNext: 'Дух-хранитель показал тебе путь! Осталось найти последний ключ у статуи дракона. Торопись — награда близко!',
    objectType: 'model',
    modelUrl: '/models/cut_fish.glb',
    soundUrl: '/assets/sounds/gem-sparkle.mp3',
    soundDescription: 'Звук сияющего кристалла',
    voiceUrl: '/assets/sounds/voice_quest_5.mp3',
    animation: 'bounceIn',
    scale: 1.5,
  },
  
  // ---------------------------------------------------
  // ЭТАП 6: Статуя дракона
  // ---------------------------------------------------
  {
    id: 'marker_statue',
    order: 6,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-6',
    title: 'Статуя дракона',
    description: 'Найди каменного дракона',
    location: 'На центральной площади, у фонтана',
    hint: 'Ищи дракона с рубиновыми глазами — он укажет путь',
    clueForNext: 'Ты нашёл последний ключ! Сундук с сокровищами ждёт тебя у озера. Это финальный этап — награда почти твоя!',
    objectType: 'model',
    modelUrl: '/models/stylized_ww1_plane.glb',
    soundUrl: '/assets/sounds/compass-click.mp3',
    soundDescription: 'Звук компаса',
    voiceUrl: '/assets/sounds/voice_quest_6.mp3',
    animation: 'rotateIn',
    scale: 1.5,
  },
  
  // ---------------------------------------------------
  // ЭТАП 7: Озеро - ФИНАЛ
  // ---------------------------------------------------
  {
    id: 'marker_lake',
    order: 7,
    markerType: 'nft',
    nftDescriptor: '/assets/nft/marker-7',
    title: 'Озеро сокровищ',
    description: 'Найди сундук у озера',
    location: 'У озера, под ивой',
    hint: 'Ищи старую иву у воды — под ней спрятан сундук',
    clueForNext: '',
    objectType: 'model',
    modelUrl: '/models/chest.glb',
    soundUrl: '/assets/sounds/victory-fanfare.mp3',
    soundDescription: 'Победная фанфара',
    voiceUrl: '/assets/sounds/voice_quest_7.mp3',
    animation: 'scaleIn',
    scale: 1.5,
  },
];

// =====================================================
// СООБЩЕНИЯ ДЛЯ ИГРОКА (РЕДАКТИРУЙТЕ ЗДЕСЬ)
// =====================================================

export const MESSAGES = {
  // Когда игрок нашёл маркер не по порядку
  wrongOrder: "❌ Не тот маркер! Ищи другой в указанном месте.",
  
  // Когда игрок уже нашёл этот маркер
  alreadyFound: "✓ Ты уже нашёл эту метку! Ищи следующую.",
  
  // Подсказка для следующего шага
  nextStepHint: (step: QuestStep) => `📍 Ищи маркер №${step.order}: ${step.title}`,
  
  // Сообщение об ошибке камеры
  cameraError: "📷 Ваше устройство не поддерживает AR или камера недоступна.",
  
  // Требование HTTPS
  httpsRequired: "🔒 Для работы AR требуется HTTPS. Откройте приложение по защищённой ссылке.",
  
  // iOS инструкция
  iosPermission: "📱 Нажмите 'Разрешить' когда браузер запросит доступ к камере",
  
  // Поздравление
  congratulations: "🎉 Поздравляем! Вы прошли весь квест!",
};

// =====================================================
// НАСТРОЙКИ AR
// =====================================================

export const AR_CONFIG = {
  // Максимальная дальность обнаружения маркера (в метрах)
  maxDistance: 10,
  
  // Время отображения объекта (в миллисекундах, 0 = бесконечно)
  displayDuration: 0,
  
  // Режим отладки (показывает границы маркеров)
  debug: false,
  
  // Плавность трекинга
  smoothing: true,
  
  // Количество кадров для сглаживания
  smoothCount: 5,
  
  // Настройки UI
  ui: {
    showProgressBar: true,
    showHints: true,
    showResetButton: true,
    showSoundToggle: true,
  },
};

// =====================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ТЕКУЩЕГО ШАГА
// =====================================================

export function getCurrentStep(completedSteps: number): QuestStep | null {
  if (completedSteps >= STEPS.length) {
    return null; // Квест завершён
  }
  return STEPS[completedSteps];
}

// =====================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ШАГА ПО ID МАРКЕРА
// =====================================================

export function getStepByMarkerId(markerId: string): QuestStep | null {
  return STEPS.find(step => step.id === markerId) || null;
}

// =====================================================
// ФУНКЦИЯ ПРОВЕРКИ ПОСЛЕДОВАТЕЛЬНОСТИ
// =====================================================

export function isValidNextStep(markerId: string, completedSteps: number): {
  valid: boolean;
  reason: 'correct' | 'wrong_order' | 'already_found' | 'quest_complete';
} {
  const step = getStepByMarkerId(markerId);
  
  if (!step) {
    return { valid: false, reason: 'wrong_order' };
  }
  
  // Проверяем, завершён ли квест
  if (completedSteps >= STEPS.length) {
    return { valid: false, reason: 'quest_complete' };
  }
  
  // Проверяем, правильный ли это шаг по порядку
  const expectedOrder = completedSteps + 1;
  if (step.order === expectedOrder) {
    return { valid: true, reason: 'correct' };
  }
  
  // Проверяем, был ли этот шаг уже найден
  if (step.order <= completedSteps) {
    return { valid: false, reason: 'already_found' };
  }
  
  // Это маркер из будущего (не по порядку)
  return { valid: false, reason: 'wrong_order' };
}

// =====================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ОБЩЕГО КОЛИЧЕСТВА ЭТАПОВ
// =====================================================

export function getTotalSteps(): number {
  return STEPS.length;
}
