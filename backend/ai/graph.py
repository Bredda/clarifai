import os

from dotenv import load_dotenv
import os
from langchain_core.messages import AIMessageChunk
from dotenv import load_dotenv
from langgraph.graph import StateGraph
from langgraph.graph import START, END

from ai.state import State
from ai.configuration import Configuration
from ai.nodes import (
    preprocess,
    detect_biases,
    extract_claims,
    verify_claims_llm,
    verify_claims_web,
    aggregate_verdict,
    export_report
)
from typing import Any, List, Optional
from ai.observability import setup_tracing
from logger import logger
import json
import asyncio
load_dotenv()

if os.getenv("OPENAI_API_KEY") is None:
    raise ValueError("OPENAI_API_KEY is not set")

def continue_to_verify_claims(state: State):
    """
    Determine whether to continue to the claim verification step based on the configuration and extracted claims.
    If no claims are extracted, we end the graph. If the configuration specifies web verification, we proceed to that step.
    Otherwise, we proceed to LLM verification.
    """
    if len(state["claims"].items) == 0:
        return 'no_claims'
    if state["configuration"].claim_verification_source == "web":
        return 'web_verification'
    return 'llm_verification'

# Create our Agent Graph
builder = StateGraph(State, config_schema=Configuration)

# Define the nodes we will cycle between
builder.add_node("preprocess", preprocess)
builder.add_node("detect_biases", detect_biases)
builder.add_node("extract_claims", extract_claims)
builder.add_node("verify_claims_llm", verify_claims_llm)
builder.add_node("verify_claims_web", verify_claims_web)
builder.add_node("aggregate_verdict", aggregate_verdict, defer=True) # Defer aggregation until all claims are verified
builder.add_node("export_report", export_report)

# Build the graph structure
builder.add_edge(START, "preprocess")
# Parallelize the preprocessing step with the detection of biases and extraction|verification of claims
builder.add_edge("preprocess", "detect_biases")
builder.add_edge("preprocess", "extract_claims")
# Add a conditional edge to verify claims based on the configuration
builder.add_conditional_edges(
    "extract_claims",
    continue_to_verify_claims,
    {
        'no_claims': "aggregate_verdict",  # If no claims are extracted, verification is skipped
        'web_verification': "verify_claims_web",  # If web verification is needed
        'llm_verification': "verify_claims_llm"  # If LLM verification is needed
    }
)
# Finally fan out the two branches to the verdict aggregation step
builder.add_edge("detect_biases", "aggregate_verdict")
builder.add_edge("verify_claims_llm", "aggregate_verdict")
builder.add_edge("verify_claims_web", "aggregate_verdict")
builder.add_edge("aggregate_verdict", "export_report")
# Finalize the answer
builder.add_edge("export_report", END)

graph = builder.compile(name="myth-buster-ai")

async def run_graph(input: str, configuration: Configuration):
    """Run the graph with the given input and configuration."""
    response = await graph.ainvoke({
        "original_content": input,
        "configuration": configuration,
        "claims": [],
        "biases": [],
        "verified_claims": [],
    })
    return response

def get_graph_as_png():
    return graph.get_graph().draw_mermaid_png()


def format_sse(data: Any, event: Optional[str] = None) -> str:
    """
    Format data and event to string for SSE message
    """
    msg = ""
    if event:
        msg += f"event: {event}\n"
    msg += f"data: {json.dumps(data)}\n\n"
    return msg


# === Streaming runner ===
async def stream_graph_events(
input: str, configuration: Configuration

):
    """
    Invoke and stream events from the graph and yield them as SSE messages.
    Args:
        graph: The graph to stream events from.
        initial_state: The initial state to start the graph with.
        token_node: The node to stream tokens from.
        thread_id: The thread ID for the graph.
        observability: Whether to set up observability tracing.
        callbacks: Optional callbacks to be used in the graph.
    Yields:
        str: The formatted SSE message.
    """


    async for mode, chunk in graph.astream({
        "original_content": input,
        "configuration": configuration,
    }, stream_mode=["updates", "messages"]):

        if (mode == "messages" ):
            msg, metadata = chunk
            if (msg and isinstance(msg, AIMessageChunk) and metadata["langgraph_node"] == "aggregate_verdict"):
                yield format_sse(msg.content, event="completion-token")
        elif (mode == "updates"):
            for node_name, node_data in chunk.items():
                if not isinstance(node_data, dict):
                    continue
                node_events = node_data.get("events", [])
                
                yield format_sse({"events": node_events}, event="node-update")

    yield format_sse("", event="completed")