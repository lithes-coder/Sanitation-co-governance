"""
Program 4: Structured / Schema-Constrained Output
====================================================
Best practice: when downstream code will consume the output, ask for a
strict format (JSON with a defined schema) instead of free text -- and
verify it actually parses.

Task: extract customer name, account ID, issue category, and urgency from a
support email into a form a ticketing system could ingest automatically.

We send the SAME email twice:
  - FREE-TEXT: "summarize the key details" -- no format specified.
  - STRUCTURED: an explicit JSON schema, valid-JSON-only instruction, and
    one example.

The free-text response is human-readable but NOT machine-parseable. The
structured response is checked with json.loads() and a schema check, the
way a real ticketing pipeline would validate it.

Run:
    python pe04_structured_output.py
"""
import json
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


EMAIL = """\
Subject: Can't log in - urgent, need this fixed today

Hi team, this is Priya Nair, account ACC-88421. I've been locked out of \
my dashboard since this morning and I have a client demo in 3 hours. \
I've tried resetting my password twice with no luck. Please help ASAP.
"""

FREE_TEXT_PROMPT = f"Summarize the key details from this support email:\n\n{EMAIL}"

REQUIRED_KEYS = {"customer_name", "account_id", "issue_category", "urgency"}

STRUCTURED_PROMPT = f"""\
Extract the following fields from the support email below and respond with \
ONLY a single valid JSON object -- no markdown fences, no commentary.

Schema:
{{
  "customer_name": string,
  "account_id": string,
  "issue_category": one of ["login", "billing", "bug", "feature_request", "other"],
  "urgency": one of ["low", "medium", "high"]
}}

Example output: {{"customer_name": "Alex Kim", "account_id": "ACC-10023", \
"issue_category": "billing", "urgency": "low"}}

Email:
{EMAIL}
"""

DEMO_FREE_TEXT = (
    "Priya Nair (account ACC-88421) is locked out of her dashboard and "
    "has tried resetting her password twice without success. She has a "
    "client demo in 3 hours and needs urgent help."
)
DEMO_STRUCTURED = (
    '{"customer_name": "Priya Nair", "account_id": "ACC-88421", '
    '"issue_category": "login", "urgency": "high"}'
)


def try_parse(text: str):
    """Try to parse text as JSON with the required keys. Returns (data, error)."""
    cleaned = text.strip().strip("`")
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        return None, f"JSONDecodeError: {exc}"
    missing = REQUIRED_KEYS - set(data.keys())
    if missing:
        return None, f"Missing required keys: {sorted(missing)}"
    return data, None


def main() -> None:
    header("Program 4: Structured / Schema-Constrained Output")
    llm = get_llm()

    if llm is None:
        demo_notice()
        free_text_output, structured_output = DEMO_FREE_TEXT, DEMO_STRUCTURED
    else:
        free_text_output = ask(llm, FREE_TEXT_PROMPT)
        structured_output = ask(llm, STRUCTURED_PROMPT)

    section("BEFORE - Free-text prompt", FREE_TEXT_PROMPT, tag="(prompt)")
    section("BEFORE - Response", free_text_output, tag="(output)")
    _, free_err = try_parse(free_text_output)
    print(f"\n  json.loads() result: {'FAILED - ' + free_err if free_err else 'parsed OK'}")

    section("AFTER - Structured prompt", STRUCTURED_PROMPT, tag="(prompt)")
    section("AFTER - Response", structured_output, tag="(output)")
    data, struct_err = try_parse(structured_output)
    if struct_err:
        print(f"\n  json.loads() result: FAILED - {struct_err}")
    else:
        print("\n  json.loads() result: parsed OK, all required keys present:")
        print(f"  {json.dumps(data, indent=2)}")

    takeaway(
        "The free-text response is perfectly readable to a person but a "
        "ticketing system can't reliably pull 'urgency: high' out of a "
        "paragraph -- it would need its own fragile parsing logic, and that "
        "logic breaks the moment the model rephrases something. Giving an "
        "explicit JSON schema, one example, and a 'JSON only' instruction "
        "makes the output something code can consume directly: json.loads() "
        "either succeeds or fails loudly, so a bad response is caught "
        "immediately instead of causing a silent downstream bug. This is "
        "the same principle Module 3 covers for agent tool calls -- "
        "structured output removes a whole category of parsing failures."
    )


if __name__ == "__main__":
    main()
