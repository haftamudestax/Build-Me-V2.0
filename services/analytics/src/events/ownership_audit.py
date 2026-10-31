from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


OwnershipAuditEventName = Literal[
    "ownership_audit.selected",
    "ownership_audit.started",
    "ownership_audit.answer_selected",
    "ownership_audit.validation_failed",
    "ownership_audit.step_completed",
    "ownership_audit.completed",
    "ownership_audit.results_viewed",
    "ownership_audit.restarted",
    "ownership_audit.back_to_paths",
]

OwnershipAuditEventType = Literal[
    "click",
    "feature_use",
    "view",
]


class OwnershipAuditEventIn(BaseModel):
    """Incoming Technology Ownership Audit analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: OwnershipAuditEventName = Field(alias="eventName")
    event_type: OwnershipAuditEventType = Field(alias="eventType")

    source_route: str = Field(
        alias="sourceRoute",
        min_length=1,
        max_length=2048,
    )
    destination_route: str | None = Field(
        default=None,
        alias="destinationRoute",
        max_length=2048,
    )

    timestamp: datetime | None = None
    metadata: dict = Field(default_factory=dict)

    # Accepted for compatibility, but not trusted for persistence.
    feature: str | None = None
    journey: str | None = None