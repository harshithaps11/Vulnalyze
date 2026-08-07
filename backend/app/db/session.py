import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()
db_uri = settings.SQLALCHEMY_DATABASE_URI
if db_uri.startswith("sqlite"):
    db_path = os.getenv("VULNALYZE_DB_PATH")
    if db_path:
        db_path = str(Path(db_path).resolve())
        db_uri = f"sqlite+aiosqlite:///{db_path}"
    engine = create_async_engine(
        db_uri,
        echo=False,
    )
else:
    engine = create_async_engine(
        db_uri,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
        echo=False,
    )

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() 