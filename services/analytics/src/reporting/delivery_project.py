
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/delivery-project",
    tags=["Delivery Project Analytics"],
)

SUPPORTED_EVENT_NAMES = {
    "work_with_me.cta_clicked",
    "delivery_project.selected",
    "delivery_project.started",
    "delivery_project.validation_failed",
    "delivery_project.booking_submitted",
    "delivery_project.confirmation_viewed",
    "delivery_project.submission_failed",
}


@router.get("/summary")
async def get_delivery_project_summary(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return Delivery Project funnel metrics for a time period."""

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*)::int AS total_events,

                    COUNT(*) FILTER (
                        WHERE event_name = 'work_with_me.cta_clicked'
                    )::int AS cta_clicks,

                    COUNT(*) FILTER (
                        WHERE event_name = 'delivery_project.selected'
                    )::int AS selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'delivery_project.started'
                    )::int AS starts,

                    COUNT(*) FILTER (
                        WHERE event_name = 'delivery_project.validation_failed'
                    )::int AS validation_failures,

                    COUNT(*) FILTER (
                        WHERE event_name = 'delivery_project.booking_submitted'
                    )::int AS successful_submissions,

                    COUNT(*) FILTER (
                        WHERE event_name = 'delivery_project.confirmation_viewed'
                    )::int AS confirmations_viewed,

                    COUNT(*) FILTER (
                        WHERE event_name = 'delivery_project.submission_failed'
                    )::int AS submission_failures,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'delivery_project.started'
                    )::int AS unique_starters,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'delivery_project.booking_submitted'
                    )::int AS unique_submitters

                FROM events
                WHERE journey = 'delivery_project'
                  AND timestamp >= $1
                  AND timestamp < $2
                """,
                start_time,
                end_time,
            )

        totals = dict(row)
        starts = totals["starts"]
        submissions = totals["successful_submissions"]
        cta_clicks = totals["cta_clicks"]

        return {
            "feature": "delivery_project",
            "journey": "delivery_project",
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "totals": totals,
            "kpis": {
                "cta_to_start_rate": round(
                    starts / cta_clicks * 100, 2
                ) if cta_clicks else 0.0,
                "start_to_submission_rate": round(
                    submissions / starts * 100, 2
                ) if starts else 0.0,
                "submission_to_confirmation_rate": round(
                    totals["confirmations_viewed"] / submissions * 100, 2
                ) if submissions else 0.0,
            },
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Delivery Project analytics reporting is unavailable.",
        ) from exc


@router.get("/events")
async def list_delivery_project_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List Delivery Project journey events."""

    if event_name is not None and event_name not in SUPPORTED_EVENT_NAMES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Delivery Project event name.",
        )

    conditions = ["journey = $1"]
    params: list = ["delivery_project"]

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
            detail="Unable to retrieve Delivery Project analytics events.",
        ) from exc
