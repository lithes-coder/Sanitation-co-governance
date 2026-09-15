"""
Lab 2: Tool-Using Agent with RAG
================================
Goal: give the agent a calculator tool and a document-retrieval ("RAG") tool,
and let it decide -- via the ReAct loop -- when to call each.

This is the lab that makes the ReAct pattern from Module 1 tangible: watch
`agent_node` get called twice in one run -- once to request a tool call, once
again after the tool result comes back to produce the final answer.

Run:
    python lab2_tool_agent.py

Estimated time: 15 minutes.
"""
import re
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from llm_utils import get_llm

# ---------------------------------------------------------------------------
# A tiny in-memory "knowledge base" for the RAG tool.
#
# In production you would replace this with a real vector store (Chroma,
# FAISS, pgvector, ...) and real embeddings. This keyword-overlap version
# keeps the lab dependency-free and fast, while still demonstrating the
# shape of retrieval: the tool returns only the ONE most relevant passage,
# not the whole knowledge base -- this is Context Engineering (Module 3) in
# miniature.
# ---------------------------------------------------------------------------
DOCS = [
    ("agentic_ai_definition",
     "Agentic AI systems plan, use tools, and act autonomously across "
     "multiple steps toward a goal, unlike single-turn generative AI."),
    ("react_pattern",
     "The ReAct pattern interleaves Thought, Action, and Observation steps, "
     "letting an agent reason, act, and revise its plan based on results."),
    ("context_engineering",
     "Context engineering is the discipline of curating what information -- "
     "retrieved documents, tool schemas, memory -- reaches a model at each "
     "step, rather than just how a single prompt is worded."),
    ("langgraph_overview",
     "LangGraph is an open-source orchestration framework that represents "
     "an agent as an explicit graph of nodes, edges, and a shared state "
     "object, with built-in checkpointing for persistence and replay."),
    ("observability",
     "Agent observability captures the full reasoning trace -- thoughts, "
     "tool calls, arguments, results, tokens, and latency -- as one "
     "hierarchical, replayable record, not scattered log lines."),
]


def _score(query: str, text: str) -> int:
    """Very simple keyword-overlap scorer -- good enough for a teaching lab."""
    q_words = set(re.findall(r"[a-z]+", query.lower()))
    t_words = set(re.findall(r"[a-z]+", text.lower()))
    return len(q_words & t_words)


@tool
def search_knowledge_base(query: str) -> str:
    """Search the workshop's small internal knowledge base for a passage
    relevant to the query. Use this ONLY for questions about agentic AI
    concepts covered in this workshop (e.g. ReAct, context engineering,
    LangGraph, observability). Do NOT use this for general knowledge, math,
    or anything outside that scope -- it will not have the answer.
    """
    ranked = sorted(DOCS, key=lambda d: _score(query, d[1]), reverse=True)
    best_id, best_text = ranked[0]
    return f"[{best_id}] {best_text}"


@tool
def calculator(expression: str) -> str:
    """Evaluate a simple arithmetic expression, e.g. '12 * (4 + 3)'. Use this
    for any math question involving numbers. Do NOT use this for anything
    that is not a pure arithmetic expression -- it only understands digits
    and + - * / ( ).
    """
    allowed = set("0123456789+-*/(). ")
    if not set(expression) <= allowed:
        return "Error: expression contains characters this tool cannot evaluate."
    try:
        # Safe-ish eval: no builtins, no names -- digits and arithmetic only.
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as exc:  # noqa: BLE001 - deliberately broad for a teaching tool
        return f"Error evaluating expression: {exc}"


TOOLS = [search_knowledge_base, calculator]
TOOLS_BY_NAME = {t.name: t for t in TOOLS}

llm = get_llm()
llm_with_tools = llm.bind_tools(TOOLS)


class State(TypedDict):
    messages: Annotated[list, add_messages]


def agent_node(state: State) -> State:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def tool_node(state: State) -> State:
    last_message = state["messages"][-1]
    outputs = []
    for call in last_message.tool_calls:
        result = TOOLS_BY_NAME[call["name"]].invoke(call["args"])
        outputs.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    return {"messages": outputs}


def should_continue(state: State) -> str:
    """The conditional edge: route to 'tools' if the LLM requested a tool
    call, otherwise route to END. This is the explicit stop condition Module
    1 and Module 3 both stress -- LangGraph never adds one for you."""
    last_message = state["messages"][-1]
    return "tools" if getattr(last_message, "tool_calls", None) else END


graph_builder = StateGraph(State)
graph_builder.add_node("agent", agent_node)
graph_builder.add_node("tools", tool_node)
graph_builder.add_edge(START, "agent")
graph_builder.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph_builder.add_edge("tools", "agent")  # <- the ReAct loop-back
graph = graph_builder.compile()


if __name__ == "__main__":
    for question in [
        "What is the ReAct pattern, in one sentence?",
        "What is 12 * (4 + 3)?",
    ]:
        print(f"HumanMessage\n> {question}")
        result = graph.invoke({"messages": [HumanMessage(content=question)]})
        print("Agent Response:", result["messages"][-1].content)

    # Try it yourself: write a deliberately vague docstring for `calculator`
    # (e.g. just "Does math.") and see the agent misuse or skip the tool --
    # then fix it. This is the "tool docstrings are contracts" lesson from
    # Module 3, live.
