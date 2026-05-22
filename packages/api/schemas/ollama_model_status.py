# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from typing import Optional
from pydantic import BaseModel


class OllamaModelStatus(BaseModel):
    name: str
    size: Optional[int] = None
    downloaded: Optional[int] = None
    status: str
    done: bool
    error: Optional[str] = None
