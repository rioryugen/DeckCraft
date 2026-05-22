# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from pydantic import BaseModel

from schemas.presentation_outline_model import SlideOutlineModel


class DocumentChunk(BaseModel):
    heading: str
    content: str
    heading_index: int
    score: float

    def to_slide_outline(self) -> SlideOutlineModel:
        return SlideOutlineModel(content=f"{self.heading}\n{self.content}")
