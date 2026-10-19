
from fastapi import HTTPException

from database import get_connection, insert_event, validate_visitor_session
from src.events.hero import HeroEventIn
from src.processing.hero import process_hero_event


async def persist_hero_event(event: HeroEventIn):
    """Validate and persist a Hero or page-view event."""

    processed = process_hero_event(event)

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
            timestamp=processed["timestamp"],
            metadata=processed["metadata"],
        )
