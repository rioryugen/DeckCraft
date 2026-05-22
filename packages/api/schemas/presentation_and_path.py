# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from pydantic import BaseModel
import uuid


class PresentationAndPath(BaseModel):
    presentation_id: uuid.UUID
    path: str


class PresentationPathAndEditPath(PresentationAndPath):
    edit_path: str
