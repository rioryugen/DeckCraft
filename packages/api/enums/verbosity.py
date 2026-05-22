# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from enum import Enum


class Verbosity(str, Enum):
    CONCISE = "concise"
    STANDARD = "standard"
    TEXT_HEAVY = "text-heavy"

