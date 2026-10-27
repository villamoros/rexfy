# RexFy

Marketplace B2B de materiales reciclables: conecta generadores de residuos, compradores/transformadores y transportistas.

Arquitectura: monolito modular (ver [`docs/`](docs/)).

| Carpeta | Qué es |
|---|---|
| `apps/web` | Frontend Next.js + TypeScript + Tailwind |
| `apps/api` | Backend FastAPI + SQLAlchemy + Alembic |
| `docs/` | Pack de producto, modelo C4 y blueprint técnico |

## Requisitos

- Docker (para PostgreSQL y Redis)
- Node.js 22+
- Python 3.12+ y [uv](https://docs.astral.sh/uv/)

## Arrancar en local

```bash
# 1. Base de datos y Redis
docker compose up -d postgres redis

# 2. API (http://localhost:8000, docs en /docs)
cd apps/api
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# 3. Worker de tareas (emails), en otra terminal desde apps/api
uv run python -m app.worker

# 4. Web (http://localhost:3000), en otra terminal
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

### Login con Clerk

El ingreso y registro los maneja [Clerk](https://clerk.com). Crea una aplicación en el dashboard de Clerk y copia sus llaves (sección **API keys**):

- En `apps/web/.env.local`: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`.
- En `apps/api/.env`: `REXFY_CLERK_ISSUER` (el *Frontend API URL*, por ejemplo `https://tu-app.clerk.accounts.dev`) y `REXFY_CLERK_SECRET_KEY` (la misma secret key).

La API valida el token de sesión de Clerk con sus llaves públicas (JWKS) y, la primera vez que ve a un usuario, lee su correo y nombre de Clerk y lo crea en la base. Las empresas, roles y permisos siguen viviendo en nuestra base.

### Datos de demo

La base arranca vacía. Para ver el marketplace con publicaciones de ejemplo (3 empresas, 6 materiales):

```bash
cd apps/api
uv run python -m app.cli.seed
```

Se puede correr varias veces: solo crea lo que falta. Solo funciona con `REXFY_ENV=local`.

### Notificaciones

Mensajes, cotizaciones, órdenes, envíos, disputas y verificaciones crean una notificación en la
app (la campana del encabezado) y un email a los miembros de la empresa. Los emails los manda el
worker; sin `REXFY_SMTP_HOST` solo se escriben en su log. Para no correr el worker en local,
usa `REXFY_TASK_QUEUE=inline`.

### Admin de RexFy

El panel `/admin` (verificar empresas, moderar publicaciones, disputas y actividad) es para el
equipo de RexFy. Ingresa una vez con tu cuenta y luego, desde `apps/api`:

```bash
uv run python -m app.cli.admin tu@correo.com            # dar acceso
uv run python -m app.cli.admin tu@correo.com --revoke   # quitarlo
```

Los transportadores solo ven solicitudes de transporte cuando su empresa está verificada.

La página de inicio muestra el estado de la API, la base de datos y Redis. Si los tres dicen `ok`, todo está conectado.

Para levantar también la API dentro de Docker: `docker compose --profile full up`.

## Pruebas y lint

```bash
cd apps/api && uv run pytest && uv run ruff check .
cd apps/web && npm run lint && npm run typecheck && npm run build
```
