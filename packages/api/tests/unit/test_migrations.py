# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

import migrations


def _alembic_config(database_url: str) -> Config:
    config = Config()
    config.set_main_option(
        "script_location", str(Path(__file__).resolve().parents[2] / "alembic")
    )
    config.set_main_option("sqlalchemy.url", database_url)
    return config


def test_legacy_database_with_theme_is_stamped_past_theme_migration(
    tmp_path, monkeypatch
):
    database_url = f"sqlite:///{tmp_path / 'legacy.db'}"
    engine = create_engine(database_url)
    try:
        with engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE presentations (id TEXT PRIMARY KEY, theme JSON)")
            )
    finally:
        engine.dispose()

    stamped_revisions = []
    monkeypatch.setattr(
        migrations.command,
        "stamp",
        lambda _config, revision: stamped_revisions.append(revision),
    )

    migrations._stamp_legacy_database_if_needed(
        _alembic_config(database_url), database_url
    )

    assert stamped_revisions == [migrations.REVISION_BEFORE_TEMPLATE_CREATE_INFO]


def test_upgrade_from_baseline_stamp_skips_existing_theme_column(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'baseline-stamped.db'}"
    engine = create_engine(database_url)
    try:
        with engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE presentations (id TEXT PRIMARY KEY, theme JSON)")
            )
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
                {"revision": migrations.LEGACY_BASELINE_REVISION},
            )

        command.upgrade(_alembic_config(database_url), "head")

        with engine.connect() as connection:
            version = connection.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one()
            columns = {
                row[1]
                for row in connection.execute(text("PRAGMA table_info(presentations)"))
            }

        assert version == "c7b70d0f31b1"
        assert "theme" in columns
    finally:
        engine.dispose()


def test_upgrade_from_theme_stamp_skips_existing_template_create_infos_table(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'template-table-exists.db'}"
    engine = create_engine(database_url)
    try:
        with engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE presentations (id TEXT PRIMARY KEY, theme JSON)")
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE template_create_infos (
                        id CHAR(32) NOT NULL,
                        fonts JSON,
                        pptx_url VARCHAR,
                        slide_htmls JSON NOT NULL,
                        slide_image_urls JSON NOT NULL,
                        created_at DATETIME NOT NULL,
                        PRIMARY KEY (id)
                    )
                    """
                )
            )
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
                {"revision": migrations.REVISION_BEFORE_TEMPLATE_CREATE_INFO},
            )

        command.upgrade(_alembic_config(database_url), "head")

        with engine.connect() as connection:
            version = connection.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one()
            tables = {
                row[0]
                for row in connection.execute(
                    text("SELECT name FROM sqlite_master WHERE type = 'table'")
                )
            }

        assert version == "c7b70d0f31b1"
        assert "template_create_infos" in tables
    finally:
        engine.dispose()


def test_upgrade_from_template_stamp_skips_existing_chat_history_table(tmp_path):
    database_url = f"sqlite:///{tmp_path / 'chat-table-exists.db'}"
    engine = create_engine(database_url)
    try:
        with engine.begin() as connection:
            connection.execute(text("CREATE TABLE presentations (id TEXT PRIMARY KEY)"))
            connection.execute(
                text(
                    """
                    CREATE TABLE chat_history_messages (
                        id CHAR(32) NOT NULL,
                        presentation_id CHAR(32) NOT NULL,
                        conversation_id CHAR(32) NOT NULL,
                        position INTEGER NOT NULL,
                        role VARCHAR NOT NULL,
                        content TEXT NOT NULL,
                        created_at DATETIME NOT NULL,
                        tool_calls JSON,
                        PRIMARY KEY (id)
                    )
                    """
                )
            )
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
                {"revision": migrations.REVISION_TEMPLATE_CREATE_INFO},
            )

        command.upgrade(_alembic_config(database_url), "head")

        with engine.connect() as connection:
            version = connection.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one()
            indexes = {
                row[1]
                for row in connection.execute(
                    text("PRAGMA index_list(chat_history_messages)")
                )
            }

        assert version == "c7b70d0f31b1"
        assert {
            "ix_chat_history_messages_conversation_id",
            "ix_chat_history_messages_position",
            "ix_chat_history_messages_presentation_id",
        }.issubset(indexes)
    finally:
        engine.dispose()
