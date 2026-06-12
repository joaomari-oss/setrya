from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Supabase transaction pooler (port 6543) runs PgBouncer in transaction mode,
# which does NOT support prepared statements. asyncpg uses them by default, so
# disable the statement cache and give each prepared stmt a unique name.
_is_pooler = "pooler.supabase.com" in settings.database_url or ":6543" in settings.database_url

connect_args = {}
if _is_pooler:
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

# Auto-fix: Supabase gives postgresql:// but asyncpg needs postgresql+asyncpg://
_db_url = settings.database_url
if _db_url.startswith("postgresql://") and "+asyncpg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _db_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
