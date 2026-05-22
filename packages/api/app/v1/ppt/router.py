# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from fastapi import APIRouter

from app.v1.ppt.endpoints.slide_to_html import LAYOUT_MANAGEMENT_ROUTER
from app.v1.ppt.endpoints.presentation import PRESENTATION_ROUTER
from app.v1.ppt.endpoints.anthropic import ANTHROPIC_ROUTER
from app.v1.ppt.endpoints.codex_auth import CODEX_AUTH_ROUTER
from app.v1.ppt.endpoints.google import GOOGLE_ROUTER
from app.v1.ppt.endpoints.openai import OPENAI_ROUTER
from app.v1.ppt.endpoints.files import FILES_ROUTER
from app.v1.ppt.endpoints.pptx_slides import PPTX_SLIDES_ROUTER
from app.v1.ppt.endpoints.pdf_slides import PDF_SLIDES_ROUTER
from app.v1.ppt.endpoints.fonts import FONTS_ROUTER
from app.v1.ppt.endpoints.icons import ICONS_ROUTER
from app.v1.ppt.endpoints.images import IMAGES_ROUTER
from app.v1.ppt.endpoints.ollama import OLLAMA_ROUTER
from app.v1.ppt.endpoints.outlines import OUTLINES_ROUTER
from app.v1.ppt.endpoints.slide import SLIDE_ROUTER
from app.v1.ppt.endpoints.chat import CHAT_ROUTER
from app.v1.ppt.endpoints.pptx_slides import PPTX_FONTS_ROUTER
from app.v1.ppt.endpoints.theme import THEMES_ROUTER
from app.v1.ppt.endpoints.theme_generate import THEME_ROUTER
from templates.router import TEMPLATE_ROUTER


API_V1_PPT_ROUTER = APIRouter(prefix="/api/v1/ppt")

API_V1_PPT_ROUTER.include_router(FILES_ROUTER)
API_V1_PPT_ROUTER.include_router(FONTS_ROUTER)
API_V1_PPT_ROUTER.include_router(OUTLINES_ROUTER)
API_V1_PPT_ROUTER.include_router(PRESENTATION_ROUTER)
API_V1_PPT_ROUTER.include_router(PPTX_SLIDES_ROUTER)
API_V1_PPT_ROUTER.include_router(SLIDE_ROUTER)
API_V1_PPT_ROUTER.include_router(CHAT_ROUTER)
API_V1_PPT_ROUTER.include_router(LAYOUT_MANAGEMENT_ROUTER)
API_V1_PPT_ROUTER.include_router(IMAGES_ROUTER)
API_V1_PPT_ROUTER.include_router(ICONS_ROUTER)
API_V1_PPT_ROUTER.include_router(OLLAMA_ROUTER)
API_V1_PPT_ROUTER.include_router(PDF_SLIDES_ROUTER)
API_V1_PPT_ROUTER.include_router(OPENAI_ROUTER)
API_V1_PPT_ROUTER.include_router(ANTHROPIC_ROUTER)
API_V1_PPT_ROUTER.include_router(GOOGLE_ROUTER)
API_V1_PPT_ROUTER.include_router(CODEX_AUTH_ROUTER)
API_V1_PPT_ROUTER.include_router(PPTX_FONTS_ROUTER)
API_V1_PPT_ROUTER.include_router(THEMES_ROUTER)
API_V1_PPT_ROUTER.include_router(THEME_ROUTER)
API_V1_PPT_ROUTER.include_router(TEMPLATE_ROUTER)
