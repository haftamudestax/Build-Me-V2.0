# The visitor funnel: saw the section, then got in touch by any channel.
FUNNEL_STAGES = [
    ("viewed", "unique_viewers"),
    ("contacted", "unique_contacters"),
]

# Ways to get in touch, with the totals key holding distinct visitors.
CHANNELS = [
    ("whatsapp", "unique_whatsapp_clickers"),
    ("call", "unique_call_clickers"),
    ("message", "unique_message_senders"),
]


def percentage(numerator: int, denominator: int | None) -> float:
    """Percentage rounded to 2 places, capped at 100 and 0 when undefined.

    Capped because each stage is counted independently: a visitor whose
    'viewed' event was lost can still contact you.
    """

    if not denominator:
        return 0.0

    return min(100.0, round(numerator / denominator * 100, 2))


def build_funnel(totals: dict) -> list[dict]:
    funnel: list[dict] = []
    first: int | None = None
    previous: int | None = None

    for stage, key in FUNNEL_STAGES:
        visitors = totals.get(key, 0)

        if first is None:
            first = visitors

        funnel.append(
            {
                "stage": stage,
                "visitors": visitors,
                "from_previous_pct": (
                    None if previous is None else percentage(visitors, previous)
                ),
                "from_first_pct": percentage(visitors, first),
            }
        )

        previous = visitors

    return funnel


def build_channels(totals: dict) -> list[dict]:
    """Visitors per channel, as a share of everyone who got in touch.

    A visitor who used two channels counts in both, so shares can add up to
    more than 100.
    """

    contacters = totals.get("unique_contacters", 0)

    return [
        {
            "channel": channel,
            "visitors": totals.get(key, 0),
            "share_of_contacts_pct": percentage(totals.get(key, 0), contacters),
        }
        for channel, key in CHANNELS
    ]


def build_kpis(totals: dict) -> dict:
    sent = totals.get("messages_sent", 0)
    failed = totals.get("message_failures", 0)
    invalid = totals.get("validation_failures", 0)

    return {
        # Visitors who got in touch, out of visitors who saw the section.
        "contact_rate": percentage(
            totals.get("unique_contacters", 0),
            totals.get("unique_viewers", 0),
        ),
        # Of the messages that passed validation, how many were delivered.
        "message_success_rate": percentage(sent, sent + failed),
        # Of all send attempts, how many stopped at a form error.
        "validation_failure_rate": percentage(invalid, invalid + sent + failed),
    }