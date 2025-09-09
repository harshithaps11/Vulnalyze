import os
import sys
import sqlite3
import subprocess
from pathlib import Path
from typing import Optional, Tuple

def setup_sqlite_database() -> bool:
    """Set up SQLite database and initial data."""
    print("\nSetting up SQLite database...")
    
    # Create database directory if it doesn't exist
    db_dir = Path("backend/data")
    db_dir.mkdir(parents=True, exist_ok=True)
    
    # Create database file
    db_path = db_dir / "vulnalyze.db"
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Create tables
        print("Creating database tables...")
        
        # Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            full_name TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            is_superuser BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Organizations table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # User-Organization relationship
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_organizations (
            user_id INTEGER,
            organization_id INTEGER,
            role TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (organization_id) REFERENCES organizations (id),
            PRIMARY KEY (user_id, organization_id)
        )
        """)
        
        # Scans table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            target_url TEXT NOT NULL,
            scan_type TEXT NOT NULL,
            status TEXT NOT NULL,
            organization_id INTEGER,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (organization_id) REFERENCES organizations (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
        """)
        
        # Vulnerabilities table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vulnerabilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT NOT NULL,
            location TEXT,
            evidence TEXT,
            is_false_positive BOOLEAN DEFAULT FALSE,
            remediation_code TEXT,
            remediation_status TEXT DEFAULT 'pending',
            remediation_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (scan_id) REFERENCES scans (id)
        )
        """)
        
        # Create default organization
        cursor.execute("""
        INSERT OR IGNORE INTO organizations (id, name, description)
        VALUES (1, 'Default Organization', 'Default organization for all users')
        """)
        
        # Create admin user (password: admin123)
        cursor.execute("""
        INSERT OR IGNORE INTO users (id, email, hashed_password, full_name, is_superuser)
        VALUES (1, 'admin@vulnalyze.com', 
        '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        'Admin User', TRUE)
        """)
        
        # Link admin to default organization
        cursor.execute("""
        INSERT OR IGNORE INTO user_organizations (user_id, organization_id, role)
        VALUES (1, 1, 'admin')
        """)
        
        conn.commit()
        print("✓ Database tables created")
        print("✓ Default organization created")
        print("✓ Admin user created")
        
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