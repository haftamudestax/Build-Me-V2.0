from datetime import datetime, timezone

from fastapi import HTTPException

from src.events.ownership_audit import OwnershipAuditEventIn


# Every accepted event name and the one event type it may be sent with.
# The frontend's eventTypeByName in main.tsx must use the same types.
EXPECTED_EVENT_TYPES = {
    "ownership_audit.selected": "click",
    "ownership_audit.started": "feature_use",
    "ownership_audit.answer_selected": "click",
    "ownership_audit.validation_failed": "feature_use",
    "ownership_audit.step_completed": "feature_use",
    "ownership_audit.registration_completed": "feature_use",
    "ownership_audit.completed": "feature_use",
    "ownership_audit.results_viewed": "view",
    "ownership_audit.next_steps_viewed": "view",
    "ownership_audit.path_selected": "click",
    "ownership_audit.restarted": "click",
    "ownership_audit.back_to_paths": "click",
    # Get Quick Wins is the entry point to the audit. These events are stored
    # under the ownership_audit feature and journey so the audit's reporting
    # includes them.
    "get_quick_wins.opened": "click",
    "get_quick_wins.closed": "click",
}


ALLOWED_METADATA_FIELDS = {
    "step",
    "section",
    "completedStep",
    "nextStep",
    "answeredQuestions",
    "resultCategory",
    "path",
    "lastStep",
    "source_route",
    "destination_route",
}

RESULT_CATEGORIES = {"strong", "developing", "high_risk"}

# Work With Me paths the final step can send a visitor to.
WORK_WITH_ME_PATHS = {"delivery", "mentor", "coffee"}

# Steps of the Get Quick Wins modal a visitor can leave from.
QUICK_WINS_STEPS = {
    "options",
    "intro",
    "register",
    "questions",
    "score",
    "next",
}

POSITIVE_INTEGER_FIELDS = (
    "step",
    "section",
    "completedStep",
    "nextStep",
    "answeredQuestions",
)


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
    """Keep only approved, non-answer-specific audit metadata.

    Individual answers (questionId, points), scores, names and emails are
    dropped on purpose.
    """

    sanitized = {
        key: value
        for key, value in metadata.items()
        if key in ALLOWED_METADATA_FIELDS
    }

    result_category = sanitized.get("resultCategory")

    if result_category is not None and result_category not in RESULT_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail="Unsupported ownership audit result category.",
        )

    path = sanitized.get("path")

    if path is not None and path not in WORK_WITH_ME_PATHS:
        raise HTTPException(
            status_code=422,
            detail="Unsupported ownership audit path.",
        )

    last_step = sanitized.get("lastStep")

    if last_step is not None and last_step not in QUICK_WINS_STEPS:
        raise HTTPException(
            status_code=422,
            detail="Unsupported Get Quick Wins step.",
        )

    for field in POSITIVE_INTEGER_FIELDS:
        value = sanitized.get(field)

        if value is not None and (
            not isinstance(value, int) or isinstance(value, bool) or value < 1
        ):
            raise HTTPException(
                status_code=422,
                detail=f"Invalid ownership audit metadata field: {field}.",
            )

    return sanitized


def process_ownership_audit_event(event: OwnershipAuditEventIn) -> dict:
    """Validate and normalize Ownership Audit analytics events."""

    expected_type = EXPECTED_EVENT_TYPES.get(event.event_name)

    if expected_type is None or event.event_type != expected_type:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unsupported Ownership Audit event name "
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
        "feature": "ownership_audit",
        "journey": "ownership_audit",
        "timestamp": timestamp,
        "metadata": metadata,
    }