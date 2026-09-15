# Prompt Engineering Showcase

Four small, standalone Python programs, each proving — with a real before/after
comparison, not just an opinion — that one specific prompt engineering best
practice measurably improves an LLM's response.

| # | File | Best practice | What's measured |
|---|------|----------------|------------------|
| 1 | `pe01_specificity.py` | Specificity & explicit constraints (role, audience, format, length, banned words) | Qualitative: on-brief vs. generic copy |
| 2 | `pe02_few_shot.py` | Few-shot examples | Format-match score against `YYYY-MM-DD` across 3 test inputs |
| 3 | `pe03_chain_of_thought.py` | Chain-of-thought reasoning | Correct vs. incorrect final answer to a multi-step word problem |
| 4 | `pe04_structured_output.py` | Structured / schema-constrained output | `json.loads()` success + required-key check |

Each program prints the "before" prompt and response, the "after" prompt and
response, and a short "why this matters" explanation.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r prompt_engineering_requirements.txt
```

Configure your LLM provider in a `.env` file in the project root (or as shell
environment variables). Choose **one** of the three options:

### Option A — Ollama (local, no API key needed)

```dotenv
LLM_PROVIDER=ollama
# LLM_MODEL=gemma4:e4b          # optional — this is the default
# OLLAMA_BASE_URL=http://localhost:11434   # optional — this is the default
```

Make sure Ollama is running (`ollama serve`) and the model is pulled
(`ollama pull gemma4:e4b`) before running the programs.

### Option B — Anthropic

```dotenv
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# LLM_MODEL=claude-sonnet-4-5-20250929   # optional override
```

(PowerShell: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`)

### Option C — OpenAI

```dotenv
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
# LLM_MODEL=gpt-4o   # optional override
```

No provider configured? Every program still runs — it prints a `[DEMO MODE]`
notice and shows pre-recorded example output, so you can see the concept
immediately with zero setup or cost.

## Run

```bash
python pe01_specificity.py
python pe02_few_shot.py
python pe03_chain_of_thought.py
python pe04_structured_output.py
```

## Files

- `llm_utils.py` — shared LLM provider selection; reads `LLM_PROVIDER`,
  `LLM_MODEL`, and the relevant API key / base URL from `.env` or shell
  environment variables. Supports Ollama, Anthropic, and OpenAI.
- `pe01_specificity.py` … `pe04_structured_output.py` — the four programs.
  Each file embeds its own `get_llm()` / `ask()` wrappers and display helpers
  that delegate to `llm_utils`, so every program is self-contained.
- `prompt_engineering_requirements.txt` — Python dependencies.

## Notes

- Programs make real LLM calls when a provider is configured (Anthropic/OpenAI
  incur a small cost per run, typically a few cents; Ollama is free and local).
- The "improvement" in Programs 2–4 is checked programmatically (format
  match, correct answer, or valid JSON) so the result isn't just a subjective
  read of the text — Program 1 is judged qualitatively since good marketing
  copy doesn't have a single measurable pass/fail.
- `LLM_MODEL` can be set to override the default model for whichever
  provider you're using.
