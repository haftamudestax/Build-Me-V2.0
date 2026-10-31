from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/ownership-audit",
    tags=["Ownership Audit Analytics"],
)

SUPPORTED_EVENT_NAMES = {
    "ownership_audit.answer_selected",
    "ownership_audit.validation_failed",
    "ownership_audit.step_completed",
    "ownership_audit.completed",
    "ownership_audit.results_viewed",
    "ownership_audit.restarted",
}


@router.get("/summary")
async def get_ownership_audit_summary(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return Technology Ownership Audit funnel metrics."""

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*)::int AS total_events,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.answer_selected'
                    )::int AS answer_selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.validation_failed'
                    )::int AS validation_failures,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.step_completed'
                    )::int AS completed_steps,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.completed'
                    )::int AS completions,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.results_viewed'
                    )::int AS results_views,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.restarted'
                    )::int AS restarts,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.completed'
                    )::int AS unique_completers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.results_viewed'
                    )::int AS unique_results_viewers

                FROM events
                WHERE journey = 'ownership_audit'
                  AND timestamp >= $1
                  AND timestamp < $2
                """,
                start_time,
                end_time,
            )

        totals = dict(row)

        selections = totals["answer_selections"]
        completions = totals["completions"]
        step_completions = totals["completed_steps"]

        return {
            "feature": "ownership_audit",
            "journey": "ownership_audit",
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "totals": totals,
            "kpis": {
                "completion_to_selection_rate": round(
                    completions / selections * 100, 2
                ) if selections else 0.0,
                "results_view_rate": round(
                    totals["results_views"] / completions * 100, 2
                ) if completions else 0.0,
                "average_completed_steps_per_completion": round(
                    step_completions / completions, 2
                ) if completions else 0.0,
            },
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Ownership Audit analytics reporting is unavailable.",
        ) from exc


@router.get("/events")
async def list_ownership_audit_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List Technology Ownership Audit events."""

    if event_name is not None and event_name not in SUPPORTED_EVENT_NAMES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Ownership Audit event name.",
        )

    conditions = ["journey = $1"]
    params: list = ["ownership_audit"]

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
            detail="Unable to retrieve Ownership Audit analytics events.",
        ) from exc