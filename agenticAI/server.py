"""
FastAPI server for the Sanitation Co-Governance AI Agent.

Wraps the existing LangGraph multi-agent system and exposes it
via REST API with streaming support for the Next.js frontend.

Usage:
    cd agenticAI
    python server.py

The server runs on http://localhost:8000
"""

import json
import asyncio
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# Import the existing agent
# ──────────────────────────────────────────────────────────────────────────────

from sanitation_agent import graph, ask_agent, LLM_AVAILABLE
from complaint_tool import get_complaint_by_id

# ──────────────────────────────────────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Sanitation Co-Governance AI Agent",
    description="API for the sanitation chatbot powered by LangGraph multi-agent system",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# Request / Response models
# ──────────────────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str
    # Optional: complaints data from the frontend for live lookups
    complaints: list[dict] | None = None


class ChatResponse(BaseModel):
    reply: str


class ComplaintRequest(BaseModel):
    complaint_id: str


# ──────────────────────────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────────────────────────


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "sanitation-ai-agent",
        "llm": "available" if LLM_AVAILABLE else "fallback",
    }


# ──────────────────────────────────────────────────────────────────────────────
# Non-streaming chat endpoint
# ──────────────────────────────────────────────────────────────────────────────


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the sanitation AI agent and get a full response.
    """
    try:
        # If complaints data is provided, update the complaint tool's data source
        if request.complaints:
            _update_complaint_data(request.complaints)

        # Run agent with a timeout to prevent hanging
        reply = await asyncio.wait_for(
            asyncio.to_thread(ask_agent, request.message),
            timeout=30,
        )
        return ChatResponse(reply=reply)
    except asyncio.TimeoutError:
        return ChatResponse(
            reply="The AI agent is taking too long to respond. "
            "Please try a simpler question."
        )
    except Exception as e:
        return ChatResponse(reply=f"Sorry, I encountered an error: {str(e)}")


# ──────────────────────────────────────────────────────────────────────────────
# Streaming chat endpoint (SSE)
# ──────────────────────────────────────────────────────────────────────────────


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Send a message and stream the response token by token via Server-Sent Events.

    This gives a much better UX — the user sees text appearing in real time.
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # If complaints data is provided, update the complaint tool's data source
            if request.complaints:
                _update_complaint_data(request.complaints)

            # Use LangGraph's streaming to get step-by-step output
            full_response = ""

            # Run the graph and stream events
            for event in graph.stream(
                {
                    "messages": [
                        {"role": "user", "content": request.message}
                    ],
                    "next": "",
                }
            ):
                # Each event is a dict with node name as key
                for node_name, node_output in event.items():
                    if node_name == "supervisor":
                        # Supervisor routing decision — skip this for the user
                        continue

                    if "messages" in node_output:
                        for msg in node_output["messages"]:
                            if hasattr(msg, "content") and msg.content:
                                # Only send the final assistant message
                                content = msg.content
                                if content != request.message:
                                    full_response = content

            # Send the complete response as a single SSE event
            # (For true token streaming we'd need async LLM streaming,
            #  but this gives reliable multi-step agent output)
            if full_response:
                yield f"data: {json.dumps({'type': 'token', 'content': full_response})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'token', 'content': 'I could not generate a response. Please try again.'})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            error_msg = f"Sorry, I encountered an error: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# Complaint lookup endpoint
# ──────────────────────────────────────────────────────────────────────────────


@app.post("/api/complaints/lookup")
async def lookup_complaint(request: ComplaintRequest):
    """
    Look up a specific complaint by ID using the agent's complaint tool.
    """
    result = get_complaint_by_id(request.complaint_id)
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Helper: bridge frontend complaint data to the Python tool
# ──────────────────────────────────────────────────────────────────────────────

# In-memory cache of complaints from the frontend
_complaint_cache: list[dict] = []


def _update_complaint_data(complaints: list[dict]):
    """
    Update the complaint tool's data source with live data from the frontend.
    This bridges localStorage data from Next.js to the Python agent.
    """
    global _complaint_cache
    _complaint_cache = complaints

    # Write to complaints_test.json so the complaint_tool can read it
    data_file = Path(__file__).parent / "complaints_test.json"
    data_file.write_text(
        json.dumps(complaints, indent=2, default=str),
        encoding="utf-8",
    )


# ──────────────────────────────────────────────────────────────────────────────
# Run the server
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print(" Sanitation Co-Governance AI Agent — API Server")
    print("=" * 60)
    print(" Endpoints:")
    print("   POST /api/chat          — Full response")
    print("   POST /api/chat/stream   — Streaming (SSE)")
    print("   POST /api/complaints/lookup — Complaint lookup")
    print("   GET  /api/health        — Health check")
    print("=" * 60)

    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
        log_level="info",
    )
