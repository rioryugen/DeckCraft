# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.sql.presentation_layout_code import PresentationLayoutCodeModel
from schemas.sql.template import TemplateModel
from providers.database import get_async_session

LAYOUT_MANAGEMENT_ROUTER = APIRouter(
    prefix="/template-management", tags=["template-management"]
)


class LayoutData(BaseModel):
    presentation: UUID
    layout_id: str
    layout_name: str
    layout_code: str
    fonts: Optional[List[str]] = None


class SaveLayoutsRequest(BaseModel):
    layouts: list[LayoutData]


class SaveLayoutsResponse(BaseModel):
    success: bool
    saved_count: int
    message: Optional[str] = None


class GetLayoutsResponse(BaseModel):
    success: bool
    layouts: list[LayoutData]
    message: Optional[str] = None
    template: Optional[dict] = None
    fonts: Optional[List[str]] = None


class PresentationSummary(BaseModel):
    presentation_id: UUID
    layout_count: int
    last_updated_at: Optional[datetime] = None
    template: Optional[dict] = None


class GetPresentationSummaryResponse(BaseModel):
    success: bool
    presentations: List[PresentationSummary]
    total_presentations: int
    total_layouts: int
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    detail: str
    error_code: Optional[str] = None


class TemplateCreateRequest(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None


class TemplateCreateResponse(BaseModel):
    success: bool
    template: dict
    message: Optional[str] = None


@LAYOUT_MANAGEMENT_ROUTER.post(
    "/save-templates",
    response_model=SaveLayoutsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def save_layouts(
    request: SaveLayoutsRequest, session: AsyncSession = Depends(get_async_session)
):
    """
    Save multiple layouts for presentations.

    Args:
        request: JSON request containing array of layout data
        session: Database session

    Returns:
        SaveLayoutsResponse with success status and count of saved layouts

    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    try:
        if not request.layouts:
            raise HTTPException(status_code=400, detail="Layouts array cannot be empty")

        if len(request.layouts) > 50:
            raise HTTPException(
                status_code=400, detail="Cannot save more than 50 layouts at once"
            )

        saved_count = 0

        for i, layout_data in enumerate(request.layouts):
            if (
                not layout_data.presentation
                or not str(layout_data.presentation).strip()
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Layout {i+1}: presentation_id cannot be empty",
                )

            if not layout_data.layout_id or not layout_data.layout_id.strip():
                raise HTTPException(
                    status_code=400, detail=f"Layout {i+1}: layout_id cannot be empty"
                )

            if not layout_data.layout_name or not layout_data.layout_name.strip():
                raise HTTPException(
                    status_code=400, detail=f"Layout {i+1}: layout_name cannot be empty"
                )

            if not layout_data.layout_code or not layout_data.layout_code.strip():
                raise HTTPException(
                    status_code=400, detail=f"Layout {i+1}: layout_code cannot be empty"
                )

            stmt = select(PresentationLayoutCodeModel).where(
                PresentationLayoutCodeModel.presentation == layout_data.presentation,
                PresentationLayoutCodeModel.layout_id == layout_data.layout_id,
            )
            result = await session.execute(stmt)
            existing_layout = result.scalar_one_or_none()

            if existing_layout:
                existing_layout.layout_name = layout_data.layout_name
                existing_layout.layout_code = layout_data.layout_code
                existing_layout.fonts = layout_data.fonts
                existing_layout.updated_at = datetime.now()
            else:
                new_layout = PresentationLayoutCodeModel(
                    presentation=layout_data.presentation,
                    layout_id=layout_data.layout_id,
                    layout_name=layout_data.layout_name,
                    layout_code=layout_data.layout_code,
                    fonts=layout_data.fonts,
                )
                session.add(new_layout)

            saved_count += 1

        await session.commit()

        return SaveLayoutsResponse(
            success=True,
            saved_count=saved_count,
            message=f"Successfully saved {saved_count} layout(s)",
        )

    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        print(f"Unexpected error saving layouts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while saving layouts: {str(e)}",
        )


@LAYOUT_MANAGEMENT_ROUTER.get(
    "/get-templates/{presentation}",
    response_model=GetLayoutsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid presentation ID"},
        404: {
            "model": ErrorResponse,
            "description": "No layouts found for presentation",
        },
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_layouts(
    presentation: UUID, session: AsyncSession = Depends(get_async_session)
):
    """
    Retrieve all layouts for a specific presentation.
    """
    try:
        if not presentation or len(str(presentation).strip()) == 0:
            raise HTTPException(
                status_code=400, detail="Presentation ID cannot be empty"
            )

        stmt = select(PresentationLayoutCodeModel).where(
            PresentationLayoutCodeModel.presentation == presentation
        )
        result = await session.execute(stmt)
        layouts_db = result.scalars().all()

        if not layouts_db:
            raise HTTPException(
                status_code=404,
                detail=f"No layouts found for presentation ID: {presentation}",
            )

        layouts = [
            LayoutData(
                presentation=layout.presentation,
                layout_id=layout.layout_id,
                layout_name=layout.layout_name,
                layout_code=layout.layout_code,
                fonts=layout.fonts,
            )
            for layout in layouts_db
        ]

        aggregated_fonts: set[str] = set()
        for layout in layouts_db:
            if layout.fonts:
                aggregated_fonts.update([f for f in layout.fonts if isinstance(f, str)])
        fonts_list = sorted(list(aggregated_fonts)) if aggregated_fonts else None

        template_meta = await session.get(TemplateModel, presentation)
        template = None
        if template_meta:
            template = {
                "id": template_meta.id,
                "name": template_meta.name,
                "description": template_meta.description,
                "created_at": template_meta.created_at,
            }

        return GetLayoutsResponse(
            success=True,
            layouts=layouts,
            message=f"Retrieved {len(layouts)} layout(s) for presentation {presentation}",
            template=template,
            fonts=fonts_list,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving layouts for presentation {presentation}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while retrieving layouts: {str(e)}",
        )


@LAYOUT_MANAGEMENT_ROUTER.get(
    "/summary",
    response_model=GetPresentationSummaryResponse,
    summary="Get all presentations with layout counts",
    description="Retrieve a summary of all presentations and the number of layouts in each",
    responses={
        200: {
            "model": GetPresentationSummaryResponse,
            "description": "Presentations summary retrieved successfully",
        },
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_presentations_summary(
    session: AsyncSession = Depends(get_async_session),
):
    """Get summary of all presentations with their layout counts."""
    try:
        stmt = select(
            PresentationLayoutCodeModel.presentation,
            func.count(PresentationLayoutCodeModel.id).label("layout_count"),
            func.max(PresentationLayoutCodeModel.updated_at).label("last_updated_at"),
        ).group_by(PresentationLayoutCodeModel.presentation)

        result = await session.execute(stmt)
        presentation_data = result.all()

        presentations = []
        for row in presentation_data:
            template_meta = await session.get(TemplateModel, row.presentation)
            template = None
            if template_meta:
                template = {
                    "id": template_meta.id,
                    "name": template_meta.name,
                    "description": template_meta.description,
                    "created_at": template_meta.created_at,
                }
            presentations.append(
                PresentationSummary(
                    presentation_id=row.presentation,
                    layout_count=row.layout_count,
                    last_updated_at=row.last_updated_at,
                    template=template,
                )
            )

        total_presentations = len(presentations)
        total_layouts = sum(p.layout_count for p in presentations)

        return GetPresentationSummaryResponse(
            success=True,
            presentations=presentations,
            total_presentations=total_presentations,
            total_layouts=total_layouts,
            message=f"Retrieved {total_presentations} presentation(s) with {total_layouts} total layout(s)",
        )

    except Exception as e:
        print(f"Error retrieving presentations summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while retrieving presentations summary: {str(e)}",
        )


@LAYOUT_MANAGEMENT_ROUTER.post(
    "/templates",
    response_model=TemplateCreateResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def create_template(
    request: TemplateCreateRequest,
    session: AsyncSession = Depends(get_async_session),
):
    try:
        if not request.id or not request.name:
            raise HTTPException(status_code=400, detail="id and name are required")

        existing = await session.get(TemplateModel, request.id)
        if existing:
            existing.name = request.name
            existing.description = request.description
        else:
            session.add(
                TemplateModel(
                    id=request.id, name=request.name, description=request.description
                )
            )
        await session.commit()

        template = await session.get(TemplateModel, request.id)
        return TemplateCreateResponse(
            success=True,
            template={
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "created_at": template.created_at,
            },
            message="Template saved",
        )
    except HTTPException:
        await session.rollback()
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to save template: {str(e)}"
        )


@LAYOUT_MANAGEMENT_ROUTER.delete("/delete-templates/{template_id}", status_code=204)
async def delete_template(
    template_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    try:
        await session.execute(
            delete(TemplateModel).where(TemplateModel.id == template_id)
        )
        await session.execute(
            delete(PresentationLayoutCodeModel).where(
                PresentationLayoutCodeModel.presentation == template_id,
            )
        )
        await session.commit()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete template")
