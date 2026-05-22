# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
"""Heuristics for LLM errors when image + text (vision) is required but the model rejects it."""

from __future__ import annotations

import re

# Shown in API/job error text; frontend uses this for a clearer toast title.
VISION_LAYOUT_ERROR_MARKER = "TEMPLATE_VISION_MODEL_REQUIRED"

VISION_LAYOUT_USER_MESSAGE = (
    f"{VISION_LAYOUT_ERROR_MARKER}\n\n"
    "Generating a custom template layout sends a slide screenshot to your text model, "
    "so the model must support vision (image + text).\n\n"
    "The current text model does not accept image inputs. Open Settings, pick a "
    "vision-capable model for your provider (for example GPT-4o, Claude 3.5 Sonnet or "
    "newer, or Gemini with image support), save, and try again."
)


def _collect_exception_text(exc: BaseException, *, max_chain: int = 10) -> str:
    parts: list[str] = []
    seen: set[int] = set()
    cur: BaseException | None = exc
    depth = 0
    while cur is not None and depth < max_chain and id(cur) not in seen:
        seen.add(id(cur))
        parts.append(str(cur))
        msg = getattr(cur, "message", None)
        if isinstance(msg, str) and msg.strip():
            parts.append(msg)
        body = getattr(cur, "body", None)
        if body is not None:
            parts.append(repr(body))
        for attr in ("response", "error", "detail"):
            obj = getattr(cur, attr, None)
            if isinstance(obj, str) and obj.strip():
                parts.append(obj)
            elif isinstance(obj, dict):
                parts.append(repr(obj))
        cur = cur.__cause__ or cur.__context__
        depth += 1
    return " ".join(parts).lower()


def is_likely_vision_capability_error(exc: BaseException) -> bool:
    """
    Best-effort detection across OpenAI-compatible, Anthropic, Gemini, and LiteLLM errors
    when the model rejects multimodal / image content.
    """
    blob = _collect_exception_text(exc)
    if not blob.strip():
        return False

    strong = (
        "image input",
        "image inputs",
        "image_url",
        "input_image",
        "inline_data",
        "multimodal",
        "multi-modal",
        "vision is not",
        "does not support images",
        "does not support image",
        "cannot accept image",
        "image content is not supported",
        "unsupported content type",
        "model is not multimodal",
        "text-only model",
        "text only model",
        "this model only supports text",
        "only supports text",
        "invalid image",
        "badimage",
        "no image support",
        "images are not supported",
        "image parts",
        "content blocks of type image",
        "type 'image'",
        "modality image",
    )
    if any(s in blob for s in strong):
        return True

    if "image" in blob or "picture" in blob or "screenshot" in blob:
        weak = (
            "not supported",
            "unsupported",
            "not allowed",
            "invalid",
            "cannot",
            "does not support",
            "not available",
            "not enabled",
            "not accept",
            "rejected",
            "forbidden",
            "bad request",
        )
        if any(w in blob for w in weak):
            return True

    if re.search(r"\bimage_url\b", blob) or re.search(r"\binput_image\b", blob):
        return True

    return False
