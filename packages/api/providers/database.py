# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlmodel import SQLModel

from schemas.sql.async_presentation_generation_status import (
    AsyncPresentationGenerationTaskModel,
)
from schemas.sql.chat_history_message import ChatHistoryMessageModel
from schemas.sql.image_asset import ImageAsset
from schemas.sql.key_value import KeyValueSqlModel
from schemas.sql.ollama_pull_status import OllamaPullStatus
from schemas.sql.presentation_layout_code import PresentationLayoutCodeModel
from schemas.sql.presentation import PresentationModel
from schemas.sql.template import TemplateModel
from schemas.sql.template_create_info import TemplateCreateInfoModel
from schemas.sql.slide import SlideModel
from schemas.sql.webhook_subscription import WebhookSubscription
from core.get_env import get_migrate_database_on_startup_env
from core.db_utils import get_database_url_and_connect_args, get_pool_kwargs


database_url, connect_args = get_database_url_and_connect_args()

# Apply connection-pool settings for server-class databases (PostgreSQL, MySQL).
# SQLite uses a file-lock model and ignores pool configuration, so we skip it.
_pool_kwargs = get_pool_kwargs() if "sqlite" not in database_url else {}

sql_engine: AsyncEngine = create_async_engine(
    database_url, connect_args=connect_args, **_pool_kwargs
)
async_session_maker = async_sessionmaker(sql_engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


# Create Database and Tables
async def create_db_and_tables():
    should_run_alembic = get_migrate_database_on_startup_env() in ["true", "True"]
    if not should_run_alembic:
        async with sql_engine.begin() as conn:
            await conn.run_sync(
                lambda sync_conn: SQLModel.metadata.create_all(
                    sync_conn,
                    tables=[
                        PresentationModel.__table__,
                        SlideModel.__table__,
                        KeyValueSqlModel.__table__,
                        ChatHistoryMessageModel.__table__,
                        ImageAsset.__table__,
                        PresentationLayoutCodeModel.__table__,
                        TemplateCreateInfoModel.__table__,
                        TemplateModel.__table__,
                        WebhookSubscription.__table__,
                        AsyncPresentationGenerationTaskModel.__table__,
                        OllamaPullStatus.__table__,
                    ],
                )
            )


async def dispose_engines():
    """Dispose all engine connection pools.

    Call this during application shutdown (e.g. in a FastAPI ``shutdown``
    event or lifespan context) to release every connection back to the
    database and prevent stale / leaked connections.
    """
    await sql_engine.dispose()
