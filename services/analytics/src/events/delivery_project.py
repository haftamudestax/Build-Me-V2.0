
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

DeliveryProjectEventName = Literal[
    "work_with_me.cta_clicked",
    "work_with_me.opened",
    "work_with_me.closed",
    "work_with_me.reference_copied",
    "delivery_project.selected",
    "delivery_project.started",
    "delivery_project.validation_failed",
    "delivery_project.booking_submitted",
    "delivery_project.confirmation_viewed",
    "delivery_project.submission_failed",
    "delivery_project.back_to_paths",
]

DeliveryProjectEventType = Literal["click", "feature_use", "view"]


class DeliveryProjectEventIn(BaseModel):
    """Incoming Work With Me and Delivery Project analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: DeliveryProjectEventName = Field(alias="eventName")
    event_type: DeliveryProjectEventType = Field(alias="eventType")

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
