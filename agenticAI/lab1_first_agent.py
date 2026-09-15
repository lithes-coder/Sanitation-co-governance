"""
Lab 1: Your First LangGraph Agent
==================================
Goal: build the simplest possible LangGraph -- one node, no branching, no
loop -- so you see StateGraph / compile() / invoke() mechanics clearly before
Lab 2 introduces a tool and a conditional edge.

Run:
    python lab1_first_agent.py

Estimated time: 12 minutes.
"""
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

from llm_utils import get_llm

# ---------------------------------------------------------------------------
# Step 1: Define the State.
#   - "messages" is a list that LangGraph will APPEND to (via add_messages)
#     rather than overwrite, every time a node returns an update for it.
#   - This is the agent's working memory -- see Module 1's "Anatomy of an
#     Agent" slide and Module 4's "Introducing LangGraph" slide.
# ---------------------------------------------------------------------------
class State(TypedDict):
    messages: Annotated[list, add_messages]


llm = get_llm()


# ---------------------------------------------------------------------------
# Step 2: One node function.
#   A node is just a Python function: it takes the current state and returns
#   a partial update. Here, the update is "one more message: the LLM's reply".
# ---------------------------------------------------------------------------
def agent_node(state: State) -> State:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


# ---------------------------------------------------------------------------
# Step 3: Wire START -> agent_node -> END and compile the graph.
#   This is intentionally the simplest possible graph: no branching, no loop.
# ---------------------------------------------------------------------------
graph_builder = StateGraph(State)
graph_builder.add_node("agent", agent_node)
graph_builder.add_edge(START, "agent")
graph_builder.add_edge("agent", END)
graph = graph_builder.compile()


# ---------------------------------------------------------------------------
# Step 4: Invoke the graph with a test message.
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    result = graph.invoke(
        {"messages": [HumanMessage(content="In one sentence, what is agentic AI?")]}
    )
    print("AgentResponse:" , result["messages"][-1].content)

    # Try it yourself: change the question above, or add a second turn by
    # invoking the graph again with the previous result's "messages" plus a
    # new HumanMessage appended.
