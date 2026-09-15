import os
from dotenv import load_dotenv

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from typing import Annotated, TypedDict

from llm_utils import get_llm
from complaint_tool import get_complaint_by_id
from sanitation_rag import retriever

load_dotenv()

# LLM — uses llm_utils to auto-detect provider from .env
# Supports: OpenAI, Anthropic, or Ollama
try:
    llm = get_llm(temperature=0)
    LLM_AVAILABLE = True
except Exception as e:
    print(f"WARNING: LLM not available: {e}")
    print("Server will use fallback responses.")
    llm = None
    LLM_AVAILABLE = False


class State(TypedDict):
    messages: Annotated[list, add_messages]
    next: str


SUPERVISOR_PROMPT = """
You are the supervisor of a Sanitation Co-Governance AI Assistant.

Choose exactly ONE route:

- complaint: when the user asks about a specific complaint ID,
  such as CMP-001 or CMP-002.
- knowledge: when the user asks about sanitation platform concepts,
  complaint statuses, escalation, verification, reporting, etc.
- general: for unrelated questions.

Reply with exactly one word:
complaint
knowledge
general
"""


def supervisor_node(state: State):
    question = state["messages"][0].content.strip().lower()

    # --------------------------------------------------
    # Deterministic routing for complaint IDs
    # --------------------------------------------------

    import re

    if re.search(r"\bCMP-\d+\b", question.upper()):
        return {"next": "complaint"}

    # --------------------------------------------------
    # Deterministic routing for sanitation knowledge
    # --------------------------------------------------

    knowledge_keywords = [
        "pending",
        "in progress",
        "resolved",
        "escalated",
        "escalation",
        "verification",
        "verify",
        "complaint status",
        "complaint reporting",
        "reporting",
        "sanitation",
        "platform",
        "ward",
        "citizen",
        "administrator",
        "admin",
        "satisfaction",
        "sla",
        "service-level",
        "community verification",
    ]

    if any(keyword in question for keyword in knowledge_keywords):
        return {"next": "knowledge"}

    # --------------------------------------------------
    # General / unrelated questions
    # --------------------------------------------------

    return {"next": "general"}


def complaint_node(state: State):
    question = state["messages"][0].content

    # Find complaint ID such as CMP-001
    import re

    match = re.search(r"CMP-\d+", question.upper())

    if not match:
        result = "Please provide a valid complaint ID such as CMP-001."
    else:
        complaint_id = match.group()
        complaint = get_complaint_by_id(complaint_id)

        if "error" in complaint:
            result = complaint["error"]
        else:
            result = (
                f"Complaint ID: {complaint['complaint_id']}\n"
                f"Ward: {complaint['ward']}\n"
                f"Type: {complaint['complaint_type']}\n"
                f"Description: {complaint['description']}\n"
                f"Status: {complaint['status']}\n"
                f"Reported: {complaint['date_reported']}"
            )

    return {
        "messages": [HumanMessage(content=result)],
        "next": "general"
    }


def knowledge_node(state: State):
    question = state["messages"][0].content.strip()

    # --------------------------------------------------
    # 1. Retrieve relevant information from knowledge base
    # --------------------------------------------------

    results = retriever.invoke(question)

    if not results:
        return {
            "messages": [
                HumanMessage(
                    content="I could not find that information in the sanitation knowledge base."
                )
            ],
            "next": "end"
        }

    context = "\n\n".join(
        result.page_content for result in results
    )

    # --------------------------------------------------
    # 2. Deterministic answers for complaint statuses
    # --------------------------------------------------

    q = question.lower()

    status_definitions = {
        "pending": (
            "Pending means the complaint has been submitted "
            "but has not yet been actively processed."
        ),

        "in progress": (
            "In Progress means the complaint is currently being "
            "investigated or addressed."
        ),

        "resolved": (
            "Resolved means the reported issue has been addressed "
            "and marked as resolved."
        ),

        "escalated": (
            "Escalated means the complaint has exceeded the defined "
            "service-level threshold and requires additional attention."
        )
    }

    for status, definition in status_definitions.items():

        if status in q and any(
            keyword in q
            for keyword in [
                "mean",
                "means",
                "status",
                "what is",
                "what does",
                "explain"
            ]
        ):
            return {
                "messages": [
                    HumanMessage(content=definition)
                ],
                "next": "end"
            }

    # --------------------------------------------------
    # 3. Use LLM for other knowledge questions
    # --------------------------------------------------

    if not LLM_AVAILABLE or llm is None:
        # Fallback: return retrieved context directly
        answer = (
            f"Based on the sanitation platform knowledge base:\n\n"
            f"{context}\n\n"
            f"(Note: AI language model is not available. "
            f"This answer is from the knowledge base directly.)"
        )
        return {
            "messages": [HumanMessage(content=answer)],
            "next": "end"
        }

    response = llm.invoke(
        [
            SystemMessage(
                content=(
                    "You are the Sanitation Co-Governance Assistant.\n\n"
                    "Answer ONLY using the retrieved sanitation knowledge.\n"
                    "Do not use outside knowledge.\n"
                    "Do not invent departments, policies, procedures, "
                    "thresholds, causes, examples, or explanations.\n"
                    "If the answer is not present in the retrieved "
                    "knowledge, say exactly:\n"
                    "\"I could not find that information in the "
                    "sanitation knowledge base.\"\n"
                    "Keep the answer concise.\n\n"
                    "RETRIEVED KNOWLEDGE:\n"
                    f"{context}"
                )
            ),
            HumanMessage(content=question)
        ]
    )

    return {
        "messages": [response],
        "next": "end"
    }


def general_node(state: State):
    if not LLM_AVAILABLE or llm is None:
        answer = (
            "I am the Sanitation Co-Governance AI Assistant. "
            "I can help you with:\n\n"
            "- Sanitation complaint reporting and tracking\n"
            "- Complaint statuses (Pending, In Progress, Resolved, Escalated)\n"
            "- Community verification of resolved complaints\n"
            "- Escalation policies and SLA thresholds\n"
            "- Platform features and ward information\n\n"
            "Please ask me a question about any of these topics!\n\n"
            "(Note: The AI language model is not configured. "
            "Set LLM_PROVIDER in .env for full AI responses.)"
        )
        return {
            "messages": [HumanMessage(content=answer)],
            "next": "end"
        }

    response = llm.invoke(
        [
            SystemMessage(
                content=(
                    "You are the Sanitation Co-Governance Assistant. "
                    "Politely explain that you can help with sanitation "
                    "complaints, complaint status, verification, "
                    "escalation, reporting and platform-related questions."
                )
            )
        ]
        + state["messages"]
    )

    return {
        "messages": [response],
        "next": "end"
    }


def route(state: State):
    return state["next"]


graph_builder = StateGraph(State)

graph_builder.add_node("supervisor", supervisor_node)
graph_builder.add_node("complaint", complaint_node)
graph_builder.add_node("knowledge", knowledge_node)
graph_builder.add_node("general", general_node)

graph_builder.add_edge(START, "supervisor")

graph_builder.add_conditional_edges(
    "supervisor",
    route,
    {
        "complaint": "complaint",
        "knowledge": "knowledge",
        "general": "general",
    }
)

graph_builder.add_edge("complaint", END)
graph_builder.add_edge("knowledge", END)
graph_builder.add_edge("general", END)

graph = graph_builder.compile()


def ask_agent(question: str) -> str:
    """
    Send a question to the Sanitation Co-Governance AI Agent
    and return the final answer.
    """

    result = graph.invoke(
        {
            "messages": [HumanMessage(content=question)],
            "next": ""
        }
    )

    return result["messages"][-1].content


if __name__ == "__main__":

    print("=" * 50)
    print(" Sanitation Co-Governance AI Agent")
    print("=" * 50)
    print("Type 'exit' to stop.\n")

    while True:

        question = input("You: ")

        if question.lower() == "exit":
            break

        answer = ask_agent(question)

        print("\nAgent:", answer)
        print()