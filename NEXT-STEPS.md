# 🎉 Проект готов к деплою!

## ✅ Что уже сделано

1. **Фотографии оптимизированы** - 7 фото преобразованы в формат 1280×720 для NFT-маркеров
2. **Конфигурация обновлена** - все 7 этапов настроены с правильными путями к маркерам
3. **Git репозиторий создан** - код закоммичен и готов к пушу на GitHub
4. **Проект собирается** - `npm run build` выполняется успешно
5. **Документация готова** - README.md и DEPLOYMENT.md содержат все инструкции

## 🚀 Следующие шаги

### 1. Создать NFT-дескрипторы (ОБЯЗАТЕЛЬНО!)

Без этого шага AR-распознавание работать не будет!

**Откройте:** https://carnaux.github.io/NFT-Marker-Creator/

Для каждого файла из `public/assets/nft-sources/` (marker-1.jpg до marker-7.jpg):

1. Нажмите "Choose File" и загрузите marker-X.jpg
2. Нажмите "Generate" (займет 1-2 минуты)
3. Скачайте 3 файла: `image.fset`, `image.fset3`, `image.iset`
4. Переименуйте их в `marker-X.fset`, `marker-X.fset3`, `marker-X.iset`
5. Поместите в папку `public/assets/nft/`

**Результат:** В `public/assets/nft/` должно быть 21 файл (7 маркеров × 3 файла)

После создания дескрипторов:
```bash
git add public/assets/nft/
git commit -m "Add NFT marker descriptors"
```

### 2. Создать репозиторий на GitHub

**Вариант A: Через веб-интерфейс**
1. Откройте https://github.com/new
2. Repository name: `ar-quest-sevapark`
3. Выберите **Public**
4. НЕ добавляйте README (уже есть)
5. Нажмите "Create repository"

**Вариант B: Через GitHub CLI**
```bash
gh repo create ar-quest-sevapark --public --source=. --remote=origin
```

### 3. Запушить код на GitHub

```bash
git remote add origin https://github.com/SFocus92/ar-quest-sevapark.git
git branch -M main
git push -u origin main
```

### 4. Деплой на Netlify

**Вариант A: Через веб-интерфейс (проще)**
1. Откройте https://app.netlify.com/
2. "Add new site" → "Import an existing project"
3. Выберите "Deploy with GitHub"
4. Выберите репозиторий `ar-quest-sevapark`
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. "Deploy site"

**Вариант B: Через CLI**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 5. Тестирование

1. Откройте URL сайта на мобильном (iOS Safari или Android Chrome)
2. Разрешите доступ к камере
3. Наведите на распечатанные фотографии
4. Проверьте все 7 этапов
5. Убедитесь что промокод **SEVA2024AR** показывается в финале

## 📋 Структура проекта

```
D:\ar-quest-sevapark\
├── foto/                          # Исходные фотографии (7 шт)
├── public/
│   └── assets/
│       ├── nft-sources/           # Оптимизированные фото (готово ✓)
│       ├── nft/                   # NFT-дескрипторы (нужно создать!)
│       ├── models/                # 3D-модели (готово ✓)
│       └── sounds/                # Звуковые заглушки (готово ✓)
├── src/
│   ├── app/                       # Next.js страницы
│   ├── components/                # React компоненты
│   ├── hooks/                     # Хуки (use-quest.ts)
│   └── lib/                       # Конфигурация (quest-config.ts)
├── scripts/
│   └── optimize-photos.js         # Скрипт оптимизации (выполнен ✓)
├── README.md                      # Документация проекта
├── DEPLOYMENT.md                  # Инструкция по деплою
└── CLAUDE.md                      # Документация для Claude Code
```

## 🎯 Этапы квеста

| Этап | Название | Фото | Маркер | Объект |
|------|----------|------|--------|--------|
| 1 | Главные ворота | photo_21-17-01.jpg | marker-1 | Свиток |
| 2 | Древний дуб | photo_21-17-06.jpg | marker-2 | Ключ |
| 3 | Тайная скамейка | photo_21-17-08.jpg | marker-3 | Свиток |
| 4 | Каменный грот | photo_21-17-12.jpg | marker-4 | Портал |
| 5 | Мост желаний | photo_21-17-13.jpg | marker-5 | Кристалл |
| 6 | Статуя дракона | photo_21-17-15.jpg | marker-6 | Компас |
| 7 | Озеро сокровищ | photo_21-17-17.jpg | marker-7 | Сундук + Промокод |

## 🔧 Полезные команды

```bash
# Локальная разработка
npm run dev

# Проверка билда
npm run build

# Статус Git
git status

# Посмотреть коммиты
git log --oneline

# Открыть сайт Netlify
netlify open:site
```

## 📱 Тестирование без маркеров

В режиме разработки (`npm run dev`) можно тапать по экрану для имитации обнаружения маркеров:
- Экран разделен на 7 секций (слева направо)
- Тап в каждой секции = обнаружение соответствующего маркера

## ⚠️ Важные замечания

1. **HTTPS обязателен** - камера работает только по HTTPS (Netlify предоставляет автоматически)
2. **iOS = Safari** - на iPhone/iPad используйте Safari, не Chrome
3. **Освещение** - для распознавания маркеров нужно хорошее освещение
4. **Расстояние** - держите камеру на 30-100 см от объекта

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте `DEPLOYMENT.md` - там есть раздел "Устранение проблем"
2. Проверьте логи билда на Netlify
3. Проверьте консоль браузера (F12) на наличие ошибок

## 🎊 Готово!

После выполнения всех шагов ваш AR-квест будет доступен по адресу:
**https://ar-quest-sevapark.netlify.app**

Промокод: **SEVA2024AR** | Скидка: **25%**

---

**Удачи с запуском квеста! 🗺️🎮**
