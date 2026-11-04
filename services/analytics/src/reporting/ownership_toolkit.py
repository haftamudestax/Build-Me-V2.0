from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.processing.ownership_toolkit import EXPECTED_EVENT_TYPES
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/ownership-toolkit",
    tags=["Ownership Toolkit Analytics"],
)

# One source of truth: every event the service accepts can be filtered on.
SUPPORTED_EVENT_NAMES = set(EXPECTED_EVENT_TYPES)

# Funnel stages in journey order, with the totals key holding the number of
# distinct visitors who reached each stage.
FUNNEL_STAGES = [
    ("selected_toolkit", "unique_selectors"),
    ("registered", "unique_registrants"),
    ("viewed_content", "unique_viewers"),
    ("opened_a_tool", "unique_tool_openers"),
    ("downloaded_pdf", "unique_downloaders"),
]


def _percentage(numerator: int, denominator: int | None) -> float:
    """Percentage rounded to 2 places, capped at 100 and 0 when undefined."""

    if not denominator:
        return 0.0

    return min(100.0, round(numerator / denominator * 100, 2))


def _build_funnel(totals: dict) -> list[dict]:
    """Visitor funnel from choosing the toolkit to downloading the PDF."""

    funnel: list[dict] = []
    first: int | None = None
    previous: int | None = None

    for stage, key in FUNNEL_STAGES:
        visitors = totals.get(key, 0)

        if first is None:
            first = visitors

        funnel.append(
            {
                "stage": stage,
                "visitors": visitors,
                "from_previous_pct": (
                    None if previous is None else _percentage(visitors, previous)
                ),
                "from_first_pct": _percentage(visitors, first),
            }
        )

        previous = visitors

    return funnel


@router.get("/summary")
async def get_ownership_toolkit_summary(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return Technology Ownership Toolkit funnel metrics."""

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*)::int AS total_events,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.selected'
                    )::int AS selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.started'
                    )::int AS starts,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.validation_failed'
                    )::int AS validation_failures,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.registration_completed'
                    )::int AS registrations,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.content_viewed'
                    )::int AS content_views,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.tool_opened'
                    )::int AS tool_opens,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.pdf_downloaded'
                    )::int AS pdf_downloads,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_toolkit.back_to_paths'
                    )::int AS back_to_paths,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_toolkit.selected'
                    )::int AS unique_selectors,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_toolkit.registration_completed'
                    )::int AS unique_registrants,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_toolkit.content_viewed'
                    )::int AS unique_viewers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_toolkit.tool_opened'
                    )::int AS unique_tool_openers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_toolkit.pdf_downloaded'
                    )::int AS unique_downloaders

                FROM events
                WHERE journey = 'ownership_toolkit'
                  AND timestamp >= $1
                  AND timestamp < $2
                """,
                start_time,
                end_time,
            )

        totals = dict(row)

        content_views = totals.get("content_views", 0)

        return {
            "feature": "ownership_toolkit",
            "journey": "ownership_toolkit",
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "totals": totals,
            "funnel": _build_funnel(totals),
            "kpis": {
                "registration_rate": _percentage(
                    totals.get("registrations", 0),
                    totals.get("starts", 0),
                ),
                "download_rate": _percentage(
                    totals.get("pdf_downloads", 0),
                    content_views,
                ),
                "average_tools_opened_per_view": round(
                    totals.get("tool_opens", 0) / content_views, 2
                ) if content_views else 0.0,
            },
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Ownership Toolkit analytics reporting is unavailable.",
        ) from exc


@router.get("/breakdown")
async def get_ownership_toolkit_breakdown(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return which tools visitors open, by tool and by part.

    Reads values from the event metadata, so it needs the metadata column to be
    json or jsonb.
    """

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            rows = await connection.fetch(
                """
                SELECT
                    metadata->>'toolId' AS tool_id,
                    metadata->>'part' AS part,
                    COUNT(*)::int AS opens
                FROM events
                WHERE journey = 'ownership_toolkit'
                  AND event_name = 'ownership_toolkit.tool_opened'
                  AND timestamp >= $1
                  AND timestamp < $2
                GROUP BY 1, 2
                """,
                start_time,
                end_time,
            )

        tools_opened: dict[str, int] = {}
        parts_opened: dict[str, int] = {}

        for row in rows:
            count = row["opens"]

            if row["tool_id"]:
                tools_opened[row["tool_id"]] = (
                    tools_opened.get(row["tool_id"], 0) + count
                )

            if row["part"]:
                parts_opened[row["part"]] = (
                    parts_opened.get(row["part"], 0) + count
                )

        return {
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "tools_opened": tools_opened,
            "parts_opened": parts_opened,
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Ownership Toolkit analytics reporting is unavailable.",
        ) from exc


@router.get("/events")
async def list_ownership_toolkit_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List Technology Ownership Toolkit events."""

    if event_name is not None and event_name not in SUPPORTED_EVENT_NAMES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Ownership Toolkit event name.",
        )

    conditions = ["journey = $1"]
    params: list = ["ownership_toolkit"]

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
                LIMIT ${len(params) + 1}
                OFFSET ${len(params) + 2}
                """,
                *params,
                limit,
                offset,
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

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve Ownership Toolkit analytics events.",
        ) from exc
