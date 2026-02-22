from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Check for database URL in various common environment variables
raw_url = os.getenv("SQLALCHEMY_DATABASE_URL") or os.getenv("DATABASE_URL")

if raw_url:
    print(f"DEBUG: Found Database URL in environment: {raw_url[:15]}...")
    SQLALCHEMY_DATABASE_URL = raw_url
else:
    print("DEBUG: No Database URL found in environment, falling back to localhost")
    SQLALCHEMY_DATABASE_URL = "postgresql://localhost/skydo_local"

# Railway/Heroku provide "postgres://", but SQLAlchemy requires "postgresql://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
