# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from pydantic import BaseModel


class DecomposedFileInfo(BaseModel):
    name: str
    file_path: str
