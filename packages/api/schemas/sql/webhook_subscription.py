# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
import secrets
from typing import Optional
import uuid
from datetime import datetime
from sqlmodel import Column, DateTime, Field, SQLModel

from core.datetime_utils import get_current_utc_datetime


class WebhookSubscription(SQLModel, table=True):
    __tablename__ = "webhook_subscriptions"

    id: str = Field(
        default_factory=lambda: f"webhook-{secrets.token_hex(32)}", primary_key=True
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), nullable=False),
        default_factory=get_current_utc_datetime,
    )
    url: str
    secret: Optional[str] = None
    event: str = Field(index=True)
