# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from datetime import datetime, timezone


def get_current_utc_datetime():
    return datetime.now(timezone.utc)
