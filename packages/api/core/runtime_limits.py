# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
import logging
import os

try:
    import resource
except Exception:  # pragma: no cover - Windows
    resource = None


def memory_snapshot_mb() -> dict[str, int]:
    if resource is None:
        return {}

    usage = resource.getrusage(resource.RUSAGE_SELF)
    rss_kb = int(usage.ru_maxrss)
    if os.sys.platform == "darwin":
        rss_mb = rss_kb // (1024 * 1024)
    else:
        rss_mb = rss_kb // 1024
    return {"rss_mb": max(rss_mb, 0)}


def log_memory(logger: logging.Logger, label: str, **fields: object) -> None:
    logger.info("[memory] %s %s extra=%s", label, memory_snapshot_mb(), fields)
    try:
        import sentry_sdk  # type: ignore

        sentry_sdk.add_breadcrumb(
            category="memory",
            message=label,
            level="info",
            data={**memory_snapshot_mb(), **fields},
        )
    except Exception:
        pass


class BoundedTextBuffer:
    def __init__(self, limit: int = 8192):
        self.limit = max(0, limit)
        self._text = ""
        self.truncated_chars = 0

    def append(self, value: bytes | str) -> None:
        if isinstance(value, bytes):
            text = value.decode("utf-8", errors="replace")
        else:
            text = value

        if self.limit <= 0:
            self.truncated_chars += len(text)
            return

        combined = self._text + text
        if len(combined) > self.limit:
            overflow = len(combined) - self.limit
            self.truncated_chars += overflow
            combined = combined[overflow:]
        self._text = combined

    def get(self) -> str:
        text = self._text.strip()
        if self.truncated_chars:
            return f"... [truncated {self.truncated_chars} chars]\n{text}".strip()
        return text
