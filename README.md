# Tender Monitor — особистий моніторинг тендерів Прозорро

Особистий сервіс для відстеження статусу тендерів (Спочатку тільки Прозорро).

## Стек

- **Frontend**: React + Vite + TypeScript
- **БД**: Supabase (PostgreSQL)
- **Хостинг**: Vercel (безкоштовно)
- **API**: Публічне API Прозорро

## Можливості (поточний етап)

- Додавання тендера за номером Прозорро (дані підтягуються автоматично)
- Ручне додавання тендера
- Список тендерів зі статусами
- Картка тендера з вкладкою «Інформація про тендер» (позиції) та «Примітки»
- Зміна статусу: Цікаво → Готуємо → Подали → Виграли / Програли / Архів

## Швидкий старт

### 1. Supabase

1. Створи проєкт на [supabase.com](https://supabase.com)
2. Відкрий **SQL Editor** і виконай скрипт з файлу `supabase-schema.sql`
3. В **Settings → API** скопіюй:
   - Project URL
   - anon public key

### 2. Локальний запуск

```bash
cp .env.example .env
# Встав свої VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY в .env

npm install
npm run dev
```

### 3. Деплой на Vercel

1. Залий репозиторій на GitHub
2. Імпортуй проєкт у [vercel.com](https://vercel.com)
3. Додай Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Структура проєкту

```
src/
  components/     # UI-компоненти (Layout, AddTenderModal)
  lib/            # supabase.ts, prozorro.ts
  pages/          # TenderList, TenderDetail
  types/          # типи TypeScript
```

## Наступні кроки

- Фільтри та пошук
- Зірочка / важливі
- Експорт у Word
- Комерційні тендери (не тільки Прозорро)
- Оновлення даних з API по кнопці
