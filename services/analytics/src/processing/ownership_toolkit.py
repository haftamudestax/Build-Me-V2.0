import re
from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.ownership_toolkit import OwnershipToolkitEventIn


# Every accepted event name and the one event type it may be sent with.
# The frontend's eventTypeByName in main.tsx must use the same types.
EXPECTED_EVENT_TYPES = {
    "ownership_toolkit.selected": "click",
    "ownership_toolkit.started": "feature_use",
    "ownership_toolkit.step_completed": "feature_use",
    "ownership_toolkit.validation_failed": "feature_use",
    "ownership_toolkit.registration_completed": "feature_use",
    "ownership_toolkit.content_viewed": "view",
    "ownership_toolkit.tool_opened": "click",
    "ownership_toolkit.pdf_downloaded": "click",
    "ownership_toolkit.back_to_paths": "click",
}


# Names, emails and organisations are never accepted. "toolId" is a slug such
# as "domain" or "backups", and "part" is the toolkit part (1 to 3).
ALLOWED_METADATA_FIELDS = {
    "step",
    "completedStep",
    "nextStep",
    "toolId",
    "part",
    "source_route",
    "destination_route",
}

POSITIVE_INTEGER_FIELDS = (
    "step",
    "completedStep",
    "nextStep",
    "part",
)

TOOL_ID_PATTERN = re.compile(r"^[a-z][a-z0-9_]{0,39}$")


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


def _sanitize_metadata(metadata: dict) -> dict:
    """Keep only approved, non-personal toolkit metadata."""

    sanitized = {
        key: value
        for key, value in metadata.items()
        if key in ALLOWED_METADATA_FIELDS
    }

    tool_id = sanitized.get("toolId")

    if tool_id is not None and (
        not isinstance(tool_id, str) or not TOOL_ID_PATTERN.match(tool_id)
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid ownership toolkit metadata field: toolId.",
        )

    for field in POSITIVE_INTEGER_FIELDS:
        value = sanitized.get(field)

        if value is not None and (
            not isinstance(value, int) or isinstance(value, bool) or value < 1
        ):
            raise HTTPException(
                status_code=422,
                detail=f"Invalid ownership toolkit metadata field: {field}.",
            )

    return sanitized


def process_ownership_toolkit_event(event: OwnershipToolkitEventIn) -> dict:
    """Validate and normalize Ownership Toolkit analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Ownership Toolkit event name "
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

    metadata = _sanitize_metadata(event.metadata)
    metadata["source_route"] = source_route
    metadata["destination_route"] = destination_route

    return {
        "visitor_id": event.visitor_id,
        "session_id": event.session_id,
        "event_name": event.event_name,
        "event_type": event.event_type,
        "feature": "ownership_toolkit",
        "journey": "ownership_toolkit",
        "timestamp": timestamp,
        "metadata": metadata,
    }
