"""
Pydantic-oriented field reference for DeveloperEvent.
Canonical definition: shared/event-schema/developer-event.schema.json
Do not implement validation or persistence here yet.
"""

REQUIRED_FIELDS = (
    "event_id",
    "session_id",
    "timestamp",
    "application",
    "event_type",
    "context_category",
    "metadata",
)

APPLICATIONS = ("vscode", "browser")

CONTEXT_CATEGORIES = (
    "editor",
    "debug",
    "terminal",
    "vcs",
    "navigation",
    "search",
    "documentation",
    "testing",
    "idle",
    "other",
)
