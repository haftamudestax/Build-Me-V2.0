
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/mentor-me",
    tags=["Mentor Me Analytics"],
)

SUPPORTED_EVENT_NAMES = {
    "mentor_me.selected",
    "mentor_me.started",
    "mentor_me.validation_failed",
    "mentor_me.booking_submitted",
    "mentor_me.confirmation_viewed",
    "mentor_me.confirmed",
    "mentor_me.submission_failed",
}


@router.get("/summary")
async def get_mentor_me_summary(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return Mentor Me funnel metrics for a time period."""

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*)::int AS total_events,

                    COUNT(*) FILTER (
                        WHERE event_name = 'mentor_me.selected'
                    )::int AS selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'mentor_me.started'
                    )::int AS starts,

                    COUNT(*) FILTER (
                        WHERE event_name = 'mentor_me.validation_failed'
                    )::int AS validation_failures,

                    COUNT(*) FILTER (
                        WHERE event_name = 'mentor_me.booking_submitted'
                    )::int AS successful_submissions,

                    COUNT(*) FILTER (
                        WHERE event_name IN (
                            'mentor_me.confirmation_viewed',
                            'mentor_me.confirmed'
                        )
                    )::int AS confirmations,

                    COUNT(*) FILTER (
                        WHERE event_name = 'mentor_me.submission_failed'
                    )::int AS submission_failures,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'mentor_me.started'
                    )::int AS unique_starters,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'mentor_me.booking_submitted'
                    )::int AS unique_submitters

                FROM events
                WHERE journey = 'mentor_me'
                  AND timestamp >= $1
                  AND timestamp < $2
                """,
                start_time,
                end_time,
            )

        totals = dict(row)
        selections = totals["selections"]
        starts = totals["starts"]
        submissions = totals["successful_submissions"]

        return {
            "feature": "mentor_me",
            "journey": "mentor_me",
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "totals": totals,
            "kpis": {
                "selection_to_start_rate": round(
                    starts / selections * 100, 2
                ) if selections else 0.0,
                "start_to_submission_rate": round(
                    submissions / starts * 100, 2
                ) if starts else 0.0,
                "submission_to_confirmation_rate": round(
                    totals["confirmations"] / submissions * 100, 2
                ) if submissions else 0.0,
            },
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Mentor Me analytics reporting is unavailable.",
        ) from exc


@router.get("/events")
async def list_mentor_me_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List Mentor Me journey events."""

    if event_name is not None and event_name not in SUPPORTED_EVENT_NAMES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Mentor Me event name.",
        )

    conditions = ["journey = $1"]
    params: list = ["mentor_me"]

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
            detail="Unable to retrieve Mentor Me analytics events.",
        ) from exc
