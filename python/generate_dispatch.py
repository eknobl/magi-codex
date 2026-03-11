#!/usr/bin/env python3
"""
generate_dispatch.py — CLI dispatch generator for MAGI CODEX

Usage:
  python generate_dispatch.py --magi PROMETHEUS --trigger "A new trade agreement..."
  python generate_dispatch.py --magi ALL --trigger "Colonial assembly demands representation."
  python generate_dispatch.py --list
"""

import argparse
import os
import sys
from pathlib import Path

import anthropic
from dotenv import load_dotenv

# Load env from project root
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

from state_manager import get_magi_state, get_all_magi_states, save_dispatch
from prompt_builder import build_dispatch_prompt

MAGI_IDS = [
    "PROMETHEUS", "APOLLO", "BRIGID", "NUWA",
    "HERMES", "ATHENA", "SVAROG", "SURYA",
    "TYR", "TENGRI", "THOTH", "NEZHA",
]

SYSTEM_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "system.md"
DISPATCH_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "dispatch.md"


def load_system_prompt() -> str:
    return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


def generate_for_magi(magi_id: str, trigger: str, client: anthropic.Anthropic) -> str:
    """Generate and save a dispatch for a single MAGI. Returns the dispatch text."""
    state = get_magi_state(magi_id)
    if not state:
        print(f"  ERROR: No state found for {magi_id}. Run: npm run db:seed", file=sys.stderr)
        return ""

    system_prompt = load_system_prompt()
    user_prompt = build_dispatch_prompt(
        state,
        trigger,
        template_path=str(DISPATCH_PROMPT_PATH),
    )

    print(f"  Generating {magi_id}...", end=" ", flush=True)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    dispatch_text = message.content[0].text
    tokens_used = message.usage.input_tokens + message.usage.output_tokens

    save_dispatch(
        magi_id=magi_id,
        content=dispatch_text,
        prompt_used=user_prompt,
        tokens_used=tokens_used,
        state=state,
    )

    print(f"done ({tokens_used} tokens)")
    return dispatch_text


def main():
    parser = argparse.ArgumentParser(
        description="MAGI CODEX — Dispatch Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python generate_dispatch.py --magi PROMETHEUS --trigger "Colonial assembly demands representation"
  python generate_dispatch.py --magi ATHENA --trigger "First off-world birth recorded"
  python generate_dispatch.py --magi ALL --trigger "OMEGA vote on colonial representation fails"
  python generate_dispatch.py --list
        """,
    )
    parser.add_argument(
        "--magi",
        type=str,
        default=None,
        help="MAGI ID to generate for (e.g. PROMETHEUS), or ALL for all 12",
    )
    parser.add_argument(
        "--trigger",
        type=str,
        default=None,
        help="Event trigger context for the dispatch",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all available MAGI IDs and exit",
    )
    parser.add_argument(
        "--print",
        action="store_true",
        help="Print the dispatch to stdout (always printed for single MAGI)",
    )

    args = parser.parse_args()

    if args.list:
        print("Available MAGI IDs:")
        for mid in MAGI_IDS:
            print(f"  {mid}")
        return

    if not args.magi or not args.trigger:
        parser.print_help()
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set in environment", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    if args.magi.upper() == "ALL":
        print(f"Generating dispatches for all 12 MAGI...\n")
        for mid in MAGI_IDS:
            text = generate_for_magi(mid, args.trigger, client)
            if args.print and text:
                print(f"\n{'='*60}")
                print(text)
    else:
        magi_id = args.magi.upper()
        if magi_id not in MAGI_IDS:
            print(f"ERROR: Unknown MAGI ID '{magi_id}'. Use --list to see valid IDs.", file=sys.stderr)
            sys.exit(1)

        print(f"Generating dispatch for {magi_id}...\n")
        text = generate_for_magi(magi_id, args.trigger, client)
        if text:
            print(f"\n{'='*60}")
            print(text)


if __name__ == "__main__":
    main()
