"""Internal QA script (not shipped) -- verifies the three lab graphs compile
and execute correctly using a fake LLM, without needing a real API key."""
import sys
from langchain_core.messages import AIMessage
import llm_utils

call_log = []

class FakeLLM:
    def __init__(self, script):
        self.script = script
        self.i = 0
    def invoke(self, messages):
        out = self.script[min(self.i, len(self.script)-1)]
        self.i += 1
        call_log.append(out)
        return out
    def bind_tools(self, tools):
        return self

# ---- Lab 1 smoke test ----
llm_utils.get_llm = lambda temperature=0: FakeLLM([AIMessage(content="Agentic AI acts autonomously toward a goal.")])
sys.path.insert(0, ".")
import importlib
lab1 = importlib.import_module("lab1_first_agent")
r1 = lab1.graph.invoke({"messages": [("user", "what is agentic ai?")]})
assert r1["messages"][-1].content, "Lab 1 produced no content"
print("Lab 1 OK ->", r1["messages"][-1].content)

# ---- Lab 2 smoke test ----
tool_call_msg = AIMessage(content="", tool_calls=[{"name": "calculator", "args": {"expression": "2+2"}, "id": "call1"}])
final_msg = AIMessage(content="2 + 2 = 4")
llm_utils.get_llm = lambda temperature=0: FakeLLM([tool_call_msg, final_msg])
lab2 = importlib.import_module("lab2_tool_agent")
importlib.reload(lab2)
r2 = lab2.graph.invoke({"messages": [("user", "what is 2+2?")]})
assert "4" in r2["messages"][-1].content
print("Lab 2 OK ->", r2["messages"][-1].content)

# ---- Lab 3 smoke test ----
route_researcher = AIMessage(content="researcher")
final_answer = AIMessage(content="Context engineering curates what an agent sees.")
llm_utils.get_llm = lambda temperature=0: FakeLLM([route_researcher, final_answer])
lab3 = importlib.import_module("lab3_multi_agent")
importlib.reload(lab3)
r3 = lab3.graph.invoke({"messages": [("user", "what is context engineering?")], "next": ""})
assert r3["messages"][-1].content
print("Lab 3 OK ->", r3["messages"][-1].content)

print("\nALL SMOKE TESTS PASSED")
