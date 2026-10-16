
import logging

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder

from database import get_connection, create_visitor, create_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/visitors", tags=["Visitors"])


@router.post("", status_code=201)
async def register_visitor():
    """Register an anonymous visitor and create an associated session."""
    try:
        async with get_connection() as connection:
            async with connection.transaction():
                visitor_id = await create_visitor(connection)
                session_id = await create_session(
                    connection,
                    visitor_id,
                )

        return jsonable_encoder({
            "visitor_id": visitor_id,
            "session_id": session_id,
        })

    except Exception as exc:
        logger.exception("Failed to register visitor")
        raise HTTPException(
            status_code=503,
            detail="Visitor registration is temporarily unavailable.",
        ) from exc
