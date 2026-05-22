# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from typing import List
from pydantic import BaseModel, Field


class PresentationStructureModel(BaseModel):
    slides: List[int] = Field(description="List of slide layout indexes")
