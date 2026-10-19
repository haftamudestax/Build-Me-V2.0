
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/hero",
    tags=["Hero Analytics"],
)


@router.get("/summary")
async def get_hero_summary(
    _: Annotated[None, Depends(require_admin)],
):
    """Return aggregate Hero visibility and page-view metrics."""

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*) FILTER (
                        WHERE event_name = 'hero.viewed'
                    ) AS hero_views,
                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'hero.viewed'
                    ) AS unique_hero_visitors,
                    COUNT(*) FILTER (
                        WHERE event_name = 'page.viewed'
                    ) AS page_views,
                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'page.viewed'
                    ) AS unique_page_visitors
                FROM events
                WHERE feature IN ('hero', 'page')
                  AND event_name IN ('hero.viewed', 'page.viewed')
                """
            )

        return dict(row)

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Hero analytics reporting is temporarily unavailable.",
        ) from exc


@router.get("/events")
async def list_hero_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List Hero visibility and page-view events."""

    supported_names = {"hero.viewed", "page.viewed"}

    if event_name is not None and event_name not in supported_names:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Hero analytics event name.",
        )

    conditions = [
        "feature IN ('hero', 'page')",
        "event_name IN ('hero.viewed', 'page.viewed')",
    ]
    params: list = []

    if event_name:
        params.append(event_name)
        conditions.append(f"event_name = ${len(params)}")

    where_clause = " AND ".join(conditions)

    try:
        async with get_connection() as connection:
            total = await connection.fetchval(
                f"SELECT COUNT(*) FROM events WHERE {where_clause}",
                *params,
            )

            params.extend([limit, offset])

            rows = await connection.fetch(
                f"""
                SELECT
                    id,
                    visitor_id,
                    session_id,
                    event_name,
                    event_type,
                    feature,
                    journey,
                    timestamp,
                    metadata
                FROM events
                WHERE {where_clause}
                ORDER BY timestamp DESC
                LIMIT ${len(params) - 1}
                OFFSET ${len(params)}
                """,
                *params,
            )

        return {
            "items": [
                jsonable_encoder(dict(row))
                for row in rows
            ],
            "limit": limit,
            "offset": offset,
            "total": total,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Hero analytics reporting is temporarily unavailable.",
        ) from exc
