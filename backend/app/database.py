from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.base import Base

# SQLite requires check_same_thread=False for multi-threaded use.
# This argument is ignored by Oracle/PostgreSQL drivers.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # recycles stale connections — important for Oracle
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def create_tables() -> None:
    """Create all tables. Called on startup for development convenience."""
    Base.metadata.create_all(bind=engine)
