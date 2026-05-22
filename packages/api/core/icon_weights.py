# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from collections.abc import Mapping
from typing import Any


DEFAULT_ICON_WEIGHT = "bold"
ALLOWED_ICON_WEIGHTS = ("bold", "duotone", "fill", "light", "regular", "thin")

def normalize_icon_weight(value: Any) -> str:
    if not isinstance(value, str):
        return DEFAULT_ICON_WEIGHT

    normalized = value.strip().lower().replace("_", "-")
    if normalized in ALLOWED_ICON_WEIGHTS:
        return normalized
    return DEFAULT_ICON_WEIGHT


def extract_icon_weight_from_settings(settings: Mapping[str, Any] | None) -> str:
    if not settings:
        return DEFAULT_ICON_WEIGHT

    nested_settings = settings.get("settings")
    if isinstance(nested_settings, Mapping):
        nested_weight = extract_icon_weight_from_settings(nested_settings)
        if nested_weight != DEFAULT_ICON_WEIGHT:
            return nested_weight

    return normalize_icon_weight(settings.get("icon_weight"))
