
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from main import app
from src.events.ownership_audit import OwnershipAuditEventIn
from src.processing.ownership_audit import (
    EXPECTED_EVENT_TYPES,
    process_ownership_audit_event,
)
from src.reporting import ownership_audit as reporting
from src.tracking import ownership_audit as tracking


VISITOR_ID = uuid4()
SESSION_ID = uuid4()

VALID_SOURCE_ROUTE = "/work-with-me/ownership-audit"

VALID_EVENT_TYPES = {
    "ownership_audit.answer_selected": "click",
    "ownership_audit.validation_failed": "feature_use",
    "ownership_audit.step_completed": "feature_use",
    "ownership_audit.completed": "feature_use",
    "ownership_audit.results_viewed": "view",
    "ownership_audit.restarted": "click",
}


def make_event(**overrides) -> OwnershipAuditEventIn:
    """Build a valid Ownership Audit event with optional overrides."""

    payload = {
        "visitorId": str(VISITOR_ID),
        "sessionId": str(SESSION_ID),
        "eventName": "ownership_audit.answer_selected",
        "eventType": "click",
        "sourceRoute": VALID_SOURCE_ROUTE,
        "destinationRoute": None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {},
    }

    payload.update(overrides)

    return OwnershipAuditEventIn.model_validate(payload)


# Event contract


@pytest.mark.parametrize(
    ("event_name", "event_type"),
    list(VALID_EVENT_TYPES.items()),
)
def test_supported_event_names_and_types(event_name, event_type):
    event = make_event(
        eventName=event_name,
        eventType=event_type,
    )

    assert event.event_name == event_name
    assert event.event_type == event_type


def test_all_supported_events_have_expected_types():
    assert EXPECTED_EVENT_TYPES == VALID_EVENT_TYPES


@pytest.mark.parametrize(
    ("event_name", "event_type"),
    [
        ("ownership_audit.answer_selected", "view"),
        ("ownership_audit.validation_failed", "click"),
        ("ownership_audit.step_completed", "view"),
        ("ownership_audit.completed", "click"),
        ("ownership_audit.results_viewed", "feature_use"),
        ("ownership_audit.restarted", "feature_use"),
    ],
)
def test_rejects_invalid_event_name_and_type_combinations(
    event_name,
    event_type,
):
    event = make_event(
        eventName=event_name,
        eventType=event_type,
    )

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_audit_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_unsupported_event_name():
    with pytest.raises(ValidationError):
        make_event(
            eventName="ownership_audit.unsupported",
            eventType="click",
        )


def test_rejects_unsupported_event_type():
    with pytest.raises(ValidationError):
        make_event(eventType="unsupported")

# Pydantic model validation


def test_accepts_camel_case_payload():
    event = make_event()

    assert event.visitor_id == VISITOR_ID
    assert event.session_id == SESSION_ID
    assert event.event_name == "ownership_audit.answer_selected"
    assert event.event_type == "click"
    assert event.source_route == VALID_SOURCE_ROUTE


def test_accepts_snake_case_payload():
    event = OwnershipAuditEventIn.model_validate(
        {
            "visitor_id": str(VISITOR_ID),
            "session_id": str(SESSION_ID),
            "event_name": "ownership_audit.completed",
            "event_type": "feature_use",
            "source_route": VALID_SOURCE_ROUTE,
            "metadata": {},
        }
    )

    assert event.visitor_id == VISITOR_ID
    assert event.event_name == "ownership_audit.completed"


def test_session_id_can_be_omitted():
    event = make_event(sessionId=None)

    assert event.session_id is None


def test_metadata_defaults_to_empty_dictionary():
    payload = {
        "visitorId": str(VISITOR_ID),
        "sessionId": str(SESSION_ID),
        "eventName": "ownership_audit.answer_selected",
        "eventType": "click",
        "sourceRoute": VALID_SOURCE_ROUTE,
    }

    event = OwnershipAuditEventIn.model_validate(payload)

    assert event.metadata == {}


def test_accepts_metadata_dictionary():
    event = make_event(
        metadata={
            "step": 2,
            "completedStep": 1,
        }
    )

    assert event.metadata == {
        "step": 2,
        "completedStep": 1,
    }


def test_rejects_unexpected_payload_fields():
    with pytest.raises(ValidationError):
        make_event(unexpectedField="not allowed")


def test_rejects_invalid_visitor_uuid():
    with pytest.raises(ValidationError):
        make_event(visitorId="not-a-uuid")


def test_rejects_invalid_session_uuid():
    with pytest.raises(ValidationError):
        make_event(sessionId="not-a-uuid")


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("sourceRoute", ""),
        ("sourceRoute", None),
    ],
)
def test_rejects_invalid_source_route_at_model_validation(field, value):
    with pytest.raises(ValidationError):
        make_event(**{field: value})


def test_rejects_empty_destination_route_during_processing():
    event = make_event(destinationRoute="")

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_audit_event(event)

    assert exc_info.value.status_code == 422


def test_rejects_route_exceeding_maximum_length():
    with pytest.raises(ValidationError):
        make_event(sourceRoute="/" + ("a" * 2048))


# Route validation and normalization


@pytest.mark.parametrize(
    ("field", "route"),
    [
        ("sourceRoute", "   "),
        ("sourceRoute", "https://example.com"),
        ("sourceRoute", "//example.com"),
        ("destinationRoute", "   "),
        ("destinationRoute", "https://example.com"),
        ("destinationRoute", "//example.com"),
    ],
)
def test_rejects_invalid_routes_during_processing(field, route):
    event = make_event(**{field: route})

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_audit_event(event)

    assert exc_info.value.status_code == 422


@pytest.mark.parametrize(
    ("source_route", "destination_route"),
    [
        ("/", "/work-with-me"),
        ("/", None),
        (VALID_SOURCE_ROUTE, "/work-with-me"),
        ("/work-with-me?source=hero", "/booking"),
    ],
)
def test_accepts_valid_local_routes(source_route, destination_route):
    event = make_event(
        sourceRoute=source_route,
        destinationRoute=destination_route,
    )

    processed = process_ownership_audit_event(event)

    assert processed["metadata"]["source_route"] == source_route
    assert processed["metadata"]["destination_route"] == destination_route


def test_processing_adds_timestamp_when_missing():
    event = make_event(timestamp=None)

    before = datetime.now(timezone.utc)
    processed = process_ownership_audit_event(event)
    after = datetime.now(timezone.utc)

    assert before <= processed["timestamp"] <= after


def test_processing_normalizes_timestamp_to_utc():
    timestamp = datetime.fromisoformat("2026-10-21T12:00:00+03:00")
    event = make_event(timestamp=timestamp.isoformat())

    processed = process_ownership_audit_event(event)

    assert processed["timestamp"].utcoffset() == timedelta(0)
    assert processed["timestamp"].hour == 9


def test_rejects_naive_timestamp():
    event = make_event(timestamp="2026-10-21T12:00:00")

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_audit_event(event)

    assert exc_info.value.status_code == 422
    assert "timezone" in exc_info.value.detail

# Feature, journey, and identity normalization

@pytest.mark.parametrize(
    "event_name",
    VALID_EVENT_TYPES.keys(),
)
def test_assigns_ownership_audit_feature_and_journey(event_name):
    event = make_event(
        eventName=event_name,
        eventType=VALID_EVENT_TYPES[event_name],
        feature="untrusted_feature",
        journey="untrusted_journey",
    )

    processed = process_ownership_audit_event(event)

    assert processed["feature"] == "ownership_audit"
    assert processed["journey"] == "ownership_audit"


def test_processing_preserves_visitor_and_session_ids():
    event = make_event()

    processed = process_ownership_audit_event(event)

    assert processed["visitor_id"] == VISITOR_ID
    assert processed["session_id"] == SESSION_ID


def test_processing_preserves_event_name_and_type():
    event = make_event()

    processed = process_ownership_audit_event(event)

    assert processed["event_name"] == event.event_name
    assert processed["event_type"] == event.event_type


# Metadata privacy and validation


def test_processing_defaults_missing_metadata_to_empty_dictionary():
    payload = {
        "visitorId": str(VISITOR_ID),
        "sessionId": str(SESSION_ID),
        "eventName": "ownership_audit.answer_selected",
        "eventType": "click",
        "sourceRoute": VALID_SOURCE_ROUTE,
    }

    event = OwnershipAuditEventIn.model_validate(payload)
    processed = process_ownership_audit_event(event)

    assert processed["metadata"]["source_route"] == VALID_SOURCE_ROUTE
    assert processed["metadata"]["destination_route"] is None


def test_processing_keeps_approved_metadata():
    event = make_event(
        eventName="ownership_audit.completed",
        eventType="feature_use",
        metadata={
            "answeredQuestions": 9,
            "resultCategory": "developing",
            "completedStep": 3,
        },
    )

    processed = process_ownership_audit_event(event)

    assert processed["metadata"]["answeredQuestions"] == 9
    assert processed["metadata"]["resultCategory"] == "developing"
    assert processed["metadata"]["completedStep"] == 3


def test_processing_excludes_individual_answer_metadata():
    event = make_event(
        metadata={
            "questionId": "domain",
            "points": 0,
            "step": 1,
        }
    )

    processed = process_ownership_audit_event(event)

    assert "questionId" not in processed["metadata"]
    assert "points" not in processed["metadata"]
    assert processed["metadata"]["step"] == 1


def test_processing_excludes_score_metadata():
    event = make_event(
        eventName="ownership_audit.completed",
        eventType="feature_use",
        metadata={
            "score": 40,
            "answeredQuestions": 9,
            "resultCategory": "high_risk",
        },
    )

    processed = process_ownership_audit_event(event)

    assert "score" not in processed["metadata"]
    assert processed["metadata"]["answeredQuestions"] == 9
    assert processed["metadata"]["resultCategory"] == "high_risk"


@pytest.mark.parametrize(
    "result_category",
    [
        "unknown",
        "excellent",
        "",
    ],
)
def test_rejects_unsupported_result_category(result_category):
    event = make_event(
        eventName="ownership_audit.completed",
        eventType="feature_use",
        metadata={"resultCategory": result_category},
    )

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_audit_event(event)

    assert exc_info.value.status_code == 422


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("step", 0),
        ("step", -1),
        ("completedStep", 0),
        ("nextStep", -1),
        ("answeredQuestions", 0),
        ("step", True),
        ("answeredQuestions", "9"),
    ],
)
def test_rejects_invalid_numeric_metadata(field, value):
    event = make_event(metadata={field: value})

    with pytest.raises(HTTPException) as exc_info:
        process_ownership_audit_event(event)

    assert exc_info.value.status_code == 422


def test_processing_does_not_trust_client_feature_or_journey():
    event = make_event(
        feature="navbar",
        journey="coffee_with_me",
    )

    processed = process_ownership_audit_event(event)

    assert processed["feature"] == "ownership_audit"
    assert processed["journey"] == "ownership_audit"

# Persistence

@pytest.mark.anyio
async def test_persists_valid_ownership_audit_event(monkeypatch):
    connection = object()
    inserted_record = {
        "id": uuid4(),
        "event_name": "ownership_audit.answer_selected",
        "feature": "ownership_audit",
        "journey": "ownership_audit",
    }

    calls = {}

    @asynccontextmanager
    async def mock_get_connection():
        yield connection

    async def mock_validate_visitor_session(
        received_connection,
        visitor_id,
        session_id,
    ):
        calls["validation"] = (
            received_connection,
            visitor_id,
            session_id,
        )
        return True

    async def mock_insert_event(received_connection, **kwargs):
        calls["insert"] = (received_connection, kwargs)
        return inserted_record

    monkeypatch.setattr(tracking, "get_connection", mock_get_connection)
    monkeypatch.setattr(
        tracking,
        "validate_visitor_session",
        mock_validate_visitor_session,
    )
    monkeypatch.setattr(tracking, "insert_event", mock_insert_event)

    event = make_event()

    result = await tracking.persist_ownership_audit_event(event)

    assert result == inserted_record

    validation_connection, visitor_id, session_id = calls["validation"]

    assert validation_connection is connection
    assert visitor_id == VISITOR_ID
    assert session_id == SESSION_ID

    insert_connection, insert_kwargs = calls["insert"]

    assert insert_connection is connection
    assert insert_kwargs["visitor_id"] == VISITOR_ID
    assert insert_kwargs["session_id"] == SESSION_ID
    assert insert_kwargs["event_name"] == event.event_name
    assert insert_kwargs["event_type"] == event.event_type
    assert insert_kwargs["feature"] == "ownership_audit"
    assert insert_kwargs["journey"] == "ownership_audit"


@pytest.mark.anyio
async def test_rejects_invalid_visitor_session_association(monkeypatch):
    connection = object()
    insert_called = False

    @asynccontextmanager
    async def mock_get_connection():
        yield connection

    async def mock_validate_visitor_session(*args):
        return False

    async def mock_insert_event(*args, **kwargs):
        nonlocal insert_called
        insert_called = True
        return {}

    monkeypatch.setattr(tracking, "get_connection", mock_get_connection)
    monkeypatch.setattr(
        tracking,
        "validate_visitor_session",
        mock_validate_visitor_session,
    )
    monkeypatch.setattr(tracking, "insert_event", mock_insert_event)

    with pytest.raises(HTTPException) as exc_info:
        await tracking.persist_ownership_audit_event(make_event())

    assert exc_info.value.status_code == 422
    assert not insert_called


@pytest.mark.anyio
async def test_persistence_does_not_store_individual_answers(monkeypatch):
    connection = object()
    captured = {}

    @asynccontextmanager
    async def mock_get_connection():
        yield connection

    async def mock_validate_visitor_session(*args):
        return True

    async def mock_insert_event(received_connection, **kwargs):
        captured.update(kwargs)
        return {"id": uuid4()}

    monkeypatch.setattr(tracking, "get_connection", mock_get_connection)
    monkeypatch.setattr(
        tracking,
        "validate_visitor_session",
        mock_validate_visitor_session,
    )
    monkeypatch.setattr(tracking, "insert_event", mock_insert_event)

    event = make_event(
        metadata={
            "questionId": "domain",
            "points": 0,
            "step": 1,
        }
    )

    await tracking.persist_ownership_audit_event(event)

    metadata = captured["metadata"]

    assert "questionId" not in metadata
    assert "points" not in metadata
    assert metadata["step"] == 1

# Reporting summary


@pytest.mark.anyio
async def test_summary_returns_ownership_audit_metrics(monkeypatch):
    expected_totals = {
        "total_events": 30,
        "answer_selections": 18,
        "validation_failures": 2,
        "completed_steps": 9,
        "completions": 3,
        "results_views": 3,
        "restarts": 1,
        "unique_completers": 3,
        "unique_results_viewers": 3,
    }

    class MockConnection:
        async def fetchrow(self, query, start_time, end_time):
            assert "ownership_audit.answer_selected" in query
            assert "ownership_audit.completed" in query
            assert "ownership_audit.results_viewed" in query
            assert start_time < end_time
            return expected_totals

    connection = MockConnection()

    @asynccontextmanager
    async def mock_get_connection():
        yield connection

    monkeypatch.setattr(reporting, "get_connection", mock_get_connection)

    result = await reporting.get_ownership_audit_summary(
        _=None,
        days=30,
    )

    assert result["feature"] == "ownership_audit"
    assert result["journey"] == "ownership_audit"
    assert result["period"]["days"] == 30
    assert result["totals"] == expected_totals

    assert result["kpis"]["completion_to_selection_rate"] == 16.67
    assert result["kpis"]["results_view_rate"] == 100.0
    assert result["kpis"]["average_completed_steps_per_completion"] == 3.0

    assert "generated_at" in result


@pytest.mark.anyio
async def test_summary_handles_zero_events(monkeypatch):
    empty_totals = {
        "total_events": 0,
        "answer_selections": 0,
        "validation_failures": 0,
        "completed_steps": 0,
        "completions": 0,
        "results_views": 0,
        "restarts": 0,
        "unique_completers": 0,
        "unique_results_viewers": 0,
    }

    class MockConnection:
        async def fetchrow(self, *args):
            return empty_totals

    @asynccontextmanager
    async def mock_get_connection():
        yield MockConnection()

    monkeypatch.setattr(reporting, "get_connection", mock_get_connection)

    result = await reporting.get_ownership_audit_summary(
        _=None,
        days=30,
    )

    assert result["kpis"] == {
        "completion_to_selection_rate": 0.0,
        "results_view_rate": 0.0,
        "average_completed_steps_per_completion": 0.0,
    }


@pytest.mark.parametrize("days", [0, -1, 366])
def test_summary_declares_valid_days_query_constraints(days):
    summary_path = "/api/analytics/ownership-audit/summary"

    parameters = app.openapi()["paths"][summary_path]["get"]["parameters"]

    days_parameter = next(
        parameter
        for parameter in parameters
        if parameter["name"] == "days"
    )

    assert days_parameter["in"] == "query"
    assert days_parameter["schema"]["minimum"] == 1
    assert days_parameter["schema"]["maximum"] == 365

    minimum = days_parameter["schema"]["minimum"]
    maximum = days_parameter["schema"]["maximum"]

    assert days < minimum or days > maximum


@pytest.mark.anyio
async def test_summary_returns_503_when_database_fails(monkeypatch):
    @asynccontextmanager
    async def mock_get_connection():
        raise RuntimeError("Database unavailable")
        yield

    monkeypatch.setattr(reporting, "get_connection", mock_get_connection)

    with pytest.raises(HTTPException) as exc_info:
        await reporting.get_ownership_audit_summary(
            _=None,
            days=30,
        )

    assert exc_info.value.status_code == 503

# Reporting events list

@pytest.mark.anyio
async def test_events_endpoint_returns_paginated_events(monkeypatch):
    event_record = {
        "id": uuid4(),
        "visitor_id": VISITOR_ID,
        "session_id": SESSION_ID,
        "event_name": "ownership_audit.completed",
        "event_type": "feature_use",
        "feature": "ownership_audit",
        "journey": "ownership_audit",
        "timestamp": datetime.now(timezone.utc),
        "metadata": {"resultCategory": "developing"},
    }

    class MockConnection:
        async def fetchval(self, query, *params):
            assert "journey = $1" in query
            assert params == ("ownership_audit",)
            return 1

        async def fetch(self, query, *params):
            assert "ORDER BY timestamp DESC" in query
            assert "LIMIT" in query
            assert "OFFSET" in query
            assert params == ("ownership_audit", 25, 0)
            return [event_record]

    @asynccontextmanager
    async def mock_get_connection():
        yield MockConnection()

    monkeypatch.setattr(reporting, "get_connection", mock_get_connection)

    result = await reporting.list_ownership_audit_events(
        _=None,
        limit=25,
        offset=0,
        event_name=None,
    )

    assert result["total"] == 1
    assert result["limit"] == 25
    assert result["offset"] == 0
    assert len(result["items"]) == 1
    assert result["items"][0]["event_name"] == "ownership_audit.completed"


@pytest.mark.anyio
async def test_events_endpoint_filters_by_event_name(monkeypatch):
    class MockConnection:
        async def fetchval(self, query, *params):
            assert "event_name = $2" in query
            assert params == (
                "ownership_audit",
                "ownership_audit.completed",
            )
            return 1

        async def fetch(self, query, *params):
            assert "event_name = $2" in query
            assert params == (
                "ownership_audit",
                "ownership_audit.completed",
                50,
                0,
            )
            return []

    @asynccontextmanager
    async def mock_get_connection():
        yield MockConnection()

    monkeypatch.setattr(reporting, "get_connection", mock_get_connection)

    result = await reporting.list_ownership_audit_events(
        _=None,
        limit=50,
        offset=0,
        event_name="ownership_audit.completed",
    )

    assert result["total"] == 1
    assert result["items"] == []


@pytest.mark.anyio
async def test_events_endpoint_rejects_unsupported_event_name():
    with pytest.raises(HTTPException) as exc_info:
        await reporting.list_ownership_audit_events(
            _=None,
            limit=50,
            offset=0,
            event_name="ownership_audit.unsupported",
        )

    assert exc_info.value.status_code == 422


@pytest.mark.anyio
async def test_events_endpoint_returns_503_when_database_fails(monkeypatch):
    @asynccontextmanager
    async def mock_get_connection():
        raise RuntimeError("Database unavailable")
        yield

    monkeypatch.setattr(reporting, "get_connection", mock_get_connection)

    with pytest.raises(HTTPException) as exc_info:
        await reporting.list_ownership_audit_events(
            _=None,
            limit=50,
            offset=0,
            event_name=None,
        )

    assert exc_info.value.status_code == 503
