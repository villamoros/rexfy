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

# 3. Web (http://localhost:3000), en otra terminal
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

La página de inicio muestra el estado de la API, la base de datos y Redis. Si los tres dicen `ok`, todo está conectado.

Para levantar también la API dentro de Docker: `docker compose --profile full up`.

## Pruebas y lint

```bash
cd apps/api && uv run pytest && uv run ruff check .
cd apps/web && npm run lint && npm run build
```
