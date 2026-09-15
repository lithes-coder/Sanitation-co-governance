# Agentic AI Workshop — Hands-On Labs

A three-lab, hands-on workshop that walks from the simplest possible LangGraph
agent all the way to a multi-agent Supervisor / Hub-Spoke workflow with
end-to-end LangSmith observability.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration (.env)](#configuration-env)
5. [Labs Overview](#labs-overview)
   - [Lab 1 — Your First Agent](#lab-1--your-first-agent)
   - [Lab 2 — Tool-Using Agent with RAG](#lab-2--tool-using-agent-with-rag)
   - [Lab 3 — Multi-Agent Workflow with Observability](#lab-3--multi-agent-workflow-with-observability)
6. [LLM Provider Reference](#llm-provider-reference)
7. [Enabling LangSmith Tracing](#enabling-langsmith-tracing)
8. [Running the Smoke Tests](#running-the-smoke-tests)
9. [Architecture Diagrams](#architecture-diagrams)
10. [Key Concepts Covered](#key-concepts-covered)
11. [Workshop Materials](#workshop-materials)

---

## Project Structure

```
.
├── lab1_first_agent.py      # Lab 1 – minimal single-node LangGraph agent
├── lab2_tool_agent.py       # Lab 2 – ReAct agent with calculator + RAG tools
├── lab3_multi_agent.py      # Lab 3 – Supervisor / Hub-Spoke multi-agent graph
├── llm_utils.py             # Shared LLM factory (Anthropic / OpenAI / Ollama)
├── _smoke_test.py           # Internal QA – verifies all three graphs with a fake LLM
├── requirements.txt         # Python dependencies
├── .env                     # (you create this) API keys and provider selection
└── docs/
    ├── Agentic_AI_Lab_Guide*.pdf    # Step-by-step lab guide
    └── Agentic_AI_Workshop*.pptx   # Slide decks for all modules
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10 or later |
| pip | 23+ |
| (optional) Ollama | Latest — only needed for local inference |
| (optional) LangSmith account | Free tier — only needed for tracing |

At least **one** of the following API keys is required to run the labs:

- `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)
- `OPENAI_API_KEY` — [platform.openai.com](https://platform.openai.com)
- A local [Ollama](https://ollama.ai) installation (no API key needed)

---

## Installation

```bash
# 1. Clone / extract the project
cd "Agentic AI Session"

# 2. Create and activate a virtual environment (recommended)
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Configuration (.env)

Create a `.env` file in the project root. Copy the template below and fill in
the values that apply to your setup.

```dotenv
# ── LLM Provider ────────────────────────────────────────────────────────────
# Choose one: "anthropic", "openai", or "ollama"
LLM_PROVIDER=anthropic

# ── API Keys (only the one matching LLM_PROVIDER is required) ───────────────
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# ── Optional model override (falls back to provider default when omitted) ───
# LLM_MODEL=claude-sonnet-4-5-20250929   # Anthropic default
# LLM_MODEL=gpt-4o                       # OpenAI default
# LLM_MODEL=gemma4:e4b                   # Ollama default

# ── Ollama (only needed when LLM_PROVIDER=ollama) ───────────────────────────
# OLLAMA_BASE_URL=http://localhost:11434

# ── LangSmith Tracing (optional — Lab 3 observability feature) ──────────────
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=ls__...
# LANGCHAIN_PROJECT=agentic-ai-workshop-lab3
```

> **Note:** Shell environment variables are **not** overridden by `.env`
> values — if a variable is already set in your shell, the shell value wins.

---

## Labs Overview

### Lab 1 — Your First Agent

**File:** [`lab1_first_agent.py`](lab1_first_agent.py)  
**Estimated time:** 12 minutes

The simplest possible LangGraph: one node, no branching, no loop. The goal is
to make `StateGraph`, `compile()`, and `invoke()` mechanics tangible before
adding complexity.

```
START ──► agent_node ──► END
```

**What you learn:**
- How `StateGraph` and `State` (a `TypedDict` with `add_messages`) work
- The role of `compile()` and `invoke()` in LangGraph
- How LangGraph appends to the message list rather than overwriting it

**Run:**
```bash
python lab1_first_agent.py
```

**Sample output:**
```
AgentResponse: Agentic AI refers to AI systems that autonomously plan and execute
multi-step tasks toward a goal using tools, memory, and reasoning.
```

---

### Lab 2 — Tool-Using Agent with RAG

**File:** [`lab2_tool_agent.py`](lab2_tool_agent.py)  
**Estimated time:** 15 minutes

Adds two tools to the agent and implements the **ReAct loop** — the agent can
call tools, observe results, and revise its plan before giving a final answer.

```
START ──► agent_node ──┬──► tools_node ──► (back to agent_node)
                       └──► END
```

**Tools provided:**

| Tool | Description |
|---|---|
| `search_knowledge_base` | Keyword-scored retrieval over a small in-memory document set covering agentic AI concepts |
| `calculator` | Safe arithmetic evaluator for expressions like `12 * (4 + 3)` |

**What you learn:**
- How `bind_tools()` exposes tools to the LLM
- The ReAct (Reason + Act) loop: agent → tool → agent → … → END
- Why explicit stop conditions matter (`should_continue` conditional edge)
- How tool docstrings act as contracts that influence the LLM's tool-selection

**Run:**
```bash
python lab2_tool_agent.py
```

**Sample output:**
```
HumanMessage
> What is the ReAct pattern, in one sentence?
Agent Response: The ReAct pattern interleaves Thought, Action, and Observation ...

HumanMessage
> What is 12 * (4 + 3)?
Agent Response: 12 * (4 + 3) = 84
```

---

### Lab 3 — Multi-Agent Workflow with Observability

**File:** [`lab3_multi_agent.py`](lab3_multi_agent.py)  
**Estimated time:** 13 minutes

Implements the **Supervisor / Hub-Spoke** multi-agent pattern. A `supervisor`
node reads the user's request and routes it to either a `researcher` specialist
(which calls the Lab 2 knowledge base tool) or straight to a `writer`
specialist (for requests that need no research). Optionally, every step is
traced end-to-end with LangSmith.

```
START ──► supervisor ──┬──► researcher ──► writer ──► END
                       └──────────────────► writer ──► END
```

**Nodes:**

| Node | Role |
|---|---|
| `supervisor_node` | Routes the request: replies with exactly `researcher` or `writer` |
| `researcher_node` | Calls `search_knowledge_base` and appends the finding to the state |
| `writer_node` | Synthesises a polished 2-3 sentence answer from the conversation |

**What you learn:**
- The Supervisor / Hub-Spoke multi-agent pattern
- How `conditional_edges` implement runtime routing
- Sharing state and tools across agents in a single graph
- End-to-end LangSmith tracing: latency, token counts, and the full
  `supervisor → researcher → writer` trace hierarchy

**Run:**
```bash
python lab3_multi_agent.py
```

**Sample output:**
```
Human Message: What is context engineering and why does it matter for agents?

Agent Response: Context engineering is the discipline of curating exactly what
information — documents, tool schemas, memory — an agent sees at each step.
It matters because an agent's reasoning quality is bounded by the quality of its
context, not just the quality of its prompt.

If LangSmith tracing is enabled, open your LangSmith project to see the full
trace: supervisor -> researcher -> writer.
```

---

## LLM Provider Reference

All three labs share [`llm_utils.get_llm()`](llm_utils.py). Provider selection
follows this priority order:

1. **`LLM_PROVIDER` env var** — explicit override (`anthropic`, `openai`, `ollama`)
2. **API key auto-detection** — if `LLM_PROVIDER` is absent, whichever key is
   present is used (Anthropic takes priority when both are set)
3. **Ollama** — only used when `LLM_PROVIDER=ollama` is explicitly set

**Default models:**

| Provider | Default Model |
|---|---|
| Anthropic | `claude-sonnet-4-5-20250929` |
| OpenAI | `gpt-4o` |
| Ollama | `gemma4:e4b` |

Override any default by setting `LLM_MODEL` in `.env`.

---

## Enabling LangSmith Tracing

Tracing is **optional** and requires no code changes. Enable it for Lab 3 by
adding these variables to your `.env` (or exporting them in your shell):

```bash
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY="ls__..."
export LANGCHAIN_PROJECT="agentic-ai-workshop-lab3"
```

Then run `lab3_multi_agent.py` and open [smith.langchain.com](https://smith.langchain.com).
You will see:

- The full `supervisor → researcher → writer` trace hierarchy
- Every LLM call with its input messages and output
- Token counts and latency for each node
- The routing decision made by the supervisor

> Free LangSmith accounts are sufficient for this workshop.

---

## Running the Smoke Tests

[`_smoke_test.py`](_smoke_test.py) verifies all three lab graphs compile and
execute correctly using a **fake LLM** — no API key or network access required.

```bash
python _smoke_test.py
```

Expected output:
```
Lab 1 OK -> Agentic AI acts autonomously toward a goal.
Lab 2 OK -> 2 + 2 = 4
Lab 3 OK -> Context engineering curates what an agent sees.

ALL SMOKE TESTS PASSED
```

---

## Architecture Diagrams

### Lab 1 — Single-Node Graph
```
┌─────────────────────────────────────────┐
│              StateGraph                 │
│                                         │
│  START ──► [ agent_node ] ──► END       │
│                 │                       │
│           llm.invoke(messages)          │
└─────────────────────────────────────────┘
```

### Lab 2 — ReAct Loop
```
┌──────────────────────────────────────────────────────┐
│                     StateGraph                       │
│                                                      │
│  START ──► [ agent_node ] ──── tool_calls? ──► END   │
│                  ▲                  │                │
│                  │                  ▼                │
│                  └──── [ tool_node ]                 │
│                    (calculator / search_kb)          │
└──────────────────────────────────────────────────────┘
```

### Lab 3 — Supervisor / Hub-Spoke
```
┌────────────────────────────────────────────────────────────┐
│                        StateGraph                          │
│                                                            │
│  START ──► [ supervisor ] ──► "researcher" ──► [ researcher ] ──┐  │
│                    │                                         │   │
│                    └──────────► "writer" ────────────────┐  │   │
│                                                          ▼  ▼   │
│                                                     [ writer ] ──► END
└────────────────────────────────────────────────────────────┘
```

---

## Key Concepts Covered

| Concept | Introduced in |
|---|---|
| `StateGraph`, `State`, `add_messages` | Lab 1 |
| `compile()` / `invoke()` mechanics | Lab 1 |
| Tool binding (`bind_tools`) | Lab 2 |
| ReAct pattern (Thought → Action → Observation) | Lab 2 |
| Conditional edges and explicit stop conditions | Lab 2 |
| Context engineering (returning only the top-scored passage) | Lab 2 |
| Supervisor / Hub-Spoke multi-agent pattern | Lab 3 |
| Runtime routing via `conditional_edges` | Lab 3 |
| Shared state across agents | Lab 3 |
| End-to-end observability with LangSmith | Lab 3 |

---

## Workshop Materials

Full slide decks and step-by-step lab guides are in the [`docs/`](docs/) folder:

| File | Description |
|---|---|
| `Agentic_AI_Workshop_v3.pdf` | Latest workshop slide deck |
| `Agentic_AI_Lab_Guide_v2.pdf` | Step-by-step lab guide with screenshots |

---

> **Tip:** If you finish early, each lab file contains a *"Try it yourself"*
> comment at the bottom with a suggested experiment — a great way to deepen
> your understanding before the next module.
