# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from enum import Enum


class WebhookEvent(str, Enum):
    PRESENTATION_GENERATION_COMPLETED = "presentation.generation.completed"
    PRESENTATION_GENERATION_FAILED = "presentation.generation.failed"
