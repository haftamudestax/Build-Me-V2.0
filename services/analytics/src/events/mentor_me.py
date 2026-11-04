from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


MentorMeEventName = Literal[
    "mentor_me.selected",
    "mentor_me.started",
    "mentor_me.validation_failed",
    "mentor_me.booking_submitted",
    "mentor_me.confirmation_viewed",
    "mentor_me.submission_failed",
    "mentor_me.back_to_paths",
]

MentorMeEventType = Literal["click", "feature_use", "view"]


class MentorMeEventIn(BaseModel):
    """Incoming Mentor Me analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: MentorMeEventName = Field(alias="eventName")
    event_type: MentorMeEventType = Field(alias="eventType")

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