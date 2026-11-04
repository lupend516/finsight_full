# FinSight — Инструкция по запуску

## Структура проекта

```
FinSight_Full/
├── backend/    ← Go + MongoDB API
└── frontend/   ← React + Vite приложение
```

---

## Шаг 1 — MongoDB Atlas (база данных)

1. Зайди на https://cloud.mongodb.com
2. Создай бесплатный кластер (M0 Free Tier)
3. Нажми **Connect → Drivers → Copy connection string**
   Выглядит так:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```
4. Сохрани эту строку — она нужна для бэкенда

---

## Шаг 2 — Запуск бэкенда (Go)

```bash
cd backend

# 1. Создай .env файл
cp .env.example .env
```

Открой `.env` и заполни:
```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/finsight?retryWrites=true&w=majority
JWT_SECRET=придумай-любую-случайную-строку-32-символа
PORT=5001
ENV=development
FRONTEND_URL=http://localhost:3000
```

```bash
# 2. Установи зависимости
go mod tidy

# 3. Запусти сервер
go run cmd/server/main.go
```

Ты должен увидеть:
```
✅ Connected to MongoDB Atlas!
✅ Database indexes ready
🚀 FinSight backend running on http://localhost:5001
```

**Проверка:**
```bash
curl http://localhost:5001/health
# → {"status":"ok","service":"finsight-backend"}
```

---

## Шаг 3 — Запуск фронтенда (React)

Открой **новый терминал**:

```bash
cd frontend

# 1. Создай .env файл
cp .env.example .env
# Содержимое уже правильное: VITE_API_URL=http://localhost:5001/api

# 2. Установи зависимости
npm install

# 3. Запусти
npm run dev
```

Открой браузер: **http://localhost:3000**

---

## Что работает

### Авторизация
- **Sign Up** — регистрация нового пользователя
- **Log In** — вход с JWT токеном
- Токен сохраняется в localStorage, при обновлении страницы сессия сохраняется
- **Sign Out** — очищает токен

### После регистрации
- Онбординг: создание компании (шаг 1), подключение данных (шаг 2)
- После создания компании пользователь становится **owner**

### Дашборд
- Имя и компания в сайдбаре берутся из API
- Защищённые экраны (dashboard, settings...) требуют авторизации

### Settings → Team (вкладка)
- Список всех участников компании с ролями
- **Invite** — приглашение по email → создаётся ссылка
- **Change role** — смена роли для любого участника (кроме owner)
- **Remove** — удаление участника
- **Pending invitations** — список ожидающих приглашений с кнопкой Revoke

### Settings → Account
- Изменение имени
- Смена пароля

---

## Роли и права

| Роль       | Что может |
|------------|-----------|
| owner      | Всё. Нельзя сменить. |
| admin      | Всё кроме billing. Может приглашать |
| accountant | Загрузка данных, отчёты, AI |
| analyst    | Чтение отчётов, AI |
| viewer     | Только просмотр дашборда |

---

## Частые проблемы

**CORS ошибка в браузере**
→ Убедись что в `.env` бэкенда: `FRONTEND_URL=http://localhost:3000`

**"Email already registered"**
→ Используй другой email или проверь MongoDB Atlas → Collections → users

**Бэкенд не коннектится к MongoDB**
→ В MongoDB Atlas → Network Access → добавь свой текущий IP-адрес. Не открывай доступ для всех адресов без необходимости.

**go mod tidy ошибки**
→ Убедись что Go версии 1.24+: `go version`

---

## API эндпоинты

Полная документация в файле `backend/API.md`

Быстрый тест:
```bash
# Регистрация
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","first_name":"Test","last_name":"User"}'

# Логин
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```
