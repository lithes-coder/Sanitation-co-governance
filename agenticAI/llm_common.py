"""
Shared helpers for the Prompt Engineering Showcase.

Every program in this project (01-04) imports from here. It handles:
  - Picking an LLM provider (Anthropic or OpenAI -- whichever API key is set)
  - Falling back to DEMO MODE with pre-recorded output when no key is set,
    so every program still runs and teaches the concept with zero setup.
  - Consistent "before / after" console formatting so the improvement from
    each best practice is easy to see.

Set ONE of these before running with a live model:
    export ANTHROPIC_API_KEY="sk-ant-..."
    export OPENAI_API_KEY="sk-..."
Optionally override the model:
    export LLM_MODEL="claude-opus-4-1-20250805"
"""
import os
import shutil

DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929"
DEFAULT_OPENAI_MODEL = "gpt-4o"


def has_api_key() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("OPENAI_API_KEY"))


def get_llm(temperature: float = 0.7):
    """Return a LangChain chat model, or None if no API key is configured
    (callers should fall back to demo mode in that case)."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic

        model = os.environ.get("LLM_MODEL", DEFAULT_ANTHROPIC_MODEL)
        return ChatAnthropic(model=model, temperature=temperature)

    if os.environ.get("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI

        model = os.environ.get("LLM_MODEL", DEFAULT_OPENAI_MODEL)
        return ChatOpenAI(model=model, temperature=temperature)

    return None


def ask(llm, prompt: str, system: str = None) -> str:
    """Send one prompt (with an optional system message) and return the text."""
    from langchain_core.messages import HumanMessage, SystemMessage

    messages = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))
    response = llm.invoke(messages)
    return response.content


# ---------------------------------------------------------------------------
# Console formatting helpers
# ---------------------------------------------------------------------------
def _width() -> int:
    return min(shutil.get_terminal_size(fallback=(100, 24)).columns, 100)


def header(title: str) -> None:
    w = _width()
    print("\n" + "=" * w)
    print(title.upper())
    print("=" * w)


def section(label: str, body: str, tag: str = "") -> None:
    w = _width()
    print("\n" + "-" * w)
    print(f"{label}{('  ' + tag) if tag else ''}")
    print("-" * w)
    print(body.strip())


def demo_notice() -> None:
    print(
        "\n[DEMO MODE] No ANTHROPIC_API_KEY or OPENAI_API_KEY found -- showing "
        "pre-recorded example output instead of a live call. Set one of those "
        "environment variables and re-run to see this happen live."
    )


def takeaway(text: str) -> None:
    w = _width()
    print("\n" + "-" * w)
    print("WHY THIS MATTERS")
    print("-" * w)
    print(text.strip())
    print()
