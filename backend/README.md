# Todo API — Laravel Backend

REST API for the Todo application, built with Laravel 12 and Sanctum token authentication.

## Stack

- **Framework:** Laravel 12
- **Auth:** Sanctum API tokens (15 min expiry) + refresh tokens (7 day, rotation)
- **Database:** SQLite

## Setup

```bash
# From the project root
cp backend/.env.example backend/.env

# Via Docker
docker compose up -d
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

API available at http://localhost:8000

## API Endpoints

### Auth

| Method | Endpoint         | Description            |
|--------|------------------|------------------------|
| POST   | `/api/register`  | Register a new user    |
| POST   | `/api/login`     | Login & get tokens     |
| POST   | `/api/refresh`   | Refresh access token   |
| POST   | `/api/logout`    | Logout (auth required) |

### Todos (auth required)

| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | `/api/todos`           | List todos (paginated) |
| POST   | `/api/todos`           | Create a todo        |
| GET    | `/api/todos/:id`       | Get a todo           |
| PUT    | `/api/todos/:id`       | Update a todo        |
| DELETE | `/api/todos/:id`       | Delete a todo        |
| PATCH  | `/api/todos/:id/toggle`| Toggle completion    |

## Models

- **User** — standard Laravel user with Sanctum tokens
- **Todo** — belongs to user (`title`, `description`, `completed`, `priority`)
- **RefreshToken** — long-lived tokens for silent re-authentication

## Key Files

```
app/Http/Controllers/
├── AuthController.php    # Register, login, logout, refresh
└── TodoController.php    # CRUD + toggle

app/Models/
├── User.php
├── Todo.php
└── RefreshToken.php

routes/api.php            # All API routes
config/cors.php           # CORS for frontend (localhost:3000)
config/sanctum.php        # Sanctum config
```
