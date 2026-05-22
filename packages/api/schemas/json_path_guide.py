# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from typing import List
from pydantic import BaseModel


class DictGuide(BaseModel):
    key: str


class ListGuide(BaseModel):
    index: int


class JsonPathGuide(BaseModel):
    guides: List[DictGuide | ListGuide]
