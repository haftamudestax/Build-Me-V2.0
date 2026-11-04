from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.coffee_with_me import CoffeeWithMeEventIn


EXPECTED_EVENT_TYPES = {
    "coffee_with_me.selected": "click",
    "coffee_with_me.started": "feature_use",
    "coffee_with_me.validation_failed": "feature_use",
    "coffee_with_me.booking_submitted": "feature_use",
    "coffee_with_me.confirmation_viewed": "view",
    "coffee_with_me.submission_failed": "feature_use",
    "coffee_with_me.back_to_paths": "click",
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


def process_coffee_with_me_event(event: CoffeeWithMeEventIn) -> dict:
    """Validate and normalize Coffee With Me analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Coffee With Me event name "
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
        "feature": "coffee_with_me",
        "journey": "coffee_with_me",
        "timestamp": timestamp,
        "metadata": {
            **event.metadata,
            "source_route": source_route,
            "destination_route": destination_route,
        },
    }