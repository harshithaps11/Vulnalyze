"""
Vulnalyze — Application Security Platform
FastAPI application factory with modular API routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import init_db
from app.api import auth, scans, ai, health

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)


@app.on_event("startup")
async def startup_event() -> None:
    await init_db()


# ── CORS middleware ──────────────────────────────────────────────────────────

cors_origins = list(settings.BACKEND_CORS_ORIGINS)
if settings.FRONTEND_URL and settings.FRONTEND_URL not in cors_origins:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Include API routers ─────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(ai.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)