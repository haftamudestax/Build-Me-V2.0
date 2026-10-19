
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.events.navbar import (
    NavbarEventIn,
    NavbarEventName,
    NavbarEventType,
)
from src.processing.navbar import process_navbar_event


def make_navbar_event(
    event_name: str = "navbar.logo_click",
    event_type: str = "click",
    **overrides,
) -> NavbarEventIn:
    """Create a valid Navbar event, allowing individual fields to be overridden."""

    payload = {
        "visitor_id": str(uuid4()),
        "session_id": str(uuid4()),
        "event_name": event_name,
        "event_type": event_type,
        "source_route": "/",
        "destination_route": "/about",
        "navigation_success": (
            None if event_name == "navbar.logo_view" else True
        ),
        "device_type": "desktop",
        "viewport_type": "desktop",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }
    payload.update(overrides)

    return NavbarEventIn.model_validate(payload)


# ---------------------------------------------------------------------------
# Event contract tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    ("event_name", "event_type"),
    [
        ("navbar.logo_click", "click"),
        ("navbar.nav_link_click", "click"),
        ("navbar.logo_view", "view"),
    ],
)
def test_accepts_supported_navbar_events(event_name, event_type):
    event = make_navbar_event(event_name, event_type)

    assert event.event_name == event_name
    assert event.event_type == event_type


def test_rejects_unsupported_navbar_event_name():
    with pytest.raises(ValidationError):
        make_navbar_event("navbar.unknown_event", "click")


def test_rejects_invalid_event_type_value():
    with pytest.raises(ValidationError):
        make_navbar_event("navbar.logo_click", "unknown")


def test_rejects_invalid_navbar_event_type_combination():
    event = make_navbar_event(
        event_name="navbar.logo_click",
        event_type="view",
    )

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_click_event_with_view_type():
    event = make_navbar_event(
        event_name="navbar.nav_link_click",
        event_type="view",
    )

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_logo_view_with_click_type():
    event = make_navbar_event(
        event_name="navbar.logo_view",
        event_type="click",
    )

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_navbar_event_enums_define_supported_names():
    assert {item.value for item in NavbarEventName} == {
        "navbar.logo_click",
        "navbar.nav_link_click",
        "navbar.logo_view",
    }


def test_navbar_event_enums_define_supported_types():
    assert {item.value for item in NavbarEventType} == {
        "click",
        "view",
    }


# ---------------------------------------------------------------------------
# Event processing tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    ("event_name", "event_type"),
    [
        ("navbar.logo_click", "click"),
        ("navbar.nav_link_click", "click"),
        ("navbar.logo_view", "view"),
    ],
)
def test_processes_supported_navbar_events(event_name, event_type):
    event = make_navbar_event(event_name, event_type)

    processed = process_navbar_event(event)

    assert processed["visitor_id"] == event.visitor_id
    assert processed["session_id"] == event.session_id
    assert processed["event_name"] == event_name
    assert processed["event_type"] == event_type
    assert processed["feature"] == "navbar"
    assert processed["metadata"] is not None


def test_processes_navbar_logo_click():
    event = make_navbar_event(
        "navbar.logo_click",
        "click",
        navigation_success=True,
    )

    processed = process_navbar_event(event)

    assert processed["event_name"] == "navbar.logo_click"
    assert processed["event_type"] == "click"
    assert processed["feature"] == "navbar"
    assert processed["visitor_id"] == event.visitor_id
    assert processed["session_id"] == event.session_id


def test_processes_navbar_link_click():
    event = make_navbar_event(
        "navbar.nav_link_click",
        "click",
        source_route="/",
        destination_route="/about",
        navigation_success=True,
    )

    processed = process_navbar_event(event)

    assert processed["event_name"] == "navbar.nav_link_click"
    assert processed["event_type"] == "click"
    assert processed["feature"] == "navbar"


def test_processes_navbar_logo_view():
    event = make_navbar_event(
        "navbar.logo_view",
        "view",
        navigation_success=None,
    )

    processed = process_navbar_event(event)

    assert processed["event_name"] == "navbar.logo_view"
    assert processed["event_type"] == "view"
    assert processed["feature"] == "navbar"


def test_preserves_explicit_navigation_failure():
    event = make_navbar_event(
        "navbar.nav_link_click",
        "click",
        navigation_success=False,
    )

    processed = process_navbar_event(event)

    assert processed["metadata"] is not None


def test_rejects_empty_source_route():
    event = make_navbar_event(source_route="   ")

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_empty_destination_route():
    event = make_navbar_event(destination_route="   ")

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_source_route_that_is_not_application_path():
    event = make_navbar_event(source_route="https://example.com")

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_destination_route_that_is_not_application_path():
    event = make_navbar_event(destination_route="about")

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_invalid_device_type():
    event = make_navbar_event(device_type="unknown-device")

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_invalid_viewport_type():
    event = make_navbar_event(viewport_type="unknown-viewport")

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_naive_occurred_at_timestamp():
    event = make_navbar_event(
        occurred_at=datetime(2026, 1, 1, 12, 0, 0).isoformat(),
    )

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_logo_view_with_navigation_success():
    event = make_navbar_event(
        event_name="navbar.logo_view",
        event_type="view",
        navigation_success=True,
    )

    with pytest.raises(HTTPException) as exc_info:
        process_navbar_event(event)

    assert exc_info.value.status_code == 422


# ---------------------------------------------------------------------------
# Required field and identifier validation tests
# ---------------------------------------------------------------------------

def test_rejects_missing_source_route():
    with pytest.raises(ValidationError):
        NavbarEventIn.model_validate(
            {
                "visitor_id": str(uuid4()),
                "event_name": "navbar.logo_click",
                "event_type": "click",
                "destination_route": "/about",
            }
        )


def test_rejects_missing_destination_route():
    with pytest.raises(ValidationError):
        NavbarEventIn.model_validate(
            {
                "visitor_id": str(uuid4()),
                "event_name": "navbar.logo_click",
                "event_type": "click",
                "source_route": "/",
            }
        )


def test_rejects_invalid_visitor_uuid():
    with pytest.raises(ValidationError):
        make_navbar_event(visitor_id="not-a-valid-uuid")


def test_accepts_missing_optional_session_id():
    event = make_navbar_event(session_id=None)

    assert event.session_id is None


def test_accepts_timezone_aware_timestamp():
    timestamp = datetime.now(timezone.utc)
    event = make_navbar_event(occurred_at=timestamp.isoformat())

    assert event.occurred_at is not None
    assert event.occurred_at.utcoffset() is not None
