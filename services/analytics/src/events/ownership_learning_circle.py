from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


OwnershipLearningCircleEventName = Literal[
    "ownership_learning_circle.selected",
    "ownership_learning_circle.started",
    "ownership_learning_circle.explanation_viewed",
    "ownership_learning_circle.join_clicked",
    "ownership_learning_circle.telegram_opened",
    "ownership_learning_circle.back_to_paths",
]

OwnershipLearningCircleEventType = Literal[
    "click",
    "feature_use",
    "view",
]


class OwnershipLearningCircleEventIn(BaseModel):
    """Incoming Technology Ownership Learning Circle analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: OwnershipLearningCircleEventName = Field(alias="eventName")
    event_type: OwnershipLearningCircleEventType = Field(alias="eventType")

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