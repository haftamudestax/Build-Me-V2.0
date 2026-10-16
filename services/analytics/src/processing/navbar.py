
from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.navbar import (
    NavbarEventIn,
    NavbarEventName,
    NavbarEventType,
)


EXPECTED_EVENT_TYPES = {
    NavbarEventName.LOGO_CLICK: NavbarEventType.CLICK,
    NavbarEventName.NAV_LINK_CLICK: NavbarEventType.CLICK,
    NavbarEventName.LOGO_VIEW: NavbarEventType.VIEW,
}

ALLOWED_DEVICE_TYPES = {"desktop", "tablet", "mobile"}
ALLOWED_VIEWPORT_TYPES = {"desktop", "tablet", "mobile"}


def process_navbar_event(event: NavbarEventIn) -> dict:
    """Validate and normalize a Navbar event for persistence."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Navbar event name and event type combination.",
        )

    source_route = event.source_route.strip()
    destination_route = event.destination_route.strip()

    if not source_route or not destination_route:
        raise HTTPException(
            status_code=422,
            detail="Source and destination routes cannot be empty.",
        )

    if not source_route.startswith("/") or not destination_route.startswith("/"):
        raise HTTPException(
            status_code=422,
            detail="Source and destination routes must be application paths.",
        )

    if event.device_type is not None:
        device_type = event.device_type.strip().lower()
        if device_type not in ALLOWED_DEVICE_TYPES:
            raise HTTPException(
                status_code=422,
                detail="Invalid device_type.",
            )
    else:
        device_type = None

    if event.viewport_type is not None:
        viewport_type = event.viewport_type.strip().lower()
        if viewport_type not in ALLOWED_VIEWPORT_TYPES:
            raise HTTPException(
                status_code=422,
                detail="Invalid viewport_type.",
            )
    else:
        viewport_type = None

    occurred_at = event.occurred_at
    if occurred_at is not None and occurred_at.utcoffset() is None:
        raise HTTPException(
            status_code=422,
            detail="occurred_at must include a timezone.",
        )

    # Do not treat a click as a successful navigation unless the
    # client explicitly reports the outcome.
    if (
        event.event_name == NavbarEventName.LOGO_VIEW
        and event.navigation_success is not None
    ):
        raise HTTPException(
            status_code=422,
            detail="LOGO_VIEW events cannot have navigation_success.",
        )

    metadata = {
        "source_route": source_route,
        "destination_route": destination_route,
        "navigation_success": event.navigation_success,
        "device_type": device_type,
        "viewport_type": viewport_type,
    }

    if occurred_at is not None:
        metadata["occurred_at"] = occurred_at.astimezone(
            timezone.utc
        ).isoformat()

    return {
        "visitor_id": event.visitor_id,
        "session_id": event.session_id,
        "event_name": event.event_name.value,
        "event_type": event.event_type.value,
        "feature": "navbar",
        "journey": "home_navigation",
        "metadata": metadata,
    }
