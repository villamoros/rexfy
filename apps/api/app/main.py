from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.infrastructure.storage import LocalStorage, get_storage
from app.presentation.routes import (
    admin,
    auth,
    companies,
    deals,
    health,
    listings,
    logistics,
    notifications,
    trust,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Rexfy API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(companies.router)
    app.include_router(listings.router)
    app.include_router(deals.router)
    app.include_router(logistics.router)
    app.include_router(trust.router)
    app.include_router(notifications.router)
    app.include_router(admin.router)
    storage = get_storage()
    if isinstance(storage, LocalStorage):
        storage.root.mkdir(parents=True, exist_ok=True)
        app.mount("/files", StaticFiles(directory=storage.root), name="files")
    return app


app = create_app()
