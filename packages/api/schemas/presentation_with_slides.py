# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from typing import Any, List, Optional
from datetime import datetime
import uuid

from pydantic import BaseModel

from schemas.sql.slide import SlideModel


class PresentationWithSlides(BaseModel):
    id: uuid.UUID
    content: str
    n_slides: int
    language: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tone: Optional[str] = None
    verbosity: Optional[str] = None
    slides: List[SlideModel]
    theme: Optional[dict] = None
    fonts: Optional[Any] = None
