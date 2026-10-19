
import logging
import os
import secrets
from typing import Annotated
from src.events.hero import HeroEventIn
from src.tracking.hero import persist_hero_event

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.encoders import jsonable_encoder

from database import get_connection, insert_event, validate_visitor_session
from src.events.navbar import NavbarEventIn
from src.processing.navbar import process_navbar_event


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/events", tags=["Navbar Events"])


async def persist_navbar_event(event: NavbarEventIn):
    processed = process_navbar_event(event)

    async with get_connection() as connection:
        valid = await validate_visitor_session(
            connection,
            processed["visitor_id"],
            processed["session_id"],
        )

        if not valid:
            raise HTTPException(
                status_code=422,
                detail="Invalid visitor or session association.",
            )

        return await insert_event(
            connection,
            visitor_id=processed["visitor_id"],
            session_id=processed["session_id"],
            event_name=processed["event_name"],
            event_type=processed["event_type"],
            feature=processed["feature"],
            journey=processed["journey"],
            metadata=processed["metadata"],
        )


async def require_admin(
    x_admin_token: Annotated[str | None, Header()] = None,
) -> None:
    expected_token = os.getenv("ADMIN_API_TOKEN")

    if not expected_token or not x_admin_token:
        raise HTTPException(
            status_code=401,
            detail="Administrator authentication is required.",
        )

    if not secrets.compare_digest(x_admin_token, expected_token):
        raise HTTPException(
            status_code=403,
            detail="Administrator authentication failed.",
        )



@router.post("", status_code=201)
async def create_navbar_event(event: NavbarEventIn | HeroEventIn):
    """Persist Navbar, Hero visibility, or page-view analytics."""

    try:
        if isinstance(event, HeroEventIn):
            record = await persist_hero_event(event)
        else:
            record = await persist_navbar_event(event)

        return jsonable_encoder(dict(record))

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to persist analytics event")
        raise HTTPException(
            status_code=503,
            detail="Analytics is temporarily unavailable.",
        ) from exc


@router.get("")
async def list_navbar_events(
    _: Annotated[None, Depends(require_admin)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    event_name: str | None = Query(default=None, max_length=100),
):
    conditions = ["feature = $1"]
    params: list = ["navbar"]

    if event_name:
        supported_names = {item.value for item in __import__(
            "src.events.navbar", fromlist=["NavbarEventName"]
        ).NavbarEventName}

        if event_name not in supported_names:
            raise HTTPException(
                status_code=422,
                detail="Unsupported Navbar event name.",
            )

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
            "items": [jsonable_encoder(dict(row)) for row in rows],
            "limit": limit,
            "offset": offset,
            "total": total,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to retrieve Navbar events")
        raise HTTPException(
            status_code=503,
            detail="Navbar analytics is temporarily unavailable.",
        ) from exc
