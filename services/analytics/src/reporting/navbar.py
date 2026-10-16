
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_connection
from src.tracking.navbar import require_admin


router = APIRouter(prefix="/api/reports/navbar", tags=["Navbar Reporting"])


@router.get("/kpis")
async def get_navbar_kpis(
    _: Annotated[None, Depends(require_admin)],
    days: int = Query(default=30, ge=1, le=365),
):
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=days)

    query = """
        SELECT
            COUNT(*) FILTER (
                WHERE event_name = 'navbar.logo_view'
            )::int AS logo_views,

            COUNT(*) FILTER (
                WHERE event_name = 'navbar.logo_click'
            )::int AS logo_clicks,

            COUNT(*) FILTER (
                WHERE event_name IN (
                    'navbar.logo_click',
                    'navbar.nav_link_click'
                )
                AND metadata->>'destination_route' = '/'
                AND metadata->>'navigation_success' IN ('true', 'false')
            )::int AS home_navigation_attempts,

            COUNT(*) FILTER (
                WHERE event_name IN (
                    'navbar.logo_click',
                    'navbar.nav_link_click'
                )
                AND metadata->>'destination_route' = '/'
                AND metadata->>'navigation_success' = 'true'
            )::int AS home_navigation_successes,

            COUNT(*) FILTER (
                WHERE event_name IN (
                    'navbar.logo_click',
                    'navbar.nav_link_click'
                )
                AND metadata->>'destination_route' = '/'
                AND metadata->>'navigation_success' = 'false'
            )::int AS home_navigation_failures,

            COUNT(*)::int AS total_events

        FROM events
        WHERE feature = 'navbar'
          AND journey = 'home_navigation'
          AND timestamp >= $1
          AND timestamp < $2
    """

    try:
        async with get_connection() as connection:
            row = await connection.fetchrow(query, start_time, end_time)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to generate Navbar KPI report.",
        ) from exc

    logo_views = row["logo_views"]
    logo_clicks = row["logo_clicks"]
    attempts = row["home_navigation_attempts"]
    successes = row["home_navigation_successes"]
    failures = row["home_navigation_failures"]

    return {
        "feature": "navbar",
        "journey": "home_navigation",
        "period": {
            "days": days,
            "start": start_time.isoformat(),
            "end": end_time.isoformat(),
        },
        "kpis": {
            "logo_click_rate": round(
                logo_clicks / logo_views * 100, 2
            ) if logo_views else 0.0,
            "home_navigation_success_rate": round(
                successes / attempts * 100, 2
            ) if attempts else 0.0,
            "home_navigation_failure_rate": round(
                failures / attempts * 100, 2
            ) if attempts else 0.0,
        },
        "totals": {
            "events": row["total_events"],
            "logo_views": logo_views,
            "logo_clicks": logo_clicks,
            "home_navigation_attempts": attempts,
            "home_navigation_successes": successes,
            "home_navigation_failures": failures,
        },
        "generated_at": end_time.isoformat(),
    }
