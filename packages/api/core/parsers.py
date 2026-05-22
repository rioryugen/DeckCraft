# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
def parse_bool_or_none(value: str | None) -> bool | None:
    if value is None:
        return None
    return value.lower() == "true"
