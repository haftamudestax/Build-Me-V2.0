
from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.delivery_project import DeliveryProjectEventIn


EXPECTED_EVENT_TYPES = {
    "work_with_me.cta_clicked": "click",
    "work_with_me.opened": "click",
    "work_with_me.closed": "click",
    "work_with_me.reference_copied": "click",
    "delivery_project.selected": "click",
    "delivery_project.started": "feature_use",
    "delivery_project.validation_failed": "feature_use",
    "delivery_project.booking_submitted": "feature_use",
    "delivery_project.confirmation_viewed": "view",
    "delivery_project.submission_failed": "feature_use",
    "delivery_project.back_to_paths": "click",
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


def process_delivery_project_event(event: DeliveryProjectEventIn) -> dict:
    """Validate and normalize Delivery Project analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Delivery Project event name "
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

    is_cta_event = event.event_name == "work_with_me.cta_clicked"

    return {
        "visitor_id": event.visitor_id,
        "session_id": event.session_id,
        "event_name": event.event_name,
        "event_type": event.event_type,
        "feature": "work_with_me" if is_cta_event else "delivery_project",
        "journey": "delivery_project",
        "timestamp": timestamp,
        "metadata": {
            **event.metadata,
            "source_route": source_route,
            "destination_route": destination_route,
        },
    }
