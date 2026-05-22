# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
import aiohttp
from openai import AsyncOpenAI
from google import genai


def normalize_openai_compatible_base_url(url: str) -> str:
    """Ensure base URL targets the OpenAI-compatible /v1 root (LiteLLM, vLLM, etc.)."""
    u = (url or "").strip().rstrip("/")
    if not u:
        return u
    if u.endswith("/v1"):
        return u
    base = u.split("?", 1)[0]
    if "/v1" in base:
        return u
    return f"{u}/v1"


async def list_available_openai_compatible_models(url: str, api_key: str) -> list[str]:
    url = normalize_openai_compatible_base_url(url)
    # Local LiteLLM / OpenAI-compatible proxies often omit auth; SDK rejects a blank key.
    effective_key = (api_key or "").strip() or "EMPTY"
    client = AsyncOpenAI(api_key=effective_key, base_url=url)
    models = (await client.models.list()).data
    if models:
        return [m.id for m in models if m.id]
    return []


async def list_available_anthropic_models(api_key: str) -> list[str]:
    async with aiohttp.ClientSession(
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        }
    ) as session:
        async with session.get(
            "https://api.anthropic.com/v1/models",
            params={"limit": 50},
        ) as response:
            response.raise_for_status()
            data = await response.json()

    models = data.get("data", [])
    return [model.get("id") for model in models if model.get("id")]


async def list_available_google_models(api_key: str) -> list[str]:
    client = genai.Client(api_key=api_key)
    return [x.name for x in client.models.list(config={"page_size": 50}) if x.name]
