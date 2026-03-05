# Laravel + Next.js Todo Fullstack Monorepo Plan

## Context
Build a full-featured todo application as a monorepo with a Laravel API backend (Sanctum token auth, SQLite) and a Next.js React frontend, all orchestrated with Docker Compose.

## Monorepo Structure

```
todo-fullstack/
├── docker-compose.yml
├── .env
├── backend/                    # Laravel API
│   ├── Dockerfile
│   ├── app/
│   │   ├── Models/
│   │   │   ├── Todo.php
│   │   │   └── RefreshToken.php
│   │   └── Http/
│   │       └── Controllers/
│   │           ├── AuthController.php
│   │           └── TodoController.php
│   ├── database/
│   │   ├── database.sqlite
│   │   └── migrations/
│   │       ├── create_users_table.php          # ships with Laravel
│   │       ├── create_personal_access_tokens.php # ships with Sanctum
│   │       ├── create_todos_table.php          # php artisan make:migration
│   │       └── create_refresh_tokens_table.php # php artisan make:migration
│   ├── routes/
│   │   └── api.php
│   └── ...
├── frontend/                   # Next.js React
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # Landing/redirect
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── todos/page.tsx
│   │   ├── components/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   ├── TodoForm.tsx
│   │   │   └── Navbar.tsx
│   │   └── lib/
│   │       ├── api.ts             # Axios/fetch wrapper
│   │       └── auth.ts            # Token management
│   └── ...
└── README.md
```

## Git & Docker Ignore Files

### Root `.gitignore`
- `backend/vendor/`, `backend/.env`, `backend/database/database.sqlite`
- `frontend/node_modules/`, `frontend/.next/`, `frontend/.env.local`

### `backend/.dockerignore`
- `vendor/`, `.env`, `database/database.sqlite`, `storage/logs/*`

### `frontend/.dockerignore`
- `node_modules/`, `.next/`, `.env.local`

## Phase 1: Docker Setup

### docker-compose.yml (3 services)
- **app** service: PHP 8.5 FPM, runs Laravel PHP-FPM process
  - Base: `php:8.5-fpm`
  - Volume mounts `./backend` to `/var/www/html`
  - SQLite file stored inside the container volume
  - Installs Composer, PHP extensions (pdo_sqlite, sqlite3)
- **nginx** service: Nginx reverse proxy, exposed on port 8000
  - Base: `nginx:alpine`
  - Volume mounts `./backend` to `/var/www/html` (for static files)
  - Volume mounts `./docker/nginx/default.conf` to `/etc/nginx/conf.d/default.conf`
  - Proxies PHP requests to the `app` service on port 9000 (FastCGI)
  - Depends on `app`
- **frontend** service: Node 24 (LTS), runs Next.js dev server on port 3000
  - Base: `node:24-alpine`
  - Volume mounts `./frontend` to `/app`
  - Environment variable `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

### Backend Dockerfile (`backend/Dockerfile`)
- Base: `php:8.5-fpm`
- Install Composer, required PHP extensions (pdo_sqlite, sqlite3)
- Working dir `/var/www/html`
- CMD: `php-fpm` (default)

### Nginx Config (`docker/nginx/default.conf`)
- Listen on port 80
- Root `/var/www/html/public`
- `location /` — try_files, fall through to `index.php`
- `location ~ \.php$` — fastcgi_pass to `app:9000`

### Frontend Dockerfile (`frontend/Dockerfile`)
- Base: `node:24-alpine`
- Working dir `/app`
- CMD: `npm run dev`

## Phase 2: Laravel Backend

### Database (SQLite)
- Set `DB_CONNECTION=sqlite` in `.env`
- Create empty `database/database.sqlite`

### Todos Migration
```
todos table:
- id (primary key)
- user_id (foreign key -> users)
- title (string)
- description (text, nullable)
- completed (boolean, default false)
- priority (enum: low, medium, high; default medium)
- due_date (date, nullable)
- timestamps
```

### Authentication (Sanctum API Tokens + Refresh Token Rotation)
- Install `laravel/sanctum`
- Use `HasApiTokens` trait on User model
- **Short-lived access token**: expires in 15 minutes (configurable via `sanctum.expiration`)
- **Refresh token**: stored in a `refresh_tokens` table, expires in 7 days
- On each refresh, the old refresh token is revoked and a new pair (access + refresh) is issued (rotation)

#### Refresh Tokens Migration
```
refresh_tokens table:
- id (primary key)
- user_id (foreign key -> users)
- token (string, hashed, unique)
- expires_at (datetime)
- revoked (boolean, default false)
- timestamps
```

#### Auth Endpoints
- `POST /api/register` — create user, return access token + refresh token (public)
- `POST /api/login` — validate credentials, return access token + refresh token (public)
- `POST /api/logout` — revoke access token + refresh token (auth:sanctum)
- `POST /api/refresh` — accepts `{ refresh_token }` in request body (public, no Bearer header needed since access token is expired). Looks up user from the hashed refresh token record, validates expiry, revokes old refresh token, issues new access + refresh token pair

#### Auth Flow
1. Login/Register returns `{ access_token, refresh_token, expires_in: 900 }`
2. Frontend stores both tokens (access in memory/localStorage, refresh in localStorage)
3. Frontend attaches access token as `Authorization: Bearer <token>` on every request
4. When API returns 401 (token expired), frontend calls `/api/refresh` with the refresh token
5. If refresh succeeds → new tokens, retry original request
6. If refresh fails (expired/revoked) → redirect to login

### Todo API Endpoints (auth:sanctum middleware)
- `GET    /api/todos`        — list authenticated user's todos (paginated, with filtering/sorting)
- `POST   /api/todos`        — create todo (auto-assigns to authenticated user)
- `GET    /api/todos/{id}`   — show single todo (scoped to authenticated user)
- `PUT    /api/todos/{id}`   — update todo (scoped to authenticated user)
- `DELETE /api/todos/{id}`   — delete todo (scoped to authenticated user)
- `PATCH  /api/todos/{id}/toggle` — toggle completed status (scoped to authenticated user)

#### Authorization
- All todo queries are scoped via `auth()->user()->todos()` — users can only access their own todos
- Any attempt to access another user's todo returns 404 (not 403, to avoid leaking existence)

#### Pagination
- `GET /api/todos` returns paginated results (15 per page by default)
- Supports `?page=N` query parameter
- Response includes `meta` (current_page, last_page, total) and `links` (next, prev)

### Query Features
- Filter by: `completed` (boolean), `priority` (low/medium/high)
- Search by: `title` (partial match)
- Sort by: `created_at`, `due_date`, `priority`

### Form Request Validation
- `RegisterRequest`: name (required, string, max:255), email (required, email, unique:users), password (required, min:8, confirmed)
- `LoginRequest`: email (required, email), password (required)
- `StoreTodoRequest`: title (required, string, max:255), description (nullable, string), priority (in:low,medium,high), due_date (nullable, date, after_or_equal:today)
- `UpdateTodoRequest`: same as StoreTodoRequest but all fields optional
- Generated via `php artisan make:request`

### CORS
- Configure `config/cors.php` to allow `http://localhost:3000`

## Phase 3: Next.js Frontend

### Tech
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS for styling
- react-doctor — lint/diagnostic tool for React health scoring (60+ rules for performance, state/effects, security, dead code)

### Pages
1. **Login** (`/login`) — email/password form, stores token in localStorage
2. **Register** (`/register`) — name/email/password form
3. **Todos** (`/todos`) — main dashboard, protected route
   - List all todos with filters (completed, priority)
   - Search bar
   - Add new todo form/modal
   - Inline toggle complete
   - Edit/delete actions
   - Priority badges (color-coded)
   - Due date display

### API Client (`lib/api.ts`)
- Axios instance with base URL from env
- Request interceptor to attach `Authorization: Bearer <access_token>` header
- Response interceptor: on 401, automatically call `/api/refresh` with refresh token
  - If refresh succeeds → update stored tokens, retry the failed request
  - If refresh fails → clear tokens, redirect to `/login`
  - Queue concurrent requests during refresh to avoid multiple refresh calls

### Auth Flow
- Store access token + refresh token in localStorage
- Middleware/layout check: redirect to `/login` if no tokens
- On login/register success: store both tokens, redirect to `/todos`
- On logout: call `/api/logout`, clear tokens, redirect to `/login`

## Phase 4: Implementation Order

1. Create project scaffolding (docker-compose, Dockerfiles)
2. Initialize Laravel project in `backend/`
3. Configure SQLite, install Sanctum (publishes personal_access_tokens migration)
4. Generate migrations and models via artisan commands:
   - `php artisan make:migration create_todos_table`
   - `php artisan make:migration create_refresh_tokens_table`
   - `php artisan make:model Todo`
   - `php artisan make:model RefreshToken`
5. Build auth controllers and routes
6. Build todo controller and routes
7. Test API with curl/Postman
8. Initialize Next.js project in `frontend/`
9. Build API client and auth utilities
10. Build login/register pages
11. Build todo dashboard page with components
12. End-to-end testing via Docker Compose

## Verification
1. `docker compose up --build` — both services start without errors
2. Register a user via API → get token back
3. Login → get token
4. CRUD todos via API with token
5. Frontend: register → login → create/edit/delete/toggle todos
6. Verify auth protection (accessing `/todos` without token redirects to login)
