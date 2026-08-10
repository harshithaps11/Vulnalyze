"""
Health check API routes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.session import get_db

settings = get_settings()
router = APIRouter(prefix=f"{settings.API_V1_STR}/health", tags=["health"])


@router.get("")
async def health_check():
    """Basic liveness check."""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "project": settings.PROJECT_NAME,
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check — verifies database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    return {
        "status": "ready" if db_status == "connected" else "not_ready",
        "database": db_status,
        "version": settings.VERSION,
    }
