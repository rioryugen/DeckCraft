# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from pydantic import BaseModel


class OllamaModelMetadata(BaseModel):
    label: str
    value: str
    size: str
