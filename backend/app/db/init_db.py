import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.models import User, Organization, UserRole
from app.core.config import get_settings
from passlib.context import CryptContext

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_db() -> None:
    async with AsyncSessionLocal() as session:
        # Create default organization
        org = Organization(
            name="Default Organization",
            description="Default organization for initial setup"
        )
        session.add(org)
        await session.commit()
        await session.refresh(org)

        # Create admin user
        admin_user = User(
            email="admin@vulnalyze.com",
            hashed_password=pwd_context.hash("admin123"),  # Change this in production!
            full_name="Admin User",
            role=UserRole.ADMIN,
            organization_id=org.id
        )
        session.add(admin_user)
        await session.commit()

async def main() -> None:
    print("Creating initial data")
    await init_db()
    print("Initial data created")

if __name__ == "__main__":
    asyncio.run(main()) 