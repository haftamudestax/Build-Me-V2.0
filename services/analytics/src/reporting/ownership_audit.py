from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.processing.ownership_audit import EXPECTED_EVENT_TYPES
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/ownership-audit",
    tags=["Ownership Audit Analytics"],
)

# One source of truth: every event the service accepts can be filtered on.
SUPPORTED_EVENT_NAMES = set(EXPECTED_EVENT_TYPES)

# Funnel stages in journey order, with the totals key holding the number of
# distinct visitors who reached each stage.
FUNNEL_STAGES = [
    ("opened", "unique_openers"),
    ("selected_audit", "unique_selectors"),
    ("registered", "unique_registrants"),
    ("completed", "unique_completers"),
    ("viewed_results", "unique_results_viewers"),
    ("viewed_next_steps", "unique_next_steps_viewers"),
    ("chose_a_path", "unique_path_selectors"),
]


def _percentage(numerator: int, denominator: int | None) -> float:
    """Percentage rounded to 2 places, capped at 100 and 0 when undefined."""

    if not denominator:
        return 0.0

    return min(100.0, round(numerator / denominator * 100, 2))


def _build_funnel(totals: dict) -> list[dict]:
    """Visitor funnel from the Get Quick Wins button to a chosen path.

    Each stage is counted independently, so a visitor who arrived through the
    older Work With Me card can complete without an 'opened' event. Rates are
    capped at 100 for that reason.
    """

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

                    COUNT(*) FILTER (
                        WHERE event_name = 'get_quick_wins.opened'
                    )::int AS quick_wins_opens,

                    COUNT(*) FILTER (
                        WHERE event_name = 'get_quick_wins.closed'
                    )::int AS quick_wins_closes,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.selected'
                    )::int AS audit_selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.started'
                    )::int AS starts,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.registration_completed'
                    )::int AS registrations,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.next_steps_viewed'
                    )::int AS next_steps_views,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.path_selected'
                    )::int AS path_selections,

                    COUNT(*) FILTER (
                        WHERE event_name = 'ownership_audit.back_to_paths'
                    )::int AS back_to_paths,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.completed'
                    )::int AS unique_completers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.results_viewed'
                    )::int AS unique_results_viewers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'get_quick_wins.opened'
                    )::int AS unique_openers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.selected'
                    )::int AS unique_selectors,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.registration_completed'
                    )::int AS unique_registrants,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.next_steps_viewed'
                    )::int AS unique_next_steps_viewers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'ownership_audit.path_selected'
                    )::int AS unique_path_selectors

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
            "funnel": _build_funnel(totals),
            "kpis": {
                # Kept as originally defined. It divides completions by
                # individual answer clicks, so it stays low by design; use
                # completion_rate for completions per audit selection.
                "completion_to_selection_rate": round(
                    completions / selections * 100, 2
                ) if selections else 0.0,
                "results_view_rate": round(
                    totals["results_views"] / completions * 100, 2
                ) if completions else 0.0,
                "average_completed_steps_per_completion": round(
                    step_completions / completions, 2
                ) if completions else 0.0,
                "completion_rate": _percentage(
                    completions,
                    totals.get("audit_selections", 0),
                ),
                "registration_rate": _percentage(
                    totals.get("registrations", 0),
                    totals.get("starts", 0),
                ),
                "path_selection_rate": _percentage(
                    totals.get("path_selections", 0),
                    totals.get("next_steps_views", 0),
                ),
            },
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Ownership Audit analytics reporting is unavailable.",
        ) from exc


@router.get("/breakdown")
async def get_ownership_audit_breakdown(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return result categories, chosen paths and where visitors left.

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
                    event_name,
                    metadata->>'resultCategory' AS result_category,
                    metadata->>'path' AS path,
                    metadata->>'lastStep' AS last_step,
                    COUNT(*)::int AS events
                FROM events
                WHERE journey = 'ownership_audit'
                  AND event_name IN (
                      'ownership_audit.completed',
                      'ownership_audit.path_selected',
                      'get_quick_wins.closed'
                  )
                  AND timestamp >= $1
                  AND timestamp < $2
                GROUP BY 1, 2, 3, 4
                """,
                start_time,
                end_time,
            )

        result_categories: dict[str, int] = {}
        paths: dict[str, int] = {}
        closed_at_step: dict[str, int] = {}

        for row in rows:
            count = row["events"]

            if row["event_name"] == "ownership_audit.completed":
                key, target = row["result_category"], result_categories
            elif row["event_name"] == "ownership_audit.path_selected":
                key, target = row["path"], paths
            else:
                key, target = row["last_step"], closed_at_step

            if key:
                target[key] = target.get(key, 0) + count

        return {
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "result_categories": result_categories,
            "paths_chosen": paths,
            "closed_at_step": closed_at_step,
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