from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.mentor_me import MentorMeEventIn


EXPECTED_EVENT_TYPES = {
    "mentor_me.selected": "click",
    "mentor_me.started": "feature_use",
    "mentor_me.validation_failed": "feature_use",
    "mentor_me.booking_submitted": "feature_use",
    "mentor_me.confirmation_viewed": "view",
    "mentor_me.submission_failed": "feature_use",
}


def _validate_route(route: str | None, field_name: str) -> str | None:
    if route is None:
        return None

    normalized = route.strip()

    if not normalized or not normalized.startswith("/"):
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} must be a valid application path.",
        )

    if normalized.startswith("//"):
        raise HTTPException(
            status_code=422,
            detail=f"{field_name} must be a local application path.",
        )

    return normalized


def process_mentor_me_event(event: MentorMeEventIn) -> dict:
    """Validate and normalize Mentor Me analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Mentor Me event name "
                "and event type combination."
            ),
        )

    source_route = _validate_route(event.source_route, "sourceRoute")
    destination_route = _validate_route(
        event.destination_route,
        "destinationRoute",
    )

    timestamp = event.timestamp or datetime.now(timezone.utc)

    if timestamp.utcoffset() is None:
        raise HTTPException(
            status_code=422,
            detail="timestamp must include a timezone.",
        )

    timestamp = timestamp.astimezone(timezone.utc)

    return {
        "visitor_id": event.visitor_id,
        "session_id": event.session_id,
        "event_name": event.event_name,
        "event_type": event.event_type,
        "feature": "mentor_me",
        "journey": "mentor_me",
        "timestamp": timestamp,
        "metadata": {
            **event.metadata,
            "source_route": source_route,
            "destination_route": destination_route,
        },
    }