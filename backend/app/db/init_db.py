import asyncio
from pathlib import Path
from app.core.config import get_settings
from setup_db import setup_sqlite_database

settings = get_settings()

_initialized = False

async def init_db() -> None:
    global _initialized
    if _initialized:
        return

    db_path = settings.SQLALCHEMY_DATABASE_URI.replace("sqlite+aiosqlite:///", "", 1)
    if db_path and not db_path.startswith("postgres"):
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)

    setup_sqlite_database()
    _initialized = True

async def main() -> None:
    print("Creating initial data")
    await init_db()
    print("Initial data created")

if __name__ == "__main__":
    asyncio.run(main()) 