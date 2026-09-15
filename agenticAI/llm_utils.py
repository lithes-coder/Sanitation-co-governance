"""
Shared helper for selecting an LLM provider across all three labs.

Why this exists: the workshop supports Anthropic, OpenAI, or a local Ollama
model so nobody is blocked by which API key they happen to have. This is a
small piece of "context/config engineering" in its own right -- one place
decides which model backs every agent in the labs, instead of each lab file
hard-coding it.

Usage:
    from llm_utils import get_llm
    llm = get_llm()

Configure via .env in the project root (values here override shell env vars):

    LLM_PROVIDER=ollama             # "anthropic", "openai", or "ollama"
    ANTHROPIC_API_KEY=sk-ant-...    # required when provider=anthropic
    OPENAI_API_KEY=sk-...           # required when provider=openai
    LLM_MODEL=gemma4:e4b            # optional — falls back to provider default
    OLLAMA_BASE_URL=http://localhost:11434   # optional — Ollama default shown
"""
import os
from dotenv import load_dotenv

# Load .env from the project root; existing shell env vars are NOT overridden
# unless override=True is passed.
load_dotenv(override=False)

DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929"
DEFAULT_OPENAI_MODEL    = "gpt-4o"
DEFAULT_OLLAMA_MODEL    = "llama3.2:3b"
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"


def get_llm(temperature: float = 0):
    """Return a LangChain chat model driven by .env / environment variables.

    Selection order:
      1. LLM_PROVIDER env var ("anthropic", "openai", or "ollama") — explicit.
      2. Whichever API key is present when LLM_PROVIDER is absent
         (Anthropic preferred if both are set).
      3. Ollama used as local fallback only when LLM_PROVIDER=ollama.
    """
    provider = os.environ.get("LLM_PROVIDER", "").lower()

    # ── Ollama (local, no API key required) ──────────────────────────────────
    if provider == "ollama":
        from langchain_ollama import ChatOllama

        model    = os.environ.get("LLM_MODEL", DEFAULT_OLLAMA_MODEL)
        base_url = os.environ.get("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL)
        return ChatOllama(model=model, base_url=base_url, temperature=temperature)

    # ── Anthropic ─────────────────────────────────────────────────────────────
    use_anthropic = provider == "anthropic" or (
        provider == "" and os.environ.get("ANTHROPIC_API_KEY")
    )
    if use_anthropic and os.environ.get("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic

        model = os.environ.get("LLM_MODEL", DEFAULT_ANTHROPIC_MODEL)
        return ChatAnthropic(model=model, temperature=temperature)

    # ── OpenAI ────────────────────────────────────────────────────────────────
    use_openai = provider == "openai" or (
        provider == "" and os.environ.get("OPENAI_API_KEY")
    )
    if use_openai and os.environ.get("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI

        model = os.environ.get("LLM_MODEL", DEFAULT_OPENAI_MODEL)
        return ChatOpenAI(model=model, temperature=temperature)

    raise RuntimeError(
        "No LLM provider configured. In your .env set:\n"
        "  LLM_PROVIDER=ollama                    (local, no key needed)\n"
        "  LLM_PROVIDER=anthropic + ANTHROPIC_API_KEY=sk-ant-...\n"
        "  LLM_PROVIDER=openai    + OPENAI_API_KEY=sk-...\n"
        "See the Lab Guide, Section 2 (Setup), for step-by-step instructions."
    )
