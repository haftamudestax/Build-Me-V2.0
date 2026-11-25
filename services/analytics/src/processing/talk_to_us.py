from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.talk_to_us import TalkToUsEventIn


# Every accepted event name and the one event type it may be sent with.
# The frontend's eventTypeByName in main.tsx must use the same types.
EXPECTED_EVENT_TYPES = {
    "talk_to_us.viewed": "view",
    "talk_to_us.whatsapp_clicked": "click",
    "talk_to_us.call_clicked": "click",
    "talk_to_us.validation_failed": "feature_use",
    "talk_to_us.message_sent": "feature_use",
    "talk_to_us.message_failed": "feature_use",
    "talk_to_us.message_blocked": "feature_use",
}

# Only these metadata keys are kept. The website never sends names, emails or
# message text, and anything else is dropped here even if it were sent.
ALLOWED_METADATA_FIELDS = {
    "fields",
    "messageLength",
    "reason",
    "source_route",
    "destination_route",
}

# Form fields a validation_failed event may name.
FORM_FIELDS = ("name", "email", "message")

# Why a message_failed event may say sending failed.
FAILURE_REASONS = {
    "not_configured",
    "no_visitor",
    "network",
    "timeout",
    "rejected",
    "unknown",
}

MAX_MESSAGE_LENGTH = 5000


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
    """Keep only approved, non-personal Talk To Us metadata."""

    sanitized = {
        key: value
        for key, value in metadata.items()
        if key in ALLOWED_METADATA_FIELDS
    }

    fields = sanitized.get("fields")

    if fields is not None:
        if not isinstance(fields, list) or any(
            field not in FORM_FIELDS for field in fields
        ):
            raise HTTPException(
                status_code=422,
                detail="Unsupported Talk To Us form field.",
            )

        # Keep each field once, in the order it was reported.
        sanitized["fields"] = list(dict.fromkeys(fields))

    reason = sanitized.get("reason")

    if reason is not None and reason not in FAILURE_REASONS:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Talk To Us failure reason.",
        )

    message_length = sanitized.get("messageLength")

    if message_length is not None and (
        not isinstance(message_length, int)
        or isinstance(message_length, bool)
        or not 1 <= message_length <= MAX_MESSAGE_LENGTH
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid Talk To Us metadata field: messageLength.",
        )

    return sanitized


def process_talk_to_us_event(event: TalkToUsEventIn) -> dict:
    """Validate and normalize Talk To Us analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Talk To Us event name "
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
        "feature": "talk_to_us",
        "journey": "talk_to_us",
        "timestamp": timestamp,
        "metadata": metadata,
    }