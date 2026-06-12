import ssl as _ssl_module
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from app.config import settings

# Auto-fix: Supabase gives postgresql:// but asyncpg needs postgresql+asyncpg://
_db_url = settings.database_url
if _db_url.startswith("postgresql://") and "+asyncpg" not in _db_url:
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

_is_pooler = "pooler.supabase.com" in _db_url or ":6543" in _db_url
_is_supabase = "supabase.com" in _db_url

if _is_supabase:
    _ssl_ctx = _ssl_module.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = _ssl_module.CERT_NONE
else:
    _ssl_ctx = None

connect_args: dict = {}
if _is_pooler:
    # PgBouncer transaction mode: no prepared statements + SSL
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "ssl": _ssl_ctx,
    }
elif _is_supabase:
    connect_args = {"ssl": _ssl_ctx}

if _is_pooler:
    # NullPool required with Supabase transaction pooler — SQLAlchemy pool
    # on top of PgBouncer causes "prepared statement does not exist" errors.
    engine = create_async_engine(
        _db_url,
        echo=settings.debug,
        poolclass=NullPool,
        connect_args=connect_args,
    )
else:
    engine = create_async_engine(
        _db_url,
        echo=settings.debug,
        pool_size=5,
        max_overflow=10,
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
