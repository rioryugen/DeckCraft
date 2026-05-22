# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
import asyncio
import uuid
from unittest.mock import Mock

from schemas.sql.slide import SlideModel
from providers.icon_finder_service import IconFinderService
from templates.presentation_layout import PresentationLayoutModel, SlideLayoutModel
from core import process_slides
from core.icon_weights import extract_icon_weight_from_settings, normalize_icon_weight


def test_icon_weight_settings_uses_only_icon_weight_and_fallback():
    assert extract_icon_weight_from_settings({"icon_weight": "thin"}) == "thin"
    assert extract_icon_weight_from_settings({"wrong_key": "thin"}) == "bold"
    assert extract_icon_weight_from_settings({"icon_weight": "unknown"}) == "bold"
    assert normalize_icon_weight(None) == "bold"


def test_presentation_layout_reads_template_icon_weight():
    layout = PresentationLayoutModel(
        name="general",
        ordered=False,
        icon_weight="duotone",
        slides=[SlideLayoutModel(id="intro", json_schema={"title": "Intro"})],
    )

    assert layout.icon_weight == "duotone"


def test_icon_finder_builds_weighted_static_urls(monkeypatch):
    service = IconFinderService()
    monkeypatch.setattr(
        "services.icon_finder_service.get_resource_path",
        lambda path: f"/app/{path}",
    )
    monkeypatch.setattr(
        "services.icon_finder_service.os.path.isfile",
        lambda path: True,
    )

    regular_url = service._icon_url_for_weight(
        "chart-line-up-bold||chart growth",
        "regular",
    )
    thin_url = service._icon_url_for_weight("chart-line-up-bold", "thin")

    assert regular_url.endswith("/static/icons/regular/chart-line-up.svg")
    assert thin_url.endswith("/static/icons/thin/chart-line-up-thin.svg")


def test_process_slide_fetches_icons_with_template_weight(monkeypatch):
    captured = {}

    async def fake_search_icons(query, k=1, weight=None):
        captured["query"] = query
        captured["weight"] = weight
        return [f"/static/icons/{weight}/checks-{weight}.svg"]

    monkeypatch.setattr(
        process_slides.ICON_FINDER_SERVICE,
        "search_icons",
        fake_search_icons,
    )

    slide = SlideModel(
        presentation=uuid.uuid4(),
        layout_group="general",
        layout="layout-1",
        index=0,
        content={
            "icon": {
                "__icon_query__": "success check",
                "__icon_url__": "/static/icons/placeholder.svg",
            }
        },
        properties=None,
    )

    assets = asyncio.run(
        process_slides.process_slide_and_fetch_assets(
            image_generation_service=Mock(),
            slide=slide,
            icon_weight="thin",
        )
    )

    assert assets == []
    assert captured == {"query": "success check", "weight": "thin"}
    assert slide.content["icon"]["__icon_url__"].endswith(
        "/static/icons/thin/checks-thin.svg"
    )
