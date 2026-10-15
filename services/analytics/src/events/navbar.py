
from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class NavbarEventName(StrEnum):
    LOGO_CLICK = "navbar.logo_click"
    NAV_LINK_CLICK = "navbar.nav_link_click"
    LOGO_VIEW = "navbar.logo_view"


class NavbarEventType(StrEnum):
    CLICK = "click"
    VIEW = "view"


class NavbarEventIn(BaseModel):
    visitor_id: UUID
    session_id: UUID | None = None

    event_name: NavbarEventName
    event_type: NavbarEventType

    source_route: str = Field(min_length=1, max_length=2048)
    destination_route: str = Field(min_length=1, max_length=2048)

    navigation_success: bool | None = None
    device_type: str | None = None
    viewport_type: str | None = None

    occurred_at: datetime | None = None
