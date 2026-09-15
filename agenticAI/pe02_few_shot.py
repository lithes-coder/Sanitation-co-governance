"""
Program 2: Few-Shot Examples
=============================
Best practice: show 2-3 examples of the exact input/output shape you want
instead of describing the format in words.

Task: normalize a date mentioned in free text into ISO format (YYYY-MM-DD).
Dates are a great demo case because free text expresses them in wildly
different ways (relative dates, abbreviated years, month names, ambiguous
numeric formats) -- exactly the kind of formatting consistency a zero-shot
instruction struggles to pin down, and a few examples fix immediately.

We run the SAME 3 test inputs through:
  - ZERO-SHOT: instruction only, no examples.
  - FEW-SHOT:  3 input->output examples, then the same 3 new inputs.

Each output is checked against the YYYY-MM-DD pattern so the improvement in
FORMAT CONSISTENCY is measured, not just eyeballed.

Run:
    python pe02_few_shot.py
"""
import re
import textwrap

from langchain_core.messages import HumanMessage, SystemMessage
from llm_utils import get_llm as _get_llm

_WIDTH = 72


def get_llm():
    try:
        return _get_llm()
    except RuntimeError:
        return None


def ask(llm, user_prompt: str, *, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=user_prompt))
    response = llm.invoke(messages)
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


TEST_INPUTS = [
    "The contract was signed on the 5th of March, 2024.",
    "Payment is due 03/04/24.",
    "She joined the team back in Jan '23.",
]

ZERO_SHOT_SYSTEM = "Extract the date mentioned in the text and output it."

FEW_SHOT_SYSTEM = """\
Extract the date mentioned in the text and output it in ISO format \
(YYYY-MM-DD) ONLY -- no other words.

Examples:
Input: "We shipped it on July 4th, 2022."
Output: 2022-07-04

Input: "Renewal is due 9/1/23."
Output: 2023-09-01

Input: "Meeting was back in Dec '21."
Output: 2021-12-01
"""

ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

DEMO_ZERO_SHOT = [
    "The date mentioned is March 5, 2024.",
    "03/04/24",
    "January 2023",
]
DEMO_FEW_SHOT = ["2024-03-05", "2024-03-04", "2023-01-01"]


def main() -> None:
    header("Program 2: Few-Shot Examples")
    llm = get_llm()
    demo = llm is None
    if demo:
        demo_notice()

    zero_shot_outputs, few_shot_outputs = [], []

    for i, text in enumerate(TEST_INPUTS):
        zero_shot_outputs.append(DEMO_ZERO_SHOT[i] if demo else ask(llm, text, system=ZERO_SHOT_SYSTEM))
        few_shot_outputs.append(DEMO_FEW_SHOT[i] if demo else ask(llm, text, system=FEW_SHOT_SYSTEM))

    section("BEFORE - Zero-shot system prompt", ZERO_SHOT_SYSTEM, tag="(prompt)")
    for text, out in zip(TEST_INPUTS, zero_shot_outputs):
        ok = "MATCHES YYYY-MM-DD" if ISO_DATE.match(out.strip()) else "does NOT match YYYY-MM-DD"
        print(f'\n  Input:  "{text}"')
        print(f"  Output: {out.strip()!r}   [{ok}]")

    section("AFTER - Few-shot system prompt", FEW_SHOT_SYSTEM, tag="(prompt)")
    for text, out in zip(TEST_INPUTS, few_shot_outputs):
        ok = "MATCHES YYYY-MM-DD" if ISO_DATE.match(out.strip()) else "does NOT match YYYY-MM-DD"
        print(f'\n  Input:  "{text}"')
        print(f"  Output: {out.strip()!r}   [{ok}]")

    zero_pass = sum(1 for o in zero_shot_outputs if ISO_DATE.match(o.strip()))
    few_pass = sum(1 for o in few_shot_outputs if ISO_DATE.match(o.strip()))
    print(f"\nFormat-match score -- zero-shot: {zero_pass}/{len(TEST_INPUTS)}   few-shot: {few_pass}/{len(TEST_INPUTS)}")

    takeaway(
        "Telling the model WHAT to do (\"extract the date\") leaves HOW to "
        "format it up to guesswork, so zero-shot output format drifts "
        "between full sentences, slashes, and partial dates -- unusable "
        "for a downstream parser. Three input->output examples show the "
        "model the exact shape we want, and it generalizes that shape to "
        "new inputs immediately, including resolving an ambiguous date "
        "(03/04/24) and a year-only mention consistently. Few-shot is the "
        "fastest fix when instructions alone don't pin down a format."
    )


if __name__ == "__main__":
    main()
