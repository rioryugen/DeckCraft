# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from enum import Enum


class ImageProvider(Enum):
    PEXELS = "pexels"
    PIXABAY = "pixabay"
    GEMINI_FLASH = "gemini_flash"
    NANOBANANA_PRO = "nanobanana_pro"
    DALLE3 = "dall-e-3"
    GPT_IMAGE_1_5 = "gpt-image-1.5"
    COMFYUI = "comfyui"
    OPEN_WEBUI = "open_webui"
    OPENAI_COMPATIBLE = "openai_compatible"
