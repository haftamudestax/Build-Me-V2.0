from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.ownership_learning_circle import (
    OwnershipLearningCircleEventIn,
)


EXPECTED_EVENT_TYPES = {
    "ownership_learning_circle.selected": "click",
    "ownership_learning_circle.started": "feature_use",
    "ownership_learning_circle.explanation_viewed": "view",
    "ownership_learning_circle.join_clicked": "click",
    "ownership_learning_circle.telegram_opened": "click",
    "ownership_learning_circle.back_to_paths": "click",
}


ALLOWED_METADATA_FIELDS = {
    "step",
    "source_route",
    "destination_route",
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


def _sanitize_metadata(metadata: dict) -> dict:
    """Keep only approved, non-personal Learning Circle metadata."""

    sanitized = {
        key: value
        for key, value in metadata.items()
        if key in ALLOWED_METADATA_FIELDS
    }

    step = sanitized.get("step")

    if step is not None and (
        not isinstance(step, str)
        or step not in {"why", "join"}
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid Learning Circle metadata field: step.",
        )

    return sanitized


def process_ownership_learning_circle_event(
    event: OwnershipLearningCircleEventIn,
) -> dict:
    """Validate and normalize Learning Circle analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Ownership Learning Circle event name "
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
        "feature": "ownership_learning_circle",
        "journey": "ownership_learning_circle",
        "timestamp": timestamp,
        "metadata": metadata,
    }