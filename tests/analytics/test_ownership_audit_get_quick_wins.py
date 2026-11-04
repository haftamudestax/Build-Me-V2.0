import re
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from typing import get_args
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.events.ownership_audit import OwnershipAuditEventIn
from src.processing.ownership_audit import (
    EXPECTED_EVENT_TYPES,
    process_ownership_audit_event,
)
from src.reporting import ownership_audit as reporting
from src.tracking import ownership_audit as tracking

NEW_EVENTS = {
    "ownership_audit.registration_completed": "feature_use",
    "ownership_audit.next_steps_viewed": "view",
    "ownership_audit.path_selected": "click",
    "get_quick_wins.opened": "click",
    "get_quick_wins.closed": "click",
}

ALL_EVENT_TYPES = ("click", "feature_use", "view")

WRONG_TYPE_CASES = [
    (name, wrong_type)
    for name, correct_type in NEW_EVENTS.items()
    for wrong_type in ALL_EVENT_TYPES
    if wrong_type != correct_type
]


def make_event(name, event_type, metadata=None, route="/"):
    return OwnershipAuditEventIn.model_validate(
        {
            "visitorId": str(uuid4()),
            "sessionId": str(uuid4()),
            "eventName": name,
            "eventType": event_type,
            "sourceRoute": route,
            "metadata": metadata or {},
        }
    )


class FakeConnection:
    """Stands in for a database connection and records every call."""

    def __init__(self, row=None, rows=None, total=0):
        self.row = row
        self.rows = rows if rows is not None else []
        self.total = total
        self.calls = []

    async def fetchrow(self, *args):
        self.calls.append(("fetchrow", args))
        return self.row

    async def fetch(self, *args):
        self.calls.append(("fetch", args))
        return self.rows

    async def fetchval(self, *args):
        self.calls.append(("fetchval", args))
        return self.total


def use_connection(monkeypatch, module, connection):
    @asynccontextmanager
    async def mock_get_connection():
        yield connection

    monkeypatch.setattr(module, "get_connection", mock_get_connection)


# --------------------------------------------------------------------------
# Schema and processing
# --------------------------------------------------------------------------


@pytest.mark.parametrize(("name", "event_type"), NEW_EVENTS.items())
def test_accepts_new_events_under_the_audit_journey(name, event_type):
    processed = process_ownership_audit_event(make_event(name, event_type))

    assert processed["event_name"] == name
    assert processed["feature"] == "ownership_audit"
    assert processed["journey"] == "ownership_audit"


def test_every_schema_event_has_an_expected_type():
    # event_name is a union of two Literal types; collect every name in them.
    union = OwnershipAuditEventIn.model_fields["event_name"].annotation
    schema_names = {
        name for literal in get_args(union) for name in get_args(literal)
    }

    assert schema_names == set(EXPECTED_EVENT_TYPES)


def test_rejects_a_mismatched_event_type():
    with pytest.raises(HTTPException) as error:
        process_ownership_audit_event(
            make_event("ownership_audit.path_selected", "view")
        )

    assert error.value.status_code == 422


@pytest.mark.parametrize(("name", "wrong_type"), WRONG_TYPE_CASES)
def test_rejects_every_wrong_type_for_the_new_events(name, wrong_type):
    with pytest.raises(HTTPException) as error:
        process_ownership_audit_event(make_event(name, wrong_type))

    assert error.value.status_code == 422


def test_schema_rejects_an_unknown_event_name():
    with pytest.raises(ValidationError):
        make_event("ownership_audit.nope", "click")


def test_keeps_approved_metadata_and_drops_the_rest():
    processed = process_ownership_audit_event(
        make_event(
            "ownership_audit.path_selected",
            "click",
            {
                "path": "coffee",
                "questionId": "domain",
                "points": 2,
                "score": 83,
                "email": "visitor@example.com",
            },
        )
    )

    assert processed["metadata"]["path"] == "coffee"

    for dropped in ("questionId", "points", "score", "email"):
        assert dropped not in processed["metadata"]


def test_keeps_the_section_on_answer_events():
    processed = process_ownership_audit_event(
        make_event(
            "ownership_audit.answer_selected",
            "click",
            {"step": 3, "section": 2, "questionId": "backups", "points": 1},
        )
    )

    assert processed["metadata"]["step"] == 3
    assert processed["metadata"]["section"] == 2
    assert "questionId" not in processed["metadata"]


def test_drops_the_registration_field_names_on_validation_failures():
    processed = process_ownership_audit_event(
        make_event(
            "ownership_audit.validation_failed",
            "feature_use",
            {"step": 2, "fields": ["name", "email"]},
        )
    )

    assert processed["metadata"]["step"] == 2
    assert "fields" not in processed["metadata"]


def test_records_the_step_a_visitor_closed_from():
    processed = process_ownership_audit_event(
        make_event("get_quick_wins.closed", "click", {"lastStep": "register"})
    )

    assert processed["metadata"]["lastStep"] == "register"


@pytest.mark.parametrize(
    ("name", "event_type", "metadata"),
    [
        ("ownership_audit.path_selected", "click", {"path": "other"}),
        ("get_quick_wins.closed", "click", {"lastStep": "nowhere"}),
        # "step" must be a number; the closing step travels as "lastStep".
        ("get_quick_wins.closed", "click", {"step": "intro"}),
        ("ownership_audit.answer_selected", "click", {"section": 0}),
        ("ownership_audit.answer_selected", "click", {"section": "2"}),
        ("ownership_audit.completed", "feature_use", {"resultCategory": "bad"}),
    ],
)
def test_rejects_invalid_metadata_values(name, event_type, metadata):
    with pytest.raises(HTTPException) as error:
        process_ownership_audit_event(make_event(name, event_type, metadata))

    assert error.value.status_code == 422


# --------------------------------------------------------------------------
# Persistence
# --------------------------------------------------------------------------


@pytest.mark.anyio
async def test_persists_get_quick_wins_events_under_the_audit_journey(
    monkeypatch,
):
    captured = {}

    async def mock_validate(connection, visitor_id, session_id):
        return True

    async def mock_insert(connection, **kwargs):
        captured.update(kwargs)
        return {"id": 1, **kwargs}

    use_connection(monkeypatch, tracking, FakeConnection())
    monkeypatch.setattr(tracking, "validate_visitor_session", mock_validate)
    monkeypatch.setattr(tracking, "insert_event", mock_insert)

    record = await tracking.persist_ownership_audit_event(
        make_event(
            "get_quick_wins.closed",
            "click",
            {"lastStep": "questions", "email": "visitor@example.com"},
        )
    )

    assert record["id"] == 1
    assert captured["event_name"] == "get_quick_wins.closed"
    assert captured["feature"] == "ownership_audit"
    assert captured["journey"] == "ownership_audit"
    assert captured["metadata"]["lastStep"] == "questions"
    assert "email" not in captured["metadata"]


@pytest.mark.anyio
async def test_does_not_persist_events_for_an_invalid_session(monkeypatch):
    inserted = []

    async def mock_validate(connection, visitor_id, session_id):
        return False

    async def mock_insert(connection, **kwargs):
        inserted.append(kwargs)

    use_connection(monkeypatch, tracking, FakeConnection())
    monkeypatch.setattr(tracking, "validate_visitor_session", mock_validate)
    monkeypatch.setattr(tracking, "insert_event", mock_insert)

    with pytest.raises(HTTPException) as error:
        await tracking.persist_ownership_audit_event(
            make_event("get_quick_wins.opened", "click")
        )

    assert error.value.status_code == 422
    assert inserted == []


# --------------------------------------------------------------------------
# Reporting: helpers
# --------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("numerator", "denominator", "expected"),
    [
        (1, 3, 33.33),
        (0, 10, 0.0),
        (5, 0, 0.0),
        (5, None, 0.0),
        (3, 2, 100.0),  # capped at 100
    ],
)
def test_percentage_rounds_caps_and_handles_empty_denominators(
    numerator, denominator, expected
):
    assert reporting._percentage(numerator, denominator) == expected


def test_funnel_lists_stages_in_journey_order():
    funnel = reporting._build_funnel({})

    assert [stage["stage"] for stage in funnel] == [
        "opened",
        "selected_audit",
        "registered",
        "completed",
        "viewed_results",
        "viewed_next_steps",
        "chose_a_path",
    ]


def test_funnel_calculates_conversion_from_previous_and_first_stage():
    funnel = reporting._build_funnel(
        {
            "unique_openers": 100,
            "unique_selectors": 50,
            "unique_registrants": 25,
            "unique_completers": 20,
            "unique_results_viewers": 20,
            "unique_next_steps_viewers": 10,
            "unique_path_selectors": 5,
        }
    )

    assert [
        (
            stage["visitors"],
            stage["from_previous_pct"],
            stage["from_first_pct"],
        )
        for stage in funnel
    ] == [
        (100, None, 100.0),
        (50, 50.0, 50.0),
        (25, 50.0, 25.0),
        (20, 80.0, 20.0),
        (20, 100.0, 20.0),
        (10, 50.0, 10.0),
        (5, 50.0, 5.0),
    ]


def test_funnel_caps_rates_at_100_when_a_later_stage_has_more_visitors():
    # A visitor can reach the audit without a Get Quick Wins "opened" event,
    # for example through the older Work With Me card.
    funnel = reporting._build_funnel(
        {"unique_openers": 10, "unique_selectors": 40}
    )

    assert funnel[1]["from_previous_pct"] == 100.0
    assert funnel[1]["from_first_pct"] == 100.0


def test_funnel_treats_missing_totals_as_zero():
    funnel = reporting._build_funnel({})

    assert all(stage["visitors"] == 0 for stage in funnel)
    assert funnel[0]["from_previous_pct"] is None
    assert all(stage["from_previous_pct"] == 0.0 for stage in funnel[1:])
    assert all(stage["from_first_pct"] == 0.0 for stage in funnel)


# --------------------------------------------------------------------------
# Reporting: /summary
# --------------------------------------------------------------------------

FULL_SUMMARY_ROW = {
    "total_events": 500,
    "answer_selections": 90,
    "validation_failures": 4,
    "completed_steps": 20,
    "completions": 10,
    "results_views": 10,
    "restarts": 1,
    "quick_wins_opens": 40,
    "quick_wins_closes": 25,
    "audit_selections": 20,
    "starts": 20,
    "registrations": 15,
    "next_steps_views": 8,
    "path_selections": 2,
    "back_to_paths": 3,
    "unique_completers": 8,
    "unique_results_viewers": 8,
    "unique_openers": 35,
    "unique_selectors": 18,
    "unique_registrants": 14,
    "unique_next_steps_viewers": 7,
    "unique_path_selectors": 2,
}


@pytest.mark.anyio
async def test_summary_includes_the_funnel_and_new_rates(monkeypatch):
    connection = FakeConnection(row=dict(FULL_SUMMARY_ROW))
    use_connection(monkeypatch, reporting, connection)

    result = await reporting.get_ownership_audit_summary(_=None, days=30)

    assert result["feature"] == "ownership_audit"
    assert result["journey"] == "ownership_audit"
    assert result["period"]["days"] == 30
    assert result["totals"] == FULL_SUMMARY_ROW

    assert [stage["visitors"] for stage in result["funnel"]] == [
        35,
        18,
        14,
        8,
        8,
        7,
        2,
    ]

    assert result["kpis"] == {
        # Unchanged definition: completions divided by answer clicks.
        "completion_to_selection_rate": 11.11,
        "results_view_rate": 100.0,
        "average_completed_steps_per_completion": 2.0,
        # New: completions per audit selection, and the later funnel steps.
        "completion_rate": 50.0,
        "registration_rate": 75.0,
        "path_selection_rate": 25.0,
    }


@pytest.mark.anyio
async def test_summary_queries_the_requested_period(monkeypatch):
    connection = FakeConnection(row=dict(FULL_SUMMARY_ROW))
    use_connection(monkeypatch, reporting, connection)

    await reporting.get_ownership_audit_summary(_=None, days=7)

    _, args = connection.calls[0]
    start_time, end_time = args[1], args[2]

    assert end_time - start_time == timedelta(days=7)


@pytest.mark.anyio
async def test_summary_still_works_for_rows_without_the_newer_columns(
    monkeypatch,
):
    old_row = {
        "total_events": 30,
        "answer_selections": 27,
        "validation_failures": 0,
        "completed_steps": 6,
        "completions": 3,
        "results_views": 3,
        "restarts": 0,
        "unique_completers": 3,
        "unique_results_viewers": 3,
    }
    use_connection(monkeypatch, reporting, FakeConnection(row=old_row))

    result = await reporting.get_ownership_audit_summary(_=None, days=30)

    assert result["kpis"]["completion_to_selection_rate"] == 11.11
    assert result["kpis"]["completion_rate"] == 0.0
    assert result["kpis"]["registration_rate"] == 0.0
    assert result["kpis"]["path_selection_rate"] == 0.0
    assert [stage["visitors"] for stage in result["funnel"]] == [
        0,
        0,
        0,
        3,
        3,
        0,
        0,
    ]


# --------------------------------------------------------------------------
# Reporting: /breakdown
# --------------------------------------------------------------------------


def breakdown_row(event_name, events, category=None, path=None, last_step=None):
    return {
        "event_name": event_name,
        "result_category": category,
        "path": path,
        "last_step": last_step,
        "events": events,
    }


@pytest.mark.anyio
async def test_breakdown_groups_categories_paths_and_closing_steps(
    monkeypatch,
):
    rows = [
        breakdown_row("ownership_audit.completed", 3, category="strong"),
        breakdown_row("ownership_audit.completed", 5, category="high_risk"),
        # No category recorded: counted nowhere.
        breakdown_row("ownership_audit.completed", 1),
        breakdown_row("ownership_audit.path_selected", 4, path="coffee"),
        breakdown_row("ownership_audit.path_selected", 1, path="mentor"),
        breakdown_row("get_quick_wins.closed", 6, last_step="intro"),
        breakdown_row("get_quick_wins.closed", 2, last_step="register"),
        # Rows for the same step add up.
        breakdown_row("get_quick_wins.closed", 1, last_step="intro"),
    ]
    connection = FakeConnection(rows=rows)
    use_connection(monkeypatch, reporting, connection)

    result = await reporting.get_ownership_audit_breakdown(_=None, days=30)

    assert result["period"]["days"] == 30
    assert result["result_categories"] == {"strong": 3, "high_risk": 5}
    assert result["paths_chosen"] == {"coffee": 4, "mentor": 1}
    assert result["closed_at_step"] == {"intro": 7, "register": 2}


@pytest.mark.anyio
async def test_breakdown_returns_empty_groups_when_there_are_no_events(
    monkeypatch,
):
    use_connection(monkeypatch, reporting, FakeConnection(rows=[]))

    result = await reporting.get_ownership_audit_breakdown(_=None, days=30)

    assert result["result_categories"] == {}
    assert result["paths_chosen"] == {}
    assert result["closed_at_step"] == {}


@pytest.mark.anyio
async def test_breakdown_queries_the_requested_period(monkeypatch):
    connection = FakeConnection(rows=[])
    use_connection(monkeypatch, reporting, connection)

    await reporting.get_ownership_audit_breakdown(_=None, days=14)

    _, args = connection.calls[0]

    assert args[2] - args[1] == timedelta(days=14)


@pytest.mark.anyio
async def test_breakdown_returns_503_when_the_database_fails(monkeypatch):
    @asynccontextmanager
    async def failing_get_connection():
        raise RuntimeError("database unavailable")
        yield  # pragma: no cover

    monkeypatch.setattr(reporting, "get_connection", failing_get_connection)

    with pytest.raises(HTTPException) as error:
        await reporting.get_ownership_audit_breakdown(_=None, days=30)

    assert error.value.status_code == 503


# --------------------------------------------------------------------------
# Reporting: /events
# --------------------------------------------------------------------------


def test_events_filter_accepts_every_event_the_service_accepts():
    assert reporting.SUPPORTED_EVENT_NAMES == set(EXPECTED_EVENT_TYPES)


@pytest.mark.anyio
@pytest.mark.parametrize(
    "event_name",
    [
        # These three were accepted by the service but missing from the filter.
        "ownership_audit.selected",
        "ownership_audit.started",
        "ownership_audit.back_to_paths",
        "ownership_audit.registration_completed",
        "ownership_audit.next_steps_viewed",
        "ownership_audit.path_selected",
        "get_quick_wins.opened",
        "get_quick_wins.closed",
    ],
)
async def test_events_endpoint_filters_by_every_supported_event_name(
    monkeypatch, event_name
):
    connection = FakeConnection(rows=[], total=7)
    use_connection(monkeypatch, reporting, connection)

    result = await reporting.list_ownership_audit_events(
        _=None,
        limit=10,
        offset=0,
        event_name=event_name,
    )

    assert result["total"] == 7
    assert result["items"] == []

    method, args = connection.calls[0]
    assert method == "fetchval"
    assert args[1:] == ("ownership_audit", event_name)


# --------------------------------------------------------------------------
# Contract with the web app's event map (apps/web/src/main.tsx)
#
# main.tsx only forwards events it finds in eventTypeByName, and this service
# rejects any event whose type differs from EXPECTED_EVENT_TYPES. These tests
# keep the two lists in step so a mismatch fails here instead of showing up as
# a dropped event or a 422 in the browser.
# --------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
MAIN_TSX = REPO_ROOT / "apps" / "web" / "src" / "main.tsx"

# Matches map entries such as:  "ownership_audit.completed": "feature_use",
EVENT_MAP_ENTRY = re.compile(
    r'^\s*"(?P<name>[a-z_]+\.[a-z_]+)":\s*'
    r'"(?P<type>click|feature_use|view)",\s*$',
    re.MULTILINE,
)

AUDIT_PREFIXES = ("ownership_audit.", "get_quick_wins.")


def read_frontend_event_types():
    assert MAIN_TSX.exists(), f"Could not find {MAIN_TSX}"

    source = MAIN_TSX.read_text(encoding="utf-8")

    return {
        match["name"]: match["type"]
        for match in EVENT_MAP_ENTRY.finditer(source)
    }


def frontend_audit_event_types():
    return {
        name: event_type
        for name, event_type in read_frontend_event_types().items()
        if name.startswith(AUDIT_PREFIXES)
    }


def test_the_event_map_in_main_tsx_can_be_read():
    # Guards the two contract tests below against passing on an empty map.
    assert len(read_frontend_event_types()) > 0
    assert len(frontend_audit_event_types()) > 0


def test_main_tsx_registers_every_event_this_service_accepts():
    missing = sorted(set(EXPECTED_EVENT_TYPES) - set(frontend_audit_event_types()))

    assert missing == [], (
        "These events are accepted by the analytics service but missing from "
        f"eventTypeByName in main.tsx, so the web app drops them: {missing}"
    )


def test_main_tsx_does_not_send_events_this_service_would_reject():
    unknown = sorted(set(frontend_audit_event_types()) - set(EXPECTED_EVENT_TYPES))

    assert unknown == [], (
        "These events are in eventTypeByName in main.tsx but not accepted by "
        f"the analytics service (it would answer 422): {unknown}"
    )


def test_main_tsx_uses_the_event_types_this_service_expects():
    mismatched = {
        name: {"main.tsx": event_type, "service": EXPECTED_EVENT_TYPES[name]}
        for name, event_type in frontend_audit_event_types().items()
        if name in EXPECTED_EVENT_TYPES
        and event_type != EXPECTED_EVENT_TYPES[name]
    }

    assert mismatched == {}, (
        "main.tsx and the analytics service disagree on the event type "
        f"(the service would answer 422): {mismatched}"
    )