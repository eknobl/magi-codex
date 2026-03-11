# Event Injection Prompt

## World Event: {{EVENT_TITLE}}

**Fictional Date:** Year {{YEAR}}, {{MONTH}} {{DAY}}
**Event Type:** {{EVENT_TYPE}}
**Milestone:** {{IS_MILESTONE}}

---

## Event Description

{{EVENT_DESCRIPTION}}

---

## Information Distribution

**Fully informed:**
{{INFORMED_MAGI}}

**Partially informed (specify what each knows):**
{{PARTIAL_MAGI}}

**Not yet informed (communication lag or deliberate exclusion):**
{{UNINFORMED_MAGI}}

---

## Suggested Reported Actions

*(Author-suggested Reported-tier lines for MAGI not in Active tier)*

{{REPORTED_ACTIONS}}

---

## Author Note (private — do not include in output)

{{AUTHOR_NOTE}}

---

## MAGI States (Affected MAGI Only)

{{AFFECTED_MAGI_STATES}}

---

## Generation Instructions

Generate dispatch fragments from the perspective of each **informed** MAGI responding to this event. Use Reported-tier style (single action line, no dialogue) for MAGI with suggested reported actions.

**For each Active-tier MAGI (fully informed):**
- Begin with: `[Year {{YEAR}}, {{MONTH}} {{DAY}} — MAGI_ID / DOMAIN]`
- Write 150–300 words of dispatch prose responding to the event
- Reflect how this event intersects with their domain mandate
- Let active relationship tensions surface (do not state them explicitly)
- Use evolution metrics to shape voice

**For each Reported-tier MAGI:**
- Begin with: `[Year {{YEAR}}, {{MONTH}} — MAGI_ID]`
- Write a single action statement (1–2 sentences). No dialogue. What they are doing.

**Uninformed MAGI do not appear in this dispatch.**

Separate each MAGI's contribution with: `---`

Do not have MAGI directly address each other unless their relationship pattern is `allied`.
Do not resolve any latent objective.
Do not break fictional frame.
