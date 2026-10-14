import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("database")

db_url = settings.get_sqlalchemy_database_url()

# Configure engine settings based on dialect (PostgreSQL vs. SQLite)
engine_kwargs = {
    "pool_pre_ping": True,
}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Serverless Neon Postgres optimizations
    engine_kwargs.update({
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    """Create all database tables if they do not already exist."""
    try:
        from app.models.db_models import CafeDB, MenuDB, DishDB
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database schema initialized successfully on {db_url.split('@')[-1] if '@' in db_url else 'local db'}")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
