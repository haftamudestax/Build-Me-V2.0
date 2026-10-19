
from src.events.hero import HeroEventIn


def process_hero_event(event: HeroEventIn) -> dict:
    """Normalize a Hero visibility or page-view event."""

    component = (
        "hero"
        if event.event_name == "hero.viewed"
        else "page"
    )

    return {
        "visitor_id": event.visitor_id,
        "session_id": event.session_id,
        "event_name": event.event_name,
        "event_type": event.event_type,
        "feature": component,
        "journey": None,
        "timestamp": event.timestamp,
        "metadata": {
            **event.metadata,
            "component": component,
        },
    }
