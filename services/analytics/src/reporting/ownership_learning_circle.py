from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.processing.ownership_learning_circle import EXPECTED_EVENT_TYPES
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/ownership-learning-circle",
    tags=["Ownership Learning Circle Analytics"],
)

SUPPORTED_EVENT_NAMES = set(EXPECTED_EVENT_TYPES)


@router.get("/summary")
async def get_ownership_learning_circle_summary(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return Technology Ownership Learning Circle funnel metrics."""

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*)::int AS total_events,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_learning_circle.selected'
                    )::int AS selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_learning_circle.started'
                    )::int AS starts,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_learning_circle.explanation_viewed'
                    )::int AS explanation_views,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_learning_circle.join_clicked'
                    )::int AS join_clicks,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_learning_circle.telegram_opened'
                    )::int AS telegram_opens,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_learning_circle.back_to_paths'
                    )::int AS back_to_paths,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_learning_circle.selected'
                    )::int AS unique_selectors,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_learning_circle.explanation_viewed'
                    )::int AS unique_explanation_viewers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_learning_circle.join_clicked'
                    )::int AS unique_join_clickers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_learning_circle.telegram_opened'
                    )::int AS unique_telegram_openers

                FROM events
                WHERE journey = 'ownership_learning_circle'
                  AND timestamp >= $1
                  AND timestamp < $2
                """,
                start_time,
                end_time,
            )

        totals = dict(row)

        def percentage(numerator: int, denominator: int) -> float:
            if not denominator:
                return 0.0

            return min(
                100.0,
                round(numerator / denominator * 100, 2),
            )

        return {
            "feature": "ownership_learning_circle",
            "journey": "ownership_learning_circle",
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "totals": totals,
            "funnel": [
                {
                    "stage": "selected",
                    "visitors": totals["unique_selectors"],
                },
                {
                    "stage": "viewed_explanation",
                    "visitors": totals["unique_explanation_viewers"],
                    "from_previous_pct": percentage(
                        totals["unique_explanation_viewers"],
                        totals["unique_selectors"],
                    ),
                },
                {
                    "stage": "clicked_join",
                    "visitors": totals["unique_join_clickers"],
                    "from_previous_pct": percentage(
                        totals["unique_join_clickers"],
                        totals["unique_explanation_viewers"],
                    ),
                },
                {
                    "stage": "opened_telegram",
                    "visitors": totals["unique_telegram_openers"],
                    "from_previous_pct": percentage(
                        totals["unique_telegram_openers"],
                        totals["unique_join_clickers"],
                    ),
                },
            ],
            "kpis": {
                "join_click_rate": percentage(
                    totals["unique_join_clickers"],
                    totals["unique_selectors"],
                ),
                "telegram_open_rate": percentage(
                    totals["unique_telegram_openers"],
                    totals["unique_join_clickers"],
                ),
            },
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Ownership Learning Circle analytics reporting is unavailable."
            ),
        ) from exc


@router.get("/events")
async def list_ownership_learning_circle_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List paginated Ownership Learning Circle events."""

    if event_name is not None and event_name not in SUPPORTED_EVENT_NAMES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Ownership Learning Circle event name.",
        )

    conditions = ["journey = $1"]
    params: list = ["ownership_learning_circle"]

    if event_name:
        params.append(event_name)
        conditions.append(f"event_name = ${len(params)}")

    where_clause = " AND ".join(conditions)

    try:
        async with get_connection() as connection:
            total = await connection.fetchval(
                f"""
                SELECT COUNT(*)
                FROM events
                WHERE {where_clause}
                """,
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
            detail=(
                "Unable to retrieve Ownership Learning Circle analytics events."
            ),
        ) from exc