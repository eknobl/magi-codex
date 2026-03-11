"""
state_manager.py — MAGI CODEX DB access layer
Reads and writes MAGI state from PostgreSQL using psycopg2.
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
load_dotenv()


def get_connection():
    url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not url:
        raise EnvironmentError("DATABASE_URL or POSTGRES_URL not set")
    return psycopg2.connect(url)


def get_magi_state(magi_id: str) -> dict | None:
    """Fetch the full state JSON for a single MAGI."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT state FROM magi_states WHERE id = %s",
                (magi_id.upper(),)
            )
            row = cur.fetchone()
            return dict(row["state"]) if row else None


def get_all_magi_states() -> list[dict]:
    """Fetch all 12 MAGI states ordered by ID."""
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT state FROM magi_states ORDER BY id")
            return [dict(row["state"]) for row in cur.fetchall()]


def save_dispatch(
    magi_id: str,
    content: str,
    prompt_used: str,
    tokens_used: int,
    state: dict,
) -> None:
    """Save a generated dispatch fragment to the dispatches table."""
    date = state["currentFictionalDate"]
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO dispatches
                  (magi_id, fictional_year, fictional_month, fictional_day,
                   content, prompt_used, tokens_used)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    magi_id.upper(),
                    date["year"],
                    date["month"],
                    date["day"],
                    content,
                    prompt_used,
                    tokens_used,
                )
            )
        conn.commit()


def update_magi_state(magi_id: str, updates: dict) -> None:
    """
    Merge partial updates into the existing MAGI state JSONB blob.
    Only top-level keys in `updates` are merged; nested objects are replaced.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE magi_states
                SET state = state || %s::jsonb,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (json.dumps(updates), magi_id.upper())
            )
        conn.commit()


def advance_magi_date(magi_id: str, year: int, month: str, day: int) -> None:
    """Update the magi_states date columns and the nested state date."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            date_update = json.dumps({
                "currentFictionalDate": {"year": year, "month": month, "day": day}
            })
            cur.execute(
                """
                UPDATE magi_states
                SET fictional_year = %s,
                    fictional_month = %s,
                    fictional_day = %s,
                    state = state || %s::jsonb,
                    updated_at = NOW()
                WHERE id = %s
                """,
                (year, month, day, date_update, magi_id.upper())
            )
        conn.commit()
