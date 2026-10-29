
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.events.delivery_project import DeliveryProjectEventIn
from src.processing.delivery_project import process_delivery_project_event


VALID_EVENT_TYPES = {
    "work_with_me.cta_clicked": "click",
    "delivery_project.selected": "click",
    "delivery_project.started": "feature_use",
    "delivery_project.validation_failed": "feature_use",
    "delivery_project.booking_submitted": "feature_use",
    "delivery_project.confirmation_viewed": "view",
    "delivery_project.submission_failed": "feature_use",
}


def make_event(**overrides) -> DeliveryProjectEventIn:
    """Create a valid event payload for model and processing tests."""
    payload = {
        "visitorId": str(uuid4()),
        "sessionId": str(uuid4()),
        "eventName": "delivery_project.started",
        "eventType": "feature_use",
        "sourceRoute": "/",
        "destinationRoute": "/delivery-project",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {},
    }
    payload.update(overrides)
    return DeliveryProjectEventIn(**payload)


# Event model validation


@pytest.mark.parametrize(
    ("event_name", "event_type"),
    VALID_EVENT_TYPES.items(),
)
def test_accepts_all_supported_event_names_and_types(
    event_name: str,
    event_type: str,
):
    event = make_event(
        eventName=event_name,
        eventType=event_type,
    )

    assert event.event_name == event_name
    assert event.event_type == event_type


@pytest.mark.parametrize(
    ("event_name", "event_type"),
    [
        ("work_with_me.cta_clicked", "view"),
        ("delivery_project.selected", "feature_use"),
        ("delivery_project.started", "view"),
        ("delivery_project.validation_failed", "click"),
        ("delivery_project.booking_submitted", "click"),
        ("delivery_project.confirmation_viewed", "feature_use"),
        ("delivery_project.submission_failed", "view"),
    ],
)
def test_rejects_invalid_event_type_combinations(
    event_name: str,
    event_type: str,
):
    # Both values are individually valid model literals.
    # Their combination is validated by the processing layer.
    event = make_event(
        eventName=event_name,
        eventType=event_type,
    )

    with pytest.raises(HTTPException) as exc_info:
        process_delivery_project_event(event)

    assert exc_info.value.status_code == 422


@pytest.mark.parametrize(
    "event_name",
    [
        "delivery_project.unknown",
        "booking.submitted",
        "navbar.logo_click",
        "",
    ],
)
def test_rejects_unsupported_event_names(event_name: str):
    with pytest.raises(ValidationError):
        make_event(eventName=event_name)


@pytest.mark.parametrize(
    "event_type",
    [
        "page_view",
        "hero_view",
        "submit",
        "unknown",
        "",
    ],
)
def test_rejects_unsupported_event_types(event_type: str):
    with pytest.raises(ValidationError):
        make_event(eventType=event_type)


def test_accepts_camel_case_payload_fields():
    visitor_id = uuid4()
    session_id = uuid4()

    event = make_event(
        visitorId=str(visitor_id),
        sessionId=str(session_id),
        eventName="delivery_project.booking_submitted",
        eventType="feature_use",
        sourceRoute="/",
        destinationRoute="/delivery-project/confirmation",
    )

    assert event.visitor_id == visitor_id
    assert event.session_id == session_id
    assert event.event_name == "delivery_project.booking_submitted"
    assert event.event_type == "feature_use"
    assert event.source_route == "/"
    assert event.destination_route == "/delivery-project/confirmation"


def test_accepts_optional_session_id():
    event = make_event(sessionId=None)

    assert event.session_id is None


def test_rejects_invalid_visitor_id():
    with pytest.raises(ValidationError):
        make_event(visitorId="not-a-uuid")


def test_rejects_invalid_session_id():
    with pytest.raises(ValidationError):
        make_event(sessionId="not-a-uuid")


def test_metadata_defaults_to_empty_dictionary():
    event = DeliveryProjectEventIn(
        visitorId=str(uuid4()),
        eventName="delivery_project.started",
        eventType="feature_use",
        sourceRoute="/",
    )

    assert event.metadata == {}


def test_accepts_metadata_dictionary():
    metadata = {
        "projectType": "web_application",
        "step": "project_details",
        "attempt": 1,
    }

    event = make_event(metadata=metadata)

    assert event.metadata == metadata


def test_rejects_unexpected_payload_fields():
    with pytest.raises(ValidationError):
        make_event(unexpectedField="not-allowed")


# Route validation


def test_rejects_empty_source_route_at_model_validation():
    with pytest.raises(ValidationError):
        make_event(sourceRoute="")


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("sourceRoute", "   "),
        ("sourceRoute", "https://example.com"),
        ("sourceRoute", "//example.com"),
        ("destinationRoute", ""),
        ("destinationRoute", "   "),
        ("destinationRoute", "https://example.com"),
        ("destinationRoute", "//example.com"),
    ],
)
def test_rejects_invalid_routes_during_processing(
    field: str,
    value: str,
):
    event = make_event(**{field: value})

    with pytest.raises(HTTPException) as exc_info:
        process_delivery_project_event(event)

    assert exc_info.value.status_code == 422


@pytest.mark.parametrize(
    ("source_route", "destination_route"),
    [
        ("/", "/delivery-project"),
        ("/", None),
        ("/delivery-project", "/delivery-project/confirmation"),
        ("/delivery-project?source=hero", "/booking"),
    ],
)
def test_accepts_valid_local_routes(
    source_route: str,
    destination_route: str | None,
):
    event = make_event(
        sourceRoute=source_route,
        destinationRoute=destination_route,
    )

    processed = process_delivery_project_event(event)

    assert processed["metadata"]["source_route"] == source_route
    assert processed["metadata"]["destination_route"] == destination_route


# Timestamp validation and normalization


def test_processing_adds_timestamp_when_missing():
    event = make_event(timestamp=None)

    before = datetime.now(timezone.utc)
    processed = process_delivery_project_event(event)
    after = datetime.now(timezone.utc)

    timestamp = processed["timestamp"]

    assert timestamp.tzinfo is not None
    assert before <= timestamp <= after


def test_processing_normalizes_timestamp_to_utc():
    original = datetime(
        2026,
        10,
        21,
        12,
        0,
        0,
        tzinfo=timezone(timedelta(hours=3)),
    )

    event = make_event(timestamp=original.isoformat())
    processed = process_delivery_project_event(event)

    assert processed["timestamp"].utcoffset() == timedelta(0)
    assert processed["timestamp"] == datetime(
        2026,
        10,
        21,
        9,
        0,
        0,
        tzinfo=timezone.utc,
    )


def test_rejects_naive_timestamp():
    event = make_event(timestamp="2026-10-21T12:00:00")

    with pytest.raises(HTTPException) as exc_info:
        process_delivery_project_event(event)

    assert exc_info.value.status_code == 422

# Processing and analytics classification

@pytest.mark.parametrize(
    ("event_name", "expected_feature", "expected_journey"),
    [
        ("work_with_me.cta_clicked", "work_with_me", "delivery_project"),
        ("delivery_project.selected", "delivery_project", "delivery_project"),
        ("delivery_project.started", "delivery_project", "delivery_project"),
        (
            "delivery_project.validation_failed",
            "delivery_project",
            "delivery_project",
        ),
        (
            "delivery_project.booking_submitted",
            "delivery_project",
            "delivery_project",
        ),
        (
            "delivery_project.confirmation_viewed",
            "delivery_project",
            "delivery_project",
        ),
        (
            "delivery_project.submission_failed",
            "delivery_project",
            "delivery_project",
        ),
    ],
)
def test_assigns_feature_and_journey(
    event_name: str,
    expected_feature: str,
    expected_journey: str,
):
    event = make_event(
        eventName=event_name,
        eventType=VALID_EVENT_TYPES[event_name],
    )

    processed = process_delivery_project_event(event)

    assert processed["feature"] == expected_feature
    assert processed["journey"] == expected_journey


def test_processing_preserves_visitor_and_session_ids():
    visitor_id = uuid4()
    session_id = uuid4()

    event = make_event(
        visitorId=str(visitor_id),
        sessionId=str(session_id),
    )

    processed = process_delivery_project_event(event)

    assert processed["visitor_id"] == visitor_id
    assert processed["session_id"] == session_id


def test_processing_preserves_event_name_and_type():
    event = make_event(
        eventName="delivery_project.booking_submitted",
        eventType="feature_use",
    )

    processed = process_delivery_project_event(event)

    assert processed["event_name"] == "delivery_project.booking_submitted"
    assert processed["event_type"] == "feature_use"


def test_processing_includes_routes_in_metadata():
    event = make_event(
        sourceRoute="/",
        destinationRoute="/delivery-project/confirmation",
        metadata={"step": "confirmation"},
    )

    processed = process_delivery_project_event(event)

    assert processed["metadata"]["source_route"] == "/"
    assert (
        processed["metadata"]["destination_route"]
        == "/delivery-project/confirmation"
    )
    assert processed["metadata"]["step"] == "confirmation"


def test_processing_does_not_trust_client_feature_or_journey():
    event = make_event(
        eventName="delivery_project.started",
        eventType="feature_use",
        feature="navbar",
        journey="home_navigation",
    )

    processed = process_delivery_project_event(event)

    assert processed["feature"] == "delivery_project"
    assert processed["journey"] == "delivery_project"

# Booking analytics boundary

def test_booking_submitted_is_an_analytics_event():
    """Booking analytics processing must not create or modify a booking."""
    event = make_event(
        eventName="delivery_project.booking_submitted",
        eventType="feature_use",
        sourceRoute="/delivery-project",
        destinationRoute="/delivery-project/confirmation",
        metadata={"projectType": "web_application"},
    )

    processed = process_delivery_project_event(event)

    assert processed["event_name"] == "delivery_project.booking_submitted"
    assert processed["event_type"] == "feature_use"
    assert processed["feature"] == "delivery_project"
    assert processed["journey"] == "delivery_project"
    assert "booking_id" not in processed
    assert "email" not in processed["metadata"]
