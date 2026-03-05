# Todo Fullstack — Laravel Sanctum + Next.js

A fullstack todo application with token-based authentication.

## Tech Stack

- **Backend:** Laravel 12, Sanctum (API tokens), SQLite
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui
- **Package Manager:** Bun
- **Docker:** PHP 8.4 FPM + nginx + Bun

## Getting Started

### Prerequisites

- Docker & Docker Compose

### Setup

```bash
# Clone the repo
git clone https://github.com/cmanish049/todo-fullstatck-laravel-sanctum-nextjs.git
cd todo-fullstatck-laravel-sanctum-nextjs

# Copy env file
cp backend/.env.example backend/.env

# Start all services
docker compose up -d

# Generate app key & run migrations
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

The app will be available at:

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000

## API Endpoints

### Auth

| Method | Endpoint         | Description          |
|--------|------------------|----------------------|
| POST   | `/api/register`  | Register a new user  |
| POST   | `/api/login`     | Login & get token    |
| POST   | `/api/refresh`   | Refresh access token |
| POST   | `/api/logout`    | Logout (auth required) |

### Todos (auth required)

| Method | Endpoint               | Description        |
|--------|------------------------|--------------------|
| GET    | `/api/todos`           | List todos (paginated) |
| POST   | `/api/todos`           | Create a todo      |
| GET    | `/api/todos/:id`       | Get a todo         |
| PUT    | `/api/todos/:id`       | Update a todo      |
| DELETE | `/api/todos/:id`       | Delete a todo      |
| PATCH  | `/api/todos/:id/toggle`| Toggle completion  |

## Authentication

- Access tokens expire in **15 minutes**
- Refresh tokens are valid for **7 days** with rotation
- The frontend automatically refreshes expired tokens via an Axios interceptor

## Project Structure

```
├── backend/             # Laravel API
│   ├── app/Http/Controllers/
│   ├── app/Models/
│   ├── routes/api.php
│   └── Dockerfile
├── frontend/            # Next.js app
│   ├── src/app/         # Pages (login, register, todos)
│   ├── src/components/  # UI components
│   ├── src/lib/         # API client & auth helpers
│   └── Dockerfile
├── docker/nginx/        # nginx config
└── docker-compose.yml
```
