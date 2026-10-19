
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.events.hero import HeroEventIn
from src.processing.hero import process_hero_event


@pytest.mark.parametrize(
    ("event_name", "expected_feature"),
    [
        ("hero.viewed", "hero"),
        ("page.viewed", "page"),
    ],
)
def test_process_visibility_event(event_name, expected_feature):
    visitor_id = uuid4()
    session_id = uuid4()
    timestamp = datetime.now(timezone.utc)

    event = HeroEventIn.model_validate(
        {
            "visitorId": str(visitor_id),
            "sessionId": str(session_id),
            "eventName": event_name,
            "eventType": "view",
            "sourceRoute": "/",
            "timestamp": timestamp.isoformat(),
            "metadata": {"source": "visibility-observer"},
        }
    )

    processed = process_hero_event(event)

    assert processed["visitor_id"] == visitor_id
    assert processed["session_id"] == session_id
    assert processed["event_name"] == event_name
    assert processed["event_type"] == "view"
    assert processed["feature"] == expected_feature
    assert processed["metadata"]["component"] == expected_feature
    assert processed["timestamp"] == timestamp


def test_rejects_unsupported_event_name():
    with pytest.raises(ValidationError):
        HeroEventIn.model_validate(
            {
                "visitorId": str(uuid4()),
                "eventName": "hero.clicked",
                "eventType": "view",
                "sourceRoute": "/",
            }
        )


def test_rejects_invalid_event_type():
    with pytest.raises(ValidationError):
        HeroEventIn.model_validate(
            {
                "visitorId": str(uuid4()),
                "eventName": "hero.viewed",
                "eventType": "click",
                "sourceRoute": "/",
            }
        )


def test_accepts_snake_case_field_names():
    event = HeroEventIn.model_validate(
        {
            "visitor_id": str(uuid4()),
            "event_name": "hero.viewed",
            "event_type": "view",
            "source_route": "/",
        }
    )

    assert event.event_name == "hero.viewed"
