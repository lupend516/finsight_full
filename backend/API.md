# FinSight Backend — API Reference

Base URL: `http://localhost:5000/api`

---

## AUTH

### POST /auth/register
Регистрация нового пользователя.

**Body:**
```json
{
  "email": "user@company.com",
  "password": "min8chars",
  "first_name": "Amir",
  "last_name": "Seitkali"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "first_name": "Amir", ... },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

### POST /auth/login
Вход в систему.

**Body:**
```json
{
  "email": "user@company.com",
  "password": "yourpassword"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

---

### GET /auth/me 🔒
Профиль текущего пользователя.

**Headers:** `Authorization: Bearer <token>`

---

### PUT /auth/me 🔒
Обновить профиль.

**Body:** `{ "first_name": "...", "last_name": "...", "avatar": "..." }`

---

### PUT /auth/change-password 🔒
Сменить пароль.

**Body:**
```json
{
  "old_password": "currentPass123",
  "new_password": "newPass456"
}
```

---

## COMPANIES

### POST /companies 🔒
Создать компанию. Юзер автоматически становится **owner**.

**Body:**
```json
{
  "name": "TechCo Ltd",
  "industry": "Software",
  "country": "KZ",
  "currency": "KZT"
}
```

---

### GET /companies 🔒
Все компании текущего пользователя.

---

### GET /companies/:id 🔒
Данные конкретной компании.

---

### PUT /companies/:id 🔒 (owner/admin)
Обновить данные компании.

---

## MEMBERS & ROLES

### GET /companies/:id/members 🔒 (owner/admin)
Список участников компании с их ролями.

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "role": "accountant",
      "permissions": ["data:read", "data:write", ...],
      "joined_at": "2026-01-01T00:00:00Z",
      "user": {
        "id": "...",
        "email": "accountant@company.com",
        "first_name": "Zarina",
        ...
      }
    }
  ]
}
```

---

### PUT /companies/:id/members/:userId/role 🔒 (owner/admin)
Изменить роль участника.

**Body:** `{ "role": "analyst" }`

**Доступные роли:**
| Роль | Что может |
|------|-----------|
| `owner` | Всё. Только 1 на компанию. |
| `admin` | Всё кроме удаления компании и billing |
| `accountant` | Загрузка данных, отчёты, AI |
| `analyst` | Чтение данных и отчётов, AI |
| `viewer` | Только просмотр дашборда |

---

### DELETE /companies/:id/members/:userId 🔒 (owner/admin)
Удалить участника из компании.

---

## INVITATIONS

### POST /companies/:id/invite 🔒 (owner/admin)
Пригласить пользователя по email.

**Body:**
```json
{
  "email": "newuser@example.com",
  "role": "accountant"
}
```

**Response:**
```json
{
  "data": {
    "invitation": { ... },
    "invite_link": "http://localhost:3000/invite?token=abc-123",
    "message": "Invitation sent. Share the link with the user."
  }
}
```

Ссылку нужно отправить пользователю (email-отправка — Phase 2).

---

### GET /companies/:id/invitations 🔒 (owner/admin)
Список всех приглашений компании.

---

### DELETE /companies/:id/invitations/:invId 🔒 (owner/admin)
Отозвать приглашение.

---

### GET /invitations/verify/:token
**Публичный.** Проверить токен приглашения (для страницы принятия).

**Response:**
```json
{
  "data": {
    "email": "invited@example.com",
    "role": "analyst",
    "company_name": "TechCo Ltd",
    "expires_at": "2026-04-21T00:00:00Z"
  }
}
```

---

### POST /invitations/accept 🔒
Принять приглашение (пользователь должен быть залогинен).

**Body:** `{ "token": "uuid-token-here" }`

---

## Быстрый старт

```bash
# 1. Клонируй / скопируй папку backend
cp .env.example .env
# Вставь MONGO_URI из MongoDB Atlas и измени JWT_SECRET

# 2. Установи зависимости
go mod tidy

# 3. Запусти
go run cmd/server/main.go

# Проверь
curl http://localhost:5000/health
```
