# --------------------------------------------------
# Imports
# --------------------------------------------------
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------
load_dotenv()

# --------------------------------------------------
# Database Configuration
# --------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

# Build DATABASE_URL from individual variables if not provided
if not DATABASE_URL:
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")

    # Ensure DB_USER, DB_PASSWORD, and DB_NAME are provided
    if not all([DB_USER, DB_PASSWORD, DB_NAME]):
        raise ValueError("❌ Database configuration is missing in .env")

    # Construct PostgreSQL connection string
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --------------------------------------------------
# Create Database Engine
# --------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

# --------------------------------------------------
# Session Configuration
# --------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# --------------------------------------------------
# Base model for all tables
# --------------------------------------------------
Base = declarative_base()


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()