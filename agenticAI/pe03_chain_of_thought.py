"""
Program 3: Chain-of-Thought Reasoning
=======================================
Best practice: ask the model to reason step by step BEFORE giving a final
answer, especially for multi-step arithmetic or logic problems.

Task: a multi-step word problem with a single correct numeric answer, so we
can check correctness automatically instead of just eyeballing style.

    "A store had 120 apples. They sold 35% of them in the morning. In the
    afternoon, they sold half of what remained. Then they received a new
    shipment of 40 apples. How many apples does the store have now?"

Correct answer: 120 - 42 (35% sold) = 78 -> sell half (39) -> 39 left
                -> + 40 shipment = 79

We ask the SAME question twice:
  - DIRECT:  "just give the number" -- no room to work through sub-steps.
  - CHAIN-OF-THOUGHT: "think step by step, then give the final answer."

Run:
    python pe03_chain_of_thought.py
"""
import re
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


PROBLEM = (
    "A store had 120 apples. They sold 35% of them in the morning. In the "
    "afternoon, they sold half of what remained. Then they received a new "
    "shipment of 40 apples. How many apples does the store have now?"
)

CORRECT_ANSWER = 79

DIRECT_PROMPT = f"{PROBLEM}\nJust give the final number, nothing else."

# COT_PROMPT = (
#    f"{PROBLEM}\n\n"
#    "Think through this step by step: work out how many were sold each "
#    "time and how many remained after each step, showing your arithmetic. "
#    "Then, on the final line, write 'Final answer: <number>'."    
#)


COT_PROMPT = (
    f"{PROBLEM}\n\n"
    "Think through this step by step. Show each arithmetic step in plain text only. "
    "Do not use Markdown, LaTeX, dollar signs, or bold formatting. "
    "Write equations like '120 * 0.35 = 42'. "
    "On the final line, write exactly: Final answer: <number>"
)


DEMO_DIRECT = "84"
DEMO_COT = (
    "Step 1: 35% of 120 = 42 apples sold in the morning. Remaining: "
    "120 - 42 = 78.\n"
    "Step 2: Half of 78 = 39 apples sold in the afternoon. Remaining: "
    "78 - 39 = 39.\n"
    "Step 3: New shipment adds 40 apples: 39 + 40 = 79.\n"
    "Final answer: 79"
)


def extract_last_number(text: str):
    matches = re.findall(r"-?\d+(?:\.\d+)?", text)
    return float(matches[-1]) if matches else None


def main() -> None:
    header("Program 3: Chain-of-Thought Reasoning")
    llm = get_llm()

    if llm is None:
        demo_notice()
        direct_output, cot_output = DEMO_DIRECT, DEMO_COT
    else:
        direct_output = ask(llm, DIRECT_PROMPT)
        cot_output = ask(llm, COT_PROMPT)

    section("The problem", PROBLEM)
    print(f"\n  Correct answer: {CORRECT_ANSWER}")

    section("BEFORE - Direct-answer prompt", DIRECT_PROMPT, tag="(prompt)")
    section("BEFORE - Response", direct_output, tag="(output)")
    direct_num = extract_last_number(direct_output)
    direct_ok = direct_num == CORRECT_ANSWER
    print(f"\n  Extracted answer: {direct_num}   [{'CORRECT' if direct_ok else 'INCORRECT'}]")

    section("AFTER - Chain-of-thought prompt", COT_PROMPT, tag="(prompt)")
    section("AFTER - Response", cot_output, tag="(output)")
    cot_num = extract_last_number(cot_output.split("Final answer:")[-1]) if "Final answer:" in cot_output else extract_last_number(cot_output)
    cot_ok = cot_num == CORRECT_ANSWER
    print(f"\n  Extracted answer: {cot_num}   [{'CORRECT' if cot_ok else 'INCORRECT'}]")

    takeaway(
        "Asked to answer in one shot, a model commits to a number "
        "immediately, with no mechanism to catch an arithmetic slip across "
        "three dependent steps (percentage, then half of a new total, then "
        "an addition). Asking it to work through the steps first gives it "
        "room to track each intermediate value explicitly -- the same "
        "computation a careful person would do on paper -- which is why "
        "chain-of-thought prompting reliably improves accuracy on multi-step "
        "math and logic problems. This is also exactly what the ReAct "
        "loop's 'Thought' step is doing inside an agent."
    )


if __name__ == "__main__":
    main()
