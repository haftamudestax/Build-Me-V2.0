
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HeroEventIn(BaseModel):
    """Incoming Hero visibility and page-view analytics event."""

    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    visitor_id: UUID = Field(alias="visitorId")
    session_id: UUID | None = Field(default=None, alias="sessionId")

    event_name: Literal["hero.viewed", "page.viewed"] = Field(
        alias="eventName"
    )
    event_type: Literal["view"] = Field(alias="eventType")

    source_route: str = Field(
        alias="sourceRoute",
        min_length=1,
        max_length=2048,
    )

    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    metadata: dict = Field(default_factory=dict)
