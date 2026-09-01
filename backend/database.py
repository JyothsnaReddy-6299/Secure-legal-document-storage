import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Always use an absolute directory path so the database file is always in the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "sih_dms_data.db")

# Read credentials from .env if present
def load_env():
    env_path = os.path.join(BASE_DIR, ".env")
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

env = load_env()

DB_USER = env.get("DB_USER", "root")
DB_PASSWORD = env.get("DB_PASSWORD", "password")
DB_HOST = env.get("DB_HOST", "localhost")
DB_PORT = env.get("DB_PORT", "3306")
DB_NAME = env.get("DB_NAME", "sih_dms")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Connect to MySQL, or use persistent local SQLite database file
try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    connection = engine.connect()
    connection.close()
    print(f"Connected to MySQL database ({DB_NAME})")
except Exception:
    DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    print(f"Using persistent database file at: {SQLITE_DB_PATH}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
