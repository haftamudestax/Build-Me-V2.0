from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection
from src.processing.talk_to_us import EXPECTED_EVENT_TYPES
from src.reporting.talk_to_us_metrics import (
    build_channels,
    build_funnel,
    build_kpis,
)
from src.tracking.navbar import require_admin


router = APIRouter(
    prefix="/api/analytics/talk-to-us",
    tags=["Talk To Us Analytics"],
)

# One source of truth: every event the service accepts can be filtered on.
SUPPORTED_EVENT_NAMES = set(EXPECTED_EVENT_TYPES)


@router.get("/summary")
async def get_talk_to_us_summary(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return Talk To Us funnel, channel and delivery metrics."""

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(
                """
                SELECT
                    COUNT(*)::int AS total_events,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.viewed'
                    )::int AS views,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.whatsapp_clicked'
                    )::int AS whatsapp_clicks,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.call_clicked'
                    )::int AS call_clicks,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.validation_failed'
                    )::int AS validation_failures,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.message_sent'
                    )::int AS messages_sent,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.message_failed'
                    )::int AS message_failures,

                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.message_blocked'
                    )::int AS messages_blocked,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'talk_to_us.viewed'
                    )::int AS unique_viewers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'talk_to_us.whatsapp_clicked'
                    )::int AS unique_whatsapp_clickers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'talk_to_us.call_clicked'
                    )::int AS unique_call_clickers,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name = 'talk_to_us.message_sent'
                    )::int AS unique_message_senders,

                    COUNT(DISTINCT visitor_id) FILTER (
                        WHERE event_name IN (
                            'talk_to_us.whatsapp_clicked',
                            'talk_to_us.call_clicked',
                            'talk_to_us.message_sent'
                        )
                    )::int AS unique_contacters

                FROM events
                WHERE journey = 'talk_to_us'
                  AND timestamp >= $1
                  AND timestamp < $2
                """,
                start_time,
                end_time,
            )

        totals = dict(row)

        return {
            "feature": "talk_to_us",
            "journey": "talk_to_us",
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "totals": totals,
            "funnel": build_funnel(totals),
            "channels": build_channels(totals),
            "kpis": build_kpis(totals),
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Talk To Us analytics reporting is unavailable.",
        ) from exc


@router.get("/breakdown")
async def get_talk_to_us_breakdown(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    """Return why sending fails, which form fields trip visitors up, and a
    daily trend.

    Reads values from the event metadata, so it needs the metadata column to be
    json or jsonb.
    """

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    try:
        async with get_connection() as connection:
            reason_rows = await connection.fetch(
                """
                SELECT
                    COALESCE(metadata->>'reason', 'unknown') AS reason,
                    COUNT(*)::int AS events
                FROM events
                WHERE journey = 'talk_to_us'
                  AND event_name = 'talk_to_us.message_failed'
                  AND timestamp >= $1
                  AND timestamp < $2
                GROUP BY 1
                """,
                start_time,
                end_time,
            )

            field_rows = await connection.fetch(
                """
                SELECT
                    field,
                    COUNT(*)::int AS events
                FROM events,
                     jsonb_array_elements_text(
                         CASE
                             WHEN jsonb_typeof(metadata::jsonb->'fields') = 'array'
                             THEN metadata::jsonb->'fields'
                             ELSE '[]'::jsonb
                         END
                     ) AS field
                WHERE journey = 'talk_to_us'
                  AND event_name = 'talk_to_us.validation_failed'
                  AND timestamp >= $1
                  AND timestamp < $2
                GROUP BY 1
                """,
                start_time,
                end_time,
            )

            daily_rows = await connection.fetch(
                """
                SELECT
                    (timestamp AT TIME ZONE 'UTC')::date AS day,
                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.viewed'
                    )::int AS views,
                    COUNT(*) FILTER (
                        WHERE event_name IN (
                            'talk_to_us.whatsapp_clicked',
                            'talk_to_us.call_clicked',
                            'talk_to_us.message_sent'
                        )
                    )::int AS contacts,
                    COUNT(*) FILTER (
                        WHERE event_name = 'talk_to_us.message_sent'
                    )::int AS messages_sent
                FROM events
                WHERE journey = 'talk_to_us'
                  AND timestamp >= $1
                  AND timestamp < $2
                GROUP BY 1
                ORDER BY 1
                """,
                start_time,
                end_time,
            )

        return {
            "period": {
                "days": days,
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
            },
            "failure_reasons": {
                row["reason"]: row["events"] for row in reason_rows
            },
            "invalid_fields": {
                row["field"]: row["events"] for row in field_rows
            },
            "daily": [
                {
                    "day": row["day"].isoformat(),
                    "views": row["views"],
                    "contacts": row["contacts"],
                    "messages_sent": row["messages_sent"],
                }
                for row in daily_rows
            ],
            "generated_at": end_time.isoformat(),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Talk To Us analytics reporting is unavailable.",
        ) from exc


@router.get("/events")
async def list_talk_to_us_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    """List Talk To Us events."""

    if event_name is not None and event_name not in SUPPORTED_EVENT_NAMES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Talk To Us event name.",
        )

    conditions = ["journey = $1"]
    params: list = ["talk_to_us"]

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
            detail="Unable to retrieve Talk To Us analytics events.",
        ) from exc