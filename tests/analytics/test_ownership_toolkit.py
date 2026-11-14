import re
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from typing import get_args
from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.events.ownership_toolkit import OwnershipToolkitEventIn
from src.processing.ownership_toolkit import (
    EXPECTED_EVENT_TYPES,
    TOOL_ID_PATTERN,
    process_ownership_toolkit_event,
)
from src.reporting import ownership_toolkit as reporting
from src.tracking import ownership_toolkit as tracking

ALL_EVENT_TYPES = ("click", "feature_use", "view")

WRONG_TYPE_CASES = [
    (name, wrong_type)
    for name, correct_type in EXPECTED_EVENT_TYPES.items()
    for wrong_type in ALL_EVENT_TYPES
    if wrong_type != correct_type
]


def make_event(
    name,
    event_type,
    metadata=None,
    route="/",
    destination_route=None,
    timestamp=None,
):
    payload = {
        "visitorId": str(uuid4()),
        "sessionId": str(uuid4()),
        "eventName": name,
        "eventType": event_type,
        "sourceRoute": route,
        "metadata": metadata or {},
    }

    if destination_route is not None:
        payload["destinationRoute"] = destination_route

    if timestamp is not None:
        payload["timestamp"] = timestamp

    return OwnershipToolkitEventIn.model_validate(payload)


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


@pytest.mark.parametrize(("name", "event_type"), EXPECTED_EVENT_TYPES.items())
def test_accepts_every_toolkit_event_under_the_toolkit_journey(name, event_type):
    processed = process_ownership_toolkit_event(make_event(name, event_type))

    assert processed["event_name"] == name
    assert processed["event_type"] == event_type
    assert processed["feature"] == "ownership_toolkit"
    assert processed["journey"] == "ownership_toolkit"


def test_every_schema_event_has_an_expected_type():
    annotation = OwnershipToolkitEventIn.model_fields["event_name"].annotation

    assert set(get_args(annotation)) == set(EXPECTED_EVENT_TYPES)


@pytest.mark.parametrize(("name", "wrong_type"), WRONG_TYPE_CASES)
def test_rejects_every_wrong_type_for_each_event(name, wrong_type):
    with pytest.raises(HTTPException) as error:
        process_ownership_toolkit_event(make_event(name, wrong_type))

    assert error.value.status_code == 422


@pytest.mark.parametrize(
    "name",
    [
        "ownership_toolkit.nope",
        "ownership_audit.selected",
        "get_quick_wins.opened",
        "",
    ],
)
def test_schema_rejects_events_that_are_not_toolkit_events(name):
    with pytest.raises(ValidationError):
        make_event(name, "click")


def test_schema_rejects_unexpected_payload_fields():
    with pytest.raises(ValidationError):
        OwnershipToolkitEventIn.model_validate(
            {
                "visitorId": str(uuid4()),
                "eventName": "ownership_toolkit.selected",
                "eventType": "click",
                "sourceRoute": "/",
                "email": "visitor@example.com",
            }
        )


def test_does_not_trust_the_client_feature_or_journey():
    event = OwnershipToolkitEventIn.model_validate(
        {
            "visitorId": str(uuid4()),
            "eventName": "ownership_toolkit.selected",
            "eventType": "click",
            "sourceRoute": "/",
            "feature": "hero",
            "journey": "delivery_project",
        }
    )

    processed = process_ownership_toolkit_event(event)

    assert processed["feature"] == "ownership_toolkit"
    assert processed["journey"] == "ownership_toolkit"


def test_keeps_approved_metadata_and_drops_personal_data():
    processed = process_ownership_toolkit_event(
        make_event(
            "ownership_toolkit.tool_opened",
            "click",
            {
                "toolId": "backups",
                "part": 3,
                "name": "Alex Tester",
                "email": "alex@example.com",
                "organisation": "Example Ltd",
                "fields": ["name", "email"],
            },
        )
    )

    assert processed["metadata"]["toolId"] == "backups"
    assert processed["metadata"]["part"] == 3

    for dropped in ("name", "email", "organisation", "fields"):
        assert dropped not in processed["metadata"]


def test_keeps_the_step_numbers_on_step_events():
    processed = process_ownership_toolkit_event(
        make_event(
            "ownership_toolkit.step_completed",
            "feature_use",
            {"completedStep": 2, "nextStep": 3},
        )
    )

    assert processed["metadata"]["completedStep"] == 2
    assert processed["metadata"]["nextStep"] == 3


@pytest.mark.parametrize(
    "tool_id",
    ["Domain", "domain!", "1domain", "", "a" * 41, "has space", 5, None.__class__],
)
def test_rejects_an_invalid_tool_id(tool_id):
    with pytest.raises(HTTPException) as error:
        process_ownership_toolkit_event(
            make_event("ownership_toolkit.tool_opened", "click", {"toolId": tool_id})
        )

    assert error.value.status_code == 422


@pytest.mark.parametrize(
    "field",
    ["step", "completedStep", "nextStep", "part"],
)
@pytest.mark.parametrize("value", [0, -1, "2", True, 1.5])
def test_rejects_invalid_numbers_in_metadata(field, value):
    with pytest.raises(HTTPException) as error:
        process_ownership_toolkit_event(
            make_event(
                "ownership_toolkit.step_completed",
                "feature_use",
                {field: value},
            )
        )

    assert error.value.status_code == 422


@pytest.mark.parametrize(
    "route",
    ["https://example.com", "//example.com", "   ", "relative/path"],
)
def test_rejects_a_source_route_that_is_not_a_local_path(route):
    with pytest.raises(HTTPException) as error:
        process_ownership_toolkit_event(
            make_event("ownership_toolkit.selected", "click", route=route)
        )

    assert error.value.status_code == 422


def test_rejects_a_timestamp_without_a_timezone():
    with pytest.raises(HTTPException) as error:
        process_ownership_toolkit_event(
            make_event(
                "ownership_toolkit.selected",
                "click",
                timestamp="2026-11-03T10:00:00",
            )
        )

    assert error.value.status_code == 422


def test_adds_the_routes_to_the_metadata():
    processed = process_ownership_toolkit_event(
        make_event(
            "ownership_toolkit.selected",
            "click",
            route="/",
            destination_route="/toolkit",
        )
    )

    assert processed["metadata"]["source_route"] == "/"
    assert processed["metadata"]["destination_route"] == "/toolkit"


# --------------------------------------------------------------------------
# Persistence
# --------------------------------------------------------------------------


@pytest.mark.anyio
async def test_persists_a_toolkit_event_under_the_toolkit_journey(monkeypatch):
    captured = {}

    async def mock_validate(connection, visitor_id, session_id):
        return True

    async def mock_insert(connection, **kwargs):
        captured.update(kwargs)
        return {"id": 1, **kwargs}

    use_connection(monkeypatch, tracking, FakeConnection())
    monkeypatch.setattr(tracking, "validate_visitor_session", mock_validate)
    monkeypatch.setattr(tracking, "insert_event", mock_insert)

    record = await tracking.persist_ownership_toolkit_event(
        make_event(
            "ownership_toolkit.pdf_downloaded",
            "click",
            {"email": "visitor@example.com"},
        )
    )

    assert record["id"] == 1
    assert captured["event_name"] == "ownership_toolkit.pdf_downloaded"
    assert captured["feature"] == "ownership_toolkit"
    assert captured["journey"] == "ownership_toolkit"
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
        await tracking.persist_ownership_toolkit_event(
            make_event("ownership_toolkit.selected", "click")
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
    assert [stage["stage"] for stage in reporting._build_funnel({})] == [
        "selected_toolkit",
        "registered",
        "viewed_content",
        "opened_a_tool",
        "downloaded_pdf",
    ]


def test_funnel_calculates_conversion_from_previous_and_first_stage():
    funnel = reporting._build_funnel(
        {
            "unique_selectors": 100,
            "unique_registrants": 50,
            "unique_viewers": 40,
            "unique_tool_openers": 20,
            "unique_downloaders": 10,
        }
    )

    assert [
        (stage["visitors"], stage["from_previous_pct"], stage["from_first_pct"])
        for stage in funnel
    ] == [
        (100, None, 100.0),
        (50, 50.0, 50.0),
        (40, 80.0, 40.0),
        (20, 50.0, 20.0),
        (10, 50.0, 10.0),
    ]


def test_funnel_treats_missing_totals_as_zero():
    funnel = reporting._build_funnel({})

    assert all(stage["visitors"] == 0 for stage in funnel)
    assert funnel[0]["from_previous_pct"] is None
    assert all(stage["from_previous_pct"] == 0.0 for stage in funnel[1:])


# --------------------------------------------------------------------------
# Reporting: /summary, /breakdown and /events
# --------------------------------------------------------------------------

FULL_SUMMARY_ROW = {
    "total_events": 300,
    "selections": 25,
    "starts": 20,
    "validation_failures": 4,
    "registrations": 15,
    "content_views": 12,
    "tool_opens": 30,
    "pdf_downloads": 6,
    "back_to_paths": 3,
    "unique_selectors": 20,
    "unique_registrants": 10,
    "unique_viewers": 8,
    "unique_tool_openers": 4,
    "unique_downloaders": 2,
}


@pytest.mark.anyio
async def test_summary_includes_the_funnel_and_rates(monkeypatch):
    use_connection(
        monkeypatch, reporting, FakeConnection(row=dict(FULL_SUMMARY_ROW))
    )

    result = await reporting.get_ownership_toolkit_summary(_=None, days=30)

    assert result["feature"] == "ownership_toolkit"
    assert result["journey"] == "ownership_toolkit"
    assert result["period"]["days"] == 30
    assert result["totals"] == FULL_SUMMARY_ROW
    assert [stage["visitors"] for stage in result["funnel"]] == [
        20,
        10,
        8,
        4,
        2,
    ]
    assert result["kpis"] == {
        "registration_rate": 75.0,  # 15 registrations of 20 starts
        "download_rate": 50.0,  # 6 downloads of 12 content views
        "average_tools_opened_per_view": 2.5,  # 30 opens over 12 views
    }


@pytest.mark.anyio
async def test_summary_handles_zero_events(monkeypatch):
    use_connection(monkeypatch, reporting, FakeConnection(row={"total_events": 0}))

    result = await reporting.get_ownership_toolkit_summary(_=None, days=30)

    assert result["kpis"] == {
        "registration_rate": 0.0,
        "download_rate": 0.0,
        "average_tools_opened_per_view": 0.0,
    }
    assert all(stage["visitors"] == 0 for stage in result["funnel"])


@pytest.mark.anyio
async def test_summary_queries_the_requested_period(monkeypatch):
    connection = FakeConnection(row=dict(FULL_SUMMARY_ROW))
    use_connection(monkeypatch, reporting, connection)

    await reporting.get_ownership_toolkit_summary(_=None, days=7)

    _, args = connection.calls[0]

    assert args[2] - args[1] == timedelta(days=7)


@pytest.mark.anyio
async def test_summary_returns_503_when_the_database_fails(monkeypatch):
    @asynccontextmanager
    async def failing_get_connection():
        raise RuntimeError("database unavailable")
        yield  # pragma: no cover

    monkeypatch.setattr(reporting, "get_connection", failing_get_connection)

    with pytest.raises(HTTPException) as error:
        await reporting.get_ownership_toolkit_summary(_=None, days=30)

    assert error.value.status_code == 503


@pytest.mark.anyio
async def test_breakdown_groups_opens_by_tool_and_part(monkeypatch):
    rows = [
        {"tool_id": "domain", "part": "1", "opens": 3},
        {"tool_id": "domain", "part": "1", "opens": 2},
        {"tool_id": "backups", "part": "3", "opens": 4},
        # No tool recorded: counted under its part only.
        {"tool_id": None, "part": "2", "opens": 1},
    ]
    use_connection(monkeypatch, reporting, FakeConnection(rows=rows))

    result = await reporting.get_ownership_toolkit_breakdown(_=None, days=30)

    assert result["tools_opened"] == {"domain": 5, "backups": 4}
    assert result["parts_opened"] == {"1": 5, "3": 4, "2": 1}


@pytest.mark.anyio
async def test_breakdown_returns_empty_groups_when_there_are_no_events(
    monkeypatch,
):
    use_connection(monkeypatch, reporting, FakeConnection(rows=[]))

    result = await reporting.get_ownership_toolkit_breakdown(_=None, days=30)

    assert result["tools_opened"] == {}
    assert result["parts_opened"] == {}


def test_events_filter_accepts_every_event_the_service_accepts():
    assert reporting.SUPPORTED_EVENT_NAMES == set(EXPECTED_EVENT_TYPES)


@pytest.mark.anyio
@pytest.mark.parametrize("event_name", sorted(EXPECTED_EVENT_TYPES))
async def test_events_endpoint_filters_by_every_supported_event_name(
    monkeypatch, event_name
):
    connection = FakeConnection(rows=[], total=7)
    use_connection(monkeypatch, reporting, connection)

    result = await reporting.list_ownership_toolkit_events(
        _=None,
        limit=10,
        offset=0,
        event_name=event_name,
    )

    assert result["total"] == 7
    assert result["items"] == []

    method, args = connection.calls[0]
    assert method == "fetchval"
    assert args[1:] == ("ownership_toolkit", event_name)


@pytest.mark.anyio
async def test_events_endpoint_rejects_an_event_from_another_journey(
    monkeypatch,
):
    use_connection(monkeypatch, reporting, FakeConnection())

    with pytest.raises(HTTPException) as error:
        await reporting.list_ownership_toolkit_events(
            _=None,
            limit=10,
            offset=0,
            event_name="ownership_audit.selected",
        )

    assert error.value.status_code == 422


# --------------------------------------------------------------------------
# Contract with the web app (apps/web)
#
# main.tsx only forwards events it finds in eventTypeByName, and this service
# rejects an event whose type differs from EXPECTED_EVENT_TYPES. These tests
# keep the two in step, and check the toolkit's tool ids against this
# service's validation.
# --------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
MAIN_TSX = REPO_ROOT / "apps" / "web" / "src" / "main.tsx"
TOOLKIT_CONTENT = (
    REPO_ROOT
    / "apps"
    / "web"
    / "src"
    / "components"
    / "GetQuickWins"
    / "toolkit"
    / "toolkitContent.ts"
)

EVENT_MAP_ENTRY = re.compile(
    r'^\s*"(?P<name>[a-z_]+\.[a-z_]+)":\s*'
    r'"(?P<type>click|feature_use|view)",\s*$',
    re.MULTILINE,
)

TOOLKIT_PREFIX = "ownership_toolkit."


def read_text(path: Path) -> str:
    assert path.exists(), f"Could not find {path}"

    return path.read_text(encoding="utf-8")


def frontend_toolkit_event_types():
    return {
        match["name"]: match["type"]
        for match in EVENT_MAP_ENTRY.finditer(read_text(MAIN_TSX))
        if match["name"].startswith(TOOLKIT_PREFIX)
    }


def test_the_toolkit_events_in_main_tsx_can_be_read():
    # Guards the contract tests below against passing on an empty map.
    assert len(frontend_toolkit_event_types()) > 0


def test_main_tsx_registers_every_event_this_service_accepts():
    missing = sorted(set(EXPECTED_EVENT_TYPES) - set(frontend_toolkit_event_types()))

    assert missing == [], (
        "These events are accepted by the analytics service but missing from "
        f"eventTypeByName in main.tsx, so the web app drops them: {missing}"
    )


def test_main_tsx_does_not_send_events_this_service_would_reject():
    unknown = sorted(set(frontend_toolkit_event_types()) - set(EXPECTED_EVENT_TYPES))

    assert unknown == [], (
        "These events are in eventTypeByName in main.tsx but not accepted by "
        f"the analytics service (it would answer 422): {unknown}"
    )


def test_main_tsx_uses_the_event_types_this_service_expects():
    mismatched = {
        name: {"main.tsx": event_type, "service": EXPECTED_EVENT_TYPES[name]}
        for name, event_type in frontend_toolkit_event_types().items()
        if name in EXPECTED_EVENT_TYPES
        and event_type != EXPECTED_EVENT_TYPES[name]
    }

    assert mismatched == {}, (
        "main.tsx and the analytics service disagree on the event type "
        f"(the service would answer 422): {mismatched}"
    )


def test_main_tsx_derives_the_toolkit_feature_from_the_event_name():
    assert 'startsWith("ownership_toolkit.")' in read_text(MAIN_TSX)


def test_every_toolkit_id_passes_this_services_validation():
    ids = re.findall(r'^\s*id:\s*"([^"]+)"', read_text(TOOLKIT_CONTENT), re.MULTILINE)

    # Three parts and nine tools.
    assert len(ids) == 12

    for tool_or_part_id in ids:
        assert TOOL_ID_PATTERN.match(tool_or_part_id), tool_or_part_id
