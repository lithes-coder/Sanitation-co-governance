"""
Lab 3: Multi-Agent Workflow with Observability
===============================================
Goal: a Supervisor routes a request to a Research specialist or straight to
a Writer specialist, and (optionally) every step is traced end-to-end.

This lab ties together two ideas from the session: the Supervisor / Hub-Spoke
multi-agent pattern (Module 1) and the observability practices (Module 3).

--------------------------------------------------------------------------
Enable tracing (optional but recommended -- takes 2 minutes, no code changes):
    export LANGCHAIN_TRACING_V2=true
    export LANGCHAIN_API_KEY="<your LangSmith API key>"
    export LANGCHAIN_PROJECT="agentic-ai-workshop-lab3"
Then open https://smith.langchain.com after running this script and look for
the trace: supervisor -> researcher -> writer, with every LLM call, its
tokens, and its latency recorded.
--------------------------------------------------------------------------

Run:
    python lab3_multi_agent.py

Estimated time: 13 minutes.
"""
import os
from dotenv import load_dotenv

load_dotenv()  # loads LANGCHAIN_TRACING_V2, LANGCHAIN_API_KEY, LANGCHAIN_PROJECT from .env

from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from llm_utils import get_llm
from lab2_tool_agent import search_knowledge_base  # reuse the Lab 2 tool

llm = get_llm()


class State(TypedDict):
    messages: Annotated[list, add_messages]
    next: str


SUPERVISOR_PROMPT = (
    "You are a supervisor routing a user request to exactly one of two "
    "specialists: 'researcher' (looks up facts about agentic AI / LangGraph "
    "concepts using an internal knowledge base) or 'writer' (turns findings "
    "already in the conversation into a polished final answer, no lookup "
    "needed). Reply with exactly one word: researcher or writer."
)


def supervisor_node(state: State) -> State:
    decision = llm.invoke([SystemMessage(content=SUPERVISOR_PROMPT)] + state["messages"])
    choice = decision.content.strip().lower()
    return {"next": "writer" if "writer" in choice else "researcher"}


def researcher_node(state: State) -> State:
    user_question = state["messages"][0].content
    finding = search_knowledge_base.invoke(user_question)
    note = HumanMessage(content=f"Research finding to use in your answer: {finding}")
    return {"messages": [note], "next": "writer"}


def writer_node(state: State) -> State:
    response = llm.invoke(
        [SystemMessage(
            content="Write a clear, 2-3 sentence answer for a workshop "
                    "attendee, using any research findings already present "
                    "in the conversation above."
        )] + state["messages"]
    )
    return {"messages": [response], "next": END}


def route(state: State) -> str:
    return state["next"]


graph_builder = StateGraph(State)
graph_builder.add_node("supervisor", supervisor_node)
graph_builder.add_node("researcher", researcher_node)
graph_builder.add_node("writer", writer_node)
graph_builder.add_edge(START, "supervisor")
graph_builder.add_conditional_edges(
    "supervisor", route, {"researcher": "researcher", "writer": "writer"}
)
graph_builder.add_edge("researcher", "writer")
graph_builder.add_edge("writer", END)
graph = graph_builder.compile()


if __name__ == "__main__":
    question = "What is context engineering and why does it matter for agents?"
    result = graph.invoke({"messages": [HumanMessage(content=question)], "next": ""})
    print(f"Human Message: {question}\n")
    print(f"Agent Response: {result['messages'][-1].content}")
    print(
        "\nIf LangSmith tracing is enabled, open your LangSmith project to "
        "see the full trace: supervisor -> researcher -> writer."
    )

    # Try it yourself: ask a question the writer can answer with no research
    # at all (e.g. "Just say hello") and watch the supervisor route straight
    # to 'writer', skipping the researcher node entirely.
