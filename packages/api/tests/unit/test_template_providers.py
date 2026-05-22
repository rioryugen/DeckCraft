# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from __future__ import annotations

import asyncio
from dataclasses import dataclass

import pytest
from fastapi import HTTPException

from enums.llm_provider import LLMProvider
from templates import providers as providers_module


@dataclass
class _DummyResponse:
    content: object


class _DummyClient:
    def __init__(self, outputs: list[object]):
        self._outputs = outputs
        self.calls: list[dict] = []

    def generate(self, **kwargs):
        self.calls.append(kwargs)
        if not self._outputs:
            raise RuntimeError("No more outputs configured")
        next_item = self._outputs.pop(0)
        if isinstance(next_item, Exception):
            raise next_item
        return _DummyResponse(content=next_item)


@pytest.mark.parametrize(
    "provider",
    [
        LLMProvider.OPENAI,
        LLMProvider.CODEX,
        LLMProvider.GOOGLE,
        LLMProvider.VERTEX,
        LLMProvider.ANTHROPIC,
        LLMProvider.AZURE,
        LLMProvider.OLLAMA,
        LLMProvider.OPENROUTER,
        LLMProvider.CEREBRAS,
        LLMProvider.LITELLM,
        LLMProvider.CUSTOM,
    ],
)
def test_resolve_template_provider_and_model(monkeypatch, provider: LLMProvider):
    monkeypatch.setattr(providers_module, "get_llm_provider", lambda: provider)
    monkeypatch.setattr(providers_module, "get_model", lambda: "resolved-model")

    resolved_provider, resolved_model = (
        providers_module._resolve_template_provider_and_model()
    )

    assert resolved_provider == provider
    assert resolved_model == "resolved-model"


def test_provider_label_fallback_for_unknown_value():
    class _UnknownProvider:
        pass

    assert providers_module._provider_label(_UnknownProvider()) == "Template provider"


def test_exception_message_handles_http_exception_and_non_http_exception():
    class _CustomDetail:
        def __str__(self) -> str:
            return "detail as object"

    http_message = providers_module._exception_message(
        HTTPException(status_code=500, detail=_CustomDetail())
    )
    runtime_message = providers_module._exception_message(RuntimeError("plain error"))

    assert http_message == "detail as object"
    assert runtime_message == "plain error"


def test_exception_message_handles_http_exception_string_detail():
    http_message = providers_module._exception_message(
        HTTPException(status_code=400, detail="simple detail")
    )
    assert http_message == "simple detail"


@pytest.mark.parametrize(
    "provider",
    [
        LLMProvider.OPENAI,
        LLMProvider.CODEX,
        LLMProvider.GOOGLE,
        LLMProvider.VERTEX,
        LLMProvider.ANTHROPIC,
        LLMProvider.AZURE,
        LLMProvider.OLLAMA,
        LLMProvider.OPENROUTER,
        LLMProvider.CEREBRAS,
        LLMProvider.LITELLM,
        LLMProvider.CUSTOM,
    ],
)
def test_generate_slide_layout_code_uses_llmai_for_all_supported_providers(
    monkeypatch, provider: LLMProvider
):
    dummy_client = _DummyClient(outputs=["component-output"])
    llm_config = {"provider": provider.value}

    monkeypatch.setattr(providers_module, "get_llm_provider", lambda: provider)
    monkeypatch.setattr(providers_module, "get_model", lambda: f"{provider.value}-model")
    monkeypatch.setattr(providers_module, "get_llm_config", lambda: llm_config)
    monkeypatch.setattr(providers_module, "get_client", lambda config: dummy_client)

    result = asyncio.run(
        providers_module.generate_slide_layout_code(
            system_prompt="sys",
            user_text="user",
            image_bytes=b"image-binary",
            media_type="image/png",
        )
    )

    assert result == "component-output"
    assert len(dummy_client.calls) == 1

    call_kwargs = dummy_client.calls[0]
    assert call_kwargs["model"] == f"{provider.value}-model"
    assert call_kwargs["max_tokens"] == 8192
    messages = call_kwargs["messages"]
    assert len(messages) == 2
    assert messages[0].role == "system"
    assert messages[0].content == "sys"
    assert messages[1].role == "user"
    assert isinstance(messages[1].content, list)
    assert len(messages[1].content) == 2
    assert getattr(messages[1].content[0], "type", None) == "image"
    assert messages[1].content[1] == "user"


@pytest.mark.parametrize(
    "provider",
    [
        LLMProvider.OPENAI,
        LLMProvider.CODEX,
        LLMProvider.GOOGLE,
        LLMProvider.VERTEX,
        LLMProvider.ANTHROPIC,
        LLMProvider.AZURE,
        LLMProvider.OLLAMA,
        LLMProvider.OPENROUTER,
        LLMProvider.CEREBRAS,
        LLMProvider.LITELLM,
        LLMProvider.CUSTOM,
    ],
)
def test_edit_slide_layout_code_uses_llmai_text_only(
    monkeypatch, provider: LLMProvider
):
    dummy_client = _DummyClient(outputs=["edited-component"])

    monkeypatch.setattr(providers_module, "get_llm_provider", lambda: provider)
    monkeypatch.setattr(providers_module, "get_model", lambda: "text-model")
    monkeypatch.setattr(providers_module, "get_llm_config", lambda: {"provider": provider.value})
    monkeypatch.setattr(providers_module, "get_client", lambda config: dummy_client)

    result = asyncio.run(
        providers_module.edit_slide_layout_code(
            system_prompt="system-edit",
            user_text="edit this",
        )
    )

    assert result == "edited-component"
    assert len(dummy_client.calls) == 1
    user_message = dummy_client.calls[0]["messages"][1]
    assert user_message.role == "user"
    assert user_message.content == "edit this"


def test_call_template_provider_with_llmai_raises_when_output_is_empty(monkeypatch):
    dummy_client = _DummyClient(outputs=[None])
    monkeypatch.setattr(providers_module, "get_llm_config", lambda: {"provider": "openai"})
    monkeypatch.setattr(providers_module, "get_client", lambda config: dummy_client)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._call_template_provider_with_llmai(
                model="m",
                system_prompt="s",
                user_text="u",
            )
        )

    assert exc_info.value.status_code == 500
    assert "No output from template provider" in str(exc_info.value.detail)


def test_run_template_llm_with_retries_succeeds_after_transient_errors():
    attempts = {"count": 0}

    async def flaky_call():
        attempts["count"] += 1
        if attempts["count"] < 3:
            raise RuntimeError("temporary failure")
        return "ok"

    result = asyncio.run(
        providers_module._run_template_llm_with_retries(
            provider_label="OpenAI",
            call=flaky_call,
        )
    )

    assert result == "ok"
    assert attempts["count"] == 3


def test_run_template_llm_with_retries_handles_empty_response_as_failure():
    attempts = {"count": 0}

    async def empty_response():
        attempts["count"] += 1
        return ""

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="OpenAI",
                call=empty_response,
            )
        )

    assert attempts["count"] == providers_module.MAX_ATTEMPTS_PER_PROVIDER
    assert exc_info.value.status_code == 502
    assert "OpenAI error: No output from template generation provider" in str(
        exc_info.value.detail
    )


def test_run_template_llm_with_retries_fail_fast_on_client_errors():
    async def call_with_4xx():
        raise HTTPException(status_code=401, detail="bad credentials")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="OpenAI",
                call=call_with_4xx,
            )
        )

    assert exc_info.value.status_code == 401
    assert "bad credentials" in str(exc_info.value.detail)


def test_run_template_llm_with_retries_raises_last_http_exception_for_5xx():
    async def call_with_5xx():
        raise HTTPException(status_code=503, detail="service unavailable")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="Google",
                call=call_with_5xx,
            )
        )

    assert exc_info.value.status_code == 503
    assert "service unavailable" in str(exc_info.value.detail)


def test_run_template_llm_with_retries_raises_502_after_exhausting_attempts():
    async def always_fail():
        raise RuntimeError("upstream down")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="Azure OpenAI",
                call=always_fail,
            )
        )

    assert exc_info.value.status_code == 502
    assert "Azure OpenAI error" in str(exc_info.value.detail)


def test_run_template_llm_with_retries_raises_500_when_no_attempts(monkeypatch):
    original_attempts = providers_module.MAX_ATTEMPTS_PER_PROVIDER
    monkeypatch.setattr(providers_module, "MAX_ATTEMPTS_PER_PROVIDER", 0)

    async def never_called():
        return "ok"

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="OpenAI",
                call=never_called,
            )
        )

    monkeypatch.setattr(providers_module, "MAX_ATTEMPTS_PER_PROVIDER", original_attempts)
    assert exc_info.value.status_code == 500
    assert "Failed to generate template output" in str(exc_info.value.detail)

def test_run_template_llm_with_retries_maps_vision_errors_when_requires_vision():
    async def vision_fail():
        raise RuntimeError("This model does not support image inputs")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="OpenAI",
                call=vision_fail,
                requires_vision=True,
            )
        )

    assert exc_info.value.status_code == 400
    assert "TEMPLATE_VISION_MODEL_REQUIRED" in str(exc_info.value.detail)


def test_run_template_llm_with_retries_does_not_map_vision_without_flag():
    async def vision_fail():
        raise RuntimeError("This model does not support image inputs")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module._run_template_llm_with_retries(
                provider_label="OpenAI",
                call=vision_fail,
                requires_vision=False,
            )
        )

    assert exc_info.value.status_code == 502


def test_generate_slide_layout_code_fail_fast_on_vision_error(monkeypatch):
    dummy_client = _DummyClient(
        outputs=[RuntimeError("image_url is not supported for this model")]
    )
    monkeypatch.setattr(providers_module, "get_llm_provider", lambda: LLMProvider.OPENAI)
    monkeypatch.setattr(providers_module, "get_model", lambda: "text-only")
    monkeypatch.setattr(providers_module, "get_llm_config", lambda: {"provider": "openai"})
    monkeypatch.setattr(providers_module, "get_client", lambda config: dummy_client)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            providers_module.generate_slide_layout_code(
                system_prompt="sys",
                user_text="user",
                image_bytes=b"x",
            )
        )

    assert exc_info.value.status_code == 400
    assert len(dummy_client.calls) == 1
