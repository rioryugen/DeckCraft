# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from enum import Enum


class LLMCallType(Enum):
    UNSTRUCTURED = "unstructured"
    UNSTRUCTURED_STREAM = "unstructured_stream"
    STRUCTURED = "structured"
    STRUCTURED_STREAM = "structured_stream"
