from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException

from src.events.ownership_learning_circle import (
    OwnershipLearningCircleEventIn,
)
from src.processing.ownership_learning_circle import (
    process_ownership_learning_circle_event,
)


@pytest.fixture
def valid_event():
    return OwnershipLearningCircleEventIn(
        visitorId=uuid4(),
        sessionId=uuid4(),
        eventName="ownership_learning_circle.join_clicked",
        eventType="click",
        sourceRoute="/",
        timestamp=datetime.now(timezone.utc),
        metadata={"step": "why", "email": "private@example.com"},
    )


def test_process_learning_circle_event(valid_event):
    processed = process_ownership_learning_circle_event(valid_event)

    assert processed["event_name"] == (
        "ownership_learning_circle.join_clicked"
    )
    assert processed["event_type"] == "click"
    assert processed["feature"] == "ownership_learning_circle"
    assert processed["journey"] == "ownership_learning_circle"
    assert processed["metadata"]["step"] == "why"
    assert "email" not in processed["metadata"]


def test_reject_invalid_event_type(valid_event):
    invalid_event = valid_event.model_copy(
        update={"event_type": "view"},
    )

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_learning_circle_event(invalid_event)

    assert exc_info.value.status_code == 422


def test_reject_external_source_route(valid_event):
    invalid_event = valid_event.model_copy(
        update={"source_route": "//external.example.com"},
    )

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_learning_circle_event(invalid_event)

    assert exc_info.value.status_code == 422


def test_reject_invalid_step_metadata(valid_event):
    invalid_event = valid_event.model_copy(
        update={"metadata": {"step": "registration"}},
    )

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_learning_circle_event(invalid_event)

    assert exc_info.value.status_code == 422


def test_normalize_timestamp_to_utc(valid_event):
    processed = process_ownership_learning_circle_event(valid_event)

    assert processed["timestamp"].utcoffset().total_seconds() == 0