from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


CoffeeWithMeEventName = Literal[
    "coffee_with_me.selected",
    "coffee_with_me.started",
    "coffee_with_me.validation_failed",
    "coffee_with_me.booking_submitted",
    "coffee_with_me.confirmation_viewed",
    "coffee_with_me.submission_failed",
]

CoffeeWithMeEventType = Literal["click", "feature_use", "view"]


class CoffeeWithMeEventIn(BaseModel):
    """Incoming Coffee With Me analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: CoffeeWithMeEventName = Field(alias="eventName")
    event_type: CoffeeWithMeEventType = Field(alias="eventType")

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