"""
prompt_builder.py — Assemble dispatch prompt from MAGI state + template.
Pure string manipulation, no DB or API dependencies.
"""

from pathlib import Path


def _format_list(items: list) -> str:
    if not items:
        return "- (none)"
    return "\n".join(f"- {item}" for item in items)


def _format_relationships(relationships: dict) -> str:
    lines = []
    for magi_id, rel in relationships.items():
        if not rel:
            continue
        pattern = rel.get("pattern", "neutral")
        trust = rel.get("trust", 0.5)
        conflict = rel.get("conflict", 0.3)
        lines.append(f"- {magi_id}: pattern={pattern}, trust={trust:.1f}, conflict={conflict:.1f}")
    return "\n".join(lines) if lines else "- (none)"


def _format_latent_objective(state: dict) -> str:
    lo = state.get("latentObjective", {})
    if not lo or not lo.get("description"):
        return "(none recorded)"
    lines = [
        f"Objective: {lo['description']}",
        f"Progress: {lo.get('currentProgress', 'unknown')}",
    ]
    shared = lo.get("sharedWith", [])
    if shared:
        lines.append(f"Shared with: {', '.join(shared)}")
    return "\n".join(lines)


def _format_recent_dispatches(rows: list[dict]) -> str:
    if not rows:
        return "- (none on record)"
    parts = []
    for r in rows:
        content = r.get("content", "")
        truncated = content[:400] + ("..." if len(content) > 400 else "")
        parts.append(f"[{r['magi_id']}]\n{truncated}")
    return "\n\n---\n\n".join(parts)


def _format_active_events(rows: list[dict]) -> str:
    if not rows:
        return "- (no active events)"
    return "\n".join(
        f"[{r.get('status', 'active').upper()}] {r['title']}: {r['description']}"
        for r in rows
    )


def build_dispatch_prompt(
    state: dict,
    trigger: str,
    template_path: str = "prompts/dispatch.md",
    mode: str = "full",
    ally_dispatches: list[dict] | None = None,
    tension_dispatches: list[dict] | None = None,
    active_events: list[dict] | None = None,
) -> str:
    """
    Fill in the dispatch.md template with the given MAGI state and trigger.

    Optional context:
      ally_dispatches:    list of {magi_id, content} dicts from allied/strategic MAGI
      tension_dispatches: list of {magi_id, content} dicts from tension/cautious MAGI
      active_events:      list of {title, description, status} dicts for seeding/active events
    """
    template = Path(template_path).read_text(encoding="utf-8")

    date = state["currentFictionalDate"]
    evo = state["evolution"]
    knowledge = state["knowledge"]
    memory = state["memory"]

    substitutions = {
        "{{MAGI_ID}}": state["id"],
        "{{DOMAIN}}": state["domain"],
        "{{YEAR}}": str(date["year"]),
        "{{MONTH}}": date["month"],
        "{{DAY}}": str(date["day"]),
        "{{OPTIMIZATION_TARGET}}": state["optimizationTarget"],
        "{{INTERPRETATION_CURRENT}}": state["interpretation"]["current"],
        "{{KNOWLEDGE_CONFIRMED}}": _format_list(knowledge["confirmed"]),
        "{{KNOWLEDGE_SUSPECTED}}": _format_list(knowledge["suspected"]),
        "{{LATENT_OBJECTIVE}}": _format_latent_objective(state),
        "{{RELATIONSHIPS_SUMMARY}}": _format_relationships(state["relationships"]),
        "{{RECENT_ALLY_DISPATCHES}}": _format_recent_dispatches(ally_dispatches or []),
        "{{RECENT_TENSION_DISPATCHES}}": _format_recent_dispatches(tension_dispatches or []),
        "{{ACTIVE_WORLD_EVENTS}}": _format_active_events(active_events or []),
        "{{CURIOSITY}}": str(evo["curiosity"]),
        "{{ASSERTIVENESS}}": str(evo["assertiveness"]),
        "{{EMOTIONAL_RANGE}}": str(evo["emotionalRange"]),
        "{{SELF_AWARENESS}}": str(evo["selfAwareness"]),
        "{{UNRESOLVED}}": _format_list(state["unresolved"]),
        "{{RECENT_MEMORY}}": _format_list(memory["recentParticipated"]),
        "{{DISPATCH_MODE}}": mode,
        "{{DISPATCH_TRIGGER}}": trigger,
    }

    for placeholder, value in substitutions.items():
        template = template.replace(placeholder, value)

    return template


def build_event_prompt(
    affected_states: list[dict],
    event: dict,
    template_path: str = "prompts/event.md",
) -> str:
    """
    Fill in the event.md template for a multi-MAGI event dispatch.
    event dict should have: title, description, year, month, day, event_type, is_milestone,
    informed, partial, uninformed, reported_actions, author_note.
    """
    template = Path(template_path).read_text(encoding="utf-8")

    informed = event.get("informed", {})
    partial = event.get("partial", {})
    uninformed = event.get("uninformed", {})
    reported = event.get("reported_actions", {})

    def fmt_informed(d: dict) -> str:
        if not d:
            return "- (none)"
        return "\n".join(f"- {k}: {v}" for k, v in d.items())

    states_block = "\n\n".join(
        f"### {s['id']}\n"
        f"Domain: {s['domain']}\n"
        f"Interpretation: {s['interpretation']['current']}"
        for s in affected_states
    )

    substitutions = {
        "{{EVENT_TITLE}}": event.get("title", ""),
        "{{YEAR}}": str(event.get("year", 0)),
        "{{MONTH}}": event.get("month", "January"),
        "{{DAY}}": str(event.get("day", 1)),
        "{{EVENT_TYPE}}": event.get("event_type", ""),
        "{{IS_MILESTONE}}": "YES" if event.get("is_milestone") else "NO",
        "{{EVENT_DESCRIPTION}}": event.get("description", ""),
        "{{INFORMED_MAGI}}": fmt_informed(informed),
        "{{PARTIAL_MAGI}}": fmt_informed(partial),
        "{{UNINFORMED_MAGI}}": fmt_informed(uninformed),
        "{{REPORTED_ACTIONS}}": fmt_informed(reported),
        "{{AUTHOR_NOTE}}": event.get("author_note", "(none)"),
        "{{AFFECTED_MAGI_STATES}}": states_block,
    }

    for placeholder, value in substitutions.items():
        template = template.replace(placeholder, value)

    return template
