"""
setup_db.py — Database setup using SQLAlchemy (replaces raw sqlite3).

⚠️  DEVELOPMENT ONLY — The demo credentials below are for local development.
    NEVER use these in production. Change the admin password immediately
    after first login.
"""
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent


def setup_database() -> bool:
    """Set up database tables and seed data using SQLAlchemy."""
    print("\nSetting up database via SQLAlchemy...")

    # Import models so Base.metadata is populated
    from app.models.base import Base
    import app.models.models as models  # noqa: F401
    from app.core.config import get_settings

    settings = get_settings()
    db_uri = settings.SQLALCHEMY_DATABASE_URI

    # Convert async URI to sync for table creation
    sync_uri = db_uri
    if "+aiosqlite" in sync_uri:
        sync_uri = sync_uri.replace("+aiosqlite", "")
    elif "+asyncpg" in sync_uri:
        sync_uri = sync_uri.replace("+asyncpg", "+psycopg2")

    # For SQLite, ensure directory exists
    if "sqlite" in sync_uri:
        db_path_str = sync_uri.split("///", 1)[-1] if "///" in sync_uri else ""
        if db_path_str:
            Path(db_path_str).parent.mkdir(parents=True, exist_ok=True)

    try:
        engine = create_engine(sync_uri, echo=False)

        # Create all tables from SQLAlchemy models
        Base.metadata.create_all(bind=engine)
        print("Database tables created/verified.")

        # Seed initial data
        with Session(engine) as session:
            _seed_initial_data(session, models)

        engine.dispose()
        return True

    except Exception as e:
        print(f"\nError setting up database: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def _seed_initial_data(session: Session, models) -> None:
    """
    Seed default organization and admin user.

    [WARNING] DEVELOPMENT ONLY
    Default credentials: admin@vulnalyze.com / admin123
    These MUST be changed before any deployment.
    """
    from passlib.context import CryptContext

    # Check if default org already exists
    existing_org = session.get(models.Organization, 1)
    if not existing_org:
        org = models.Organization(
            id=1,
            name="Default Organization",
            description="Default organization for all users",
        )
        session.add(org)
        session.commit()
        print("Default organization created.")
    else:
        print("Default organization already exists.")

    # Check if admin user already exists
    existing_admin = session.get(models.User, 1)
    if not existing_admin:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # WARNING: DEVELOPMENT ONLY - Change this password immediately after first login
        admin_hash = pwd_context.hash("admin123")

        admin = models.User(
            id=1,
            email="admin@vulnalyze.com",
            hashed_password=admin_hash,
            full_name="Admin User",
            role=models.UserRole.ADMIN,
            is_active=True,
            organization_id=1,
        )
        session.add(admin)
        session.commit()
        print("Admin user created (admin@vulnalyze.com / admin123).")
    else:
        print("Admin user already exists.")


# Keep backward-compatible alias for init_db.py
def setup_sqlite_database() -> bool:
    """Backward-compatible wrapper — now uses SQLAlchemy for all DB types."""
    return setup_database()


def print_success_message():
    """Print success message with next steps."""
    print("\n" + "=" * 50)
    print("Database setup completed successfully!")
    print("=" * 50)
    print("\n[WARNING] DEVELOPMENT ONLY - Default admin credentials:")
    print("Email: admin@vulnalyze.com")
    print("Password: admin123")
    print("\nNext steps:")
    print("1. Access the API at: http://localhost:8000")
    print("2. Log in with the admin credentials")
    print("3. Change the default admin password")
    print("4. Start creating scans!")
    print("=" * 50)


def main():
    """Main setup function."""
    print("Starting database setup...")

    if not setup_database():
        print("\nError: Database setup failed")
        sys.exit(1)

    print_success_message()


if __name__ == "__main__":
    main()