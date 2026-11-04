from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


OwnershipToolkitEventName = Literal[
    "ownership_toolkit.selected",
    "ownership_toolkit.started",
    "ownership_toolkit.step_completed",
    "ownership_toolkit.validation_failed",
    "ownership_toolkit.registration_completed",
    "ownership_toolkit.content_viewed",
    "ownership_toolkit.tool_opened",
    "ownership_toolkit.pdf_downloaded",
    "ownership_toolkit.back_to_paths",
]

OwnershipToolkitEventType = Literal[
    "click",
    "feature_use",
    "view",
]


class OwnershipToolkitEventIn(BaseModel):
    """Incoming Technology Ownership Toolkit analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: OwnershipToolkitEventName = Field(alias="eventName")
    event_type: OwnershipToolkitEventType = Field(alias="eventType")

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
