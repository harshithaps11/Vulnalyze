import asyncio
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import app.db.init_db as init_db

asyncio.run(init_db.init_db())
conn = sqlite3.connect(r"C:\Users\Harshitha\Documents\Vulnalyze\backend\data\vulnalyze.db")
print(conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
conn.close()
