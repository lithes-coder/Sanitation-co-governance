"""
Program 1: Specificity & Constraints
=====================================
Best practice: state the role, audience, task, format, length, and what to
avoid EXPLICITLY, instead of leaving them implied.

Task: write marketing copy for a product.

We send the SAME underlying task to the model twice:
  - VAGUE:    a one-line, unstructured request.
  - SPECIFIC: role + audience + constraints + format + explicit exclusions.

Run:
    python pe01_specificity.py
"""
import textwrap

from langchain_core.messages import HumanMessage
from llm_utils import get_llm as _get_llm

_WIDTH = 72


def get_llm():
    try:
        return _get_llm()
    except RuntimeError:
        return None


def ask(llm, user_prompt: str) -> str:
    response = llm.invoke([HumanMessage(content=user_prompt)])
    return response.content


def header(title: str) -> None:
    bar = "=" * _WIDTH
    print(f"\n{bar}\n  {title}\n{bar}")


def section(label: str, body: str, *, tag: str = "") -> None:
    prefix = f"  {tag} " if tag else "  "
    print(f"\n── {label} {'─' * max(0, _WIDTH - len(label) - 4)}")
    for line in body.splitlines():
        print(f"{prefix}{line}")


def demo_notice() -> None:
    print("\n  [DEMO MODE] No LLM provider configured — showing hard-coded")
    print("  sample responses.  Set LLM_PROVIDER in your .env to use a")
    print("  real model.  See the Lab Guide, Section 2 (Setup).")


def takeaway(message: str) -> None:
    print(f"\n{'─' * _WIDTH}\n  KEY TAKEAWAY\n{'─' * _WIDTH}")
    print(textwrap.fill(message, width=_WIDTH - 4, initial_indent="  ", subsequent_indent="  "))
    print(f"{'─' * _WIDTH}\n")


VAGUE_PROMPT = "Write a description for a water bottle."

SPECIFIC_PROMPT = """\
You are a marketing copywriter for an outdoor sports brand.

Write a product description for a 32oz insulated stainless-steel water \
bottle, aimed at trail runners and hikers aged 25-40 who care about \
sustainability and performance.

Requirements:
- Exactly 3 sentences.
- Open with a benefit, not a feature.
- Mention: keeps drinks cold 24 hours, BPA-free, leak-proof lid.
- Tone: energetic and direct, no exclamation points.
- Do NOT use the words "revolutionary", "game-changer", or "perfect".
"""

DEMO_VAGUE = (
    "Introducing our new water bottle! Made from high-quality materials, "
    "this water bottle is perfect for anyone who wants to stay hydrated. "
    "It comes in multiple colors and sizes to fit your needs. Great for "
    "home, work, or on the go. Stay refreshed with our amazing water "
    "bottle today!"
)

DEMO_SPECIFIC = (
    "Keep pushing past mile ten without your drink going warm on you. This "
    "32oz stainless-steel bottle holds its cold for a full 24 hours, so "
    "trail runs and long hikes never end with a lukewarm sip. The "
    "BPA-free, leak-proof design slides straight into your pack without a "
    "second thought."
)


def main() -> None:
    header("Program 1: Specificity & Constraints")
    llm = get_llm()

    if llm is None:
        demo_notice()
        vague_output, specific_output = DEMO_VAGUE, DEMO_SPECIFIC
    else:
        vague_output = ask(llm, VAGUE_PROMPT)
        specific_output = ask(llm, SPECIFIC_PROMPT)

    section("BEFORE - Vague prompt", VAGUE_PROMPT, tag="(prompt)")
    section("BEFORE - Response", vague_output, tag="(output)")
    section("AFTER - Specific prompt", SPECIFIC_PROMPT, tag="(prompt)")
    section("AFTER - Response", specific_output, tag="(output)")

    takeaway(
        "The vague prompt leaves role, audience, length, tone, required "
        "facts, and banned words all up to the model's guess -- so it "
        "defaults to generic, cliche-heavy filler that could describe any "
        "product. The specific prompt pins down every one of those "
        "decisions explicitly, so the output is on-brief on the first try: "
        "right length, right facts, right tone, and free of the words we "
        "banned. Specificity trades a longer prompt for fewer retries."
    )


if __name__ == "__main__":
    main()
