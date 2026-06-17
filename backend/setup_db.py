import os
import sys
import sqlite3
from pathlib import Path

def setup_sqlite_database() -> bool:
    """Set up SQLite database and initial data matching SQLAlchemy models exactly."""
    print("\nSetting up SQLite database...")
    
    # Create database directory if it doesn't exist
    db_dir = Path("backend/data")
    db_dir.mkdir(parents=True, exist_ok=True)
    
    # Create database file
    db_path = db_dir / "vulnalyze.db"
    
    # If old database exists, let's delete it to start fresh with correct schema
    if db_path.exists():
        try:
            db_path.unlink()
        except Exception as e:
            print(f"Warning: Could not remove old DB file: {e}")
            
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        print("Creating database tables with SQLAlchemy compatible schemas...")
        
        # 1. Organization table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS organization (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # 2. User table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            organization_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organization_id) REFERENCES organization (id)
        )
        """)
        
        # 3. Scan table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'pending',
            target_url TEXT NOT NULL,
            source_code TEXT,
            scan_type TEXT NOT NULL,
            results TEXT,
            user_id INTEGER,
            organization_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user (id),
            FOREIGN KEY (organization_id) REFERENCES organization (id)
        )
        """)
        
        # 4. Vulnerability table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vulnerability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT NOT NULL,
            location TEXT,
            evidence TEXT,
            is_false_positive BOOLEAN DEFAULT FALSE,
            false_positive_reason TEXT,
            remediation TEXT,
            vuln_metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (scan_id) REFERENCES scan (id)
        )
        """)
        
        # Insert Default Organization
        cursor.execute("""
        INSERT OR IGNORE INTO organization (id, name, description)
        VALUES (1, 'Default Organization', 'Default organization for all users')
        """)
        
        # Insert Admin User (password: admin123)
        cursor.execute("""
        INSERT OR IGNORE INTO user (id, email, hashed_password, full_name, role, is_active, organization_id)
        VALUES (1, 'admin@vulnalyze.com', 
        '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        'Admin User', 'ADMIN', TRUE, 1)
        """)
        
        conn.commit()
        print("Database tables created")
        print("Default organization created")
        print("Admin user created")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\nError setting up database: {str(e)}")
        return False

def print_success_message():
    """Print success message with next steps."""
    print("\n" + "="*50)
    print("Database setup completed successfully!")
    print("="*50)
    print("\nDefault admin credentials:")
    print("Email: admin@vulnalyze.com")
    print("Password: admin123")
    print("\nNext steps:")
    print("1. Access the API at: http://localhost:8000")
    print("2. Log in with the admin credentials")
    print("3. Change the default admin password")
    print("4. Start creating scans!")
    print("="*50)

def main():
    """Main setup function."""
    print("Starting database setup...")
    
    # Setup database
    if not setup_sqlite_database():
        print("\nError: Database setup failed")
        sys.exit(1)
    
    print_success_message()

if __name__ == "__main__":
    main()