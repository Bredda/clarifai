from fastapi import FastAPI
from fastapi.responses import JSONResponse, Response
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Literal
from logger import logger
from ai import run_graph, Configuration, get_graph_as_png, stream_graph_events
from ai.schemas import AnalyzedSegment
from fastapi.responses import FileResponse, StreamingResponse
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()

app = FastAPI(
    title="ClarifAI", 
    version="0.1", 
    description="A deep search agent for analyzing claims and biases in text.")

origins = [
    "*",  # Allow all origins for development purposes
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- ENDPOINTS ---------
class HealthResponse(BaseModel):
    status: Literal["ok"]

# --------- HEALTH ENPOINT ---------
@app.get("/health", response_class=JSONResponse, response_model=HealthResponse, description="Health check endpoint")
def health_check():
    return JSONResponse(content={"status": "ok"}, status_code=200)

# --------- GRAPH VIZ ENPOINT ---------
@app.get("/analyze", description="Visualize the agent graph")
async def visualize__graph():
    return Response(content=get_graph_as_png(), media_type="image/png")

# --------- ANALYZE ENPOINT ---------
class AnalyzeRequest(BaseModel):
    content: str

class AnalyzeResponse(BaseModel):
    report: str
    details: list[AnalyzedSegment] = []

configuration = Configuration()
@app.post("/analyze", response_model=AnalyzeResponse)
async def execute_graph(payload: AnalyzeRequest):
    logger.debug(f"Received input: {payload.content}")
    response = await run_graph(payload.content, configuration)
    return AnalyzeResponse(
        report=response["report"],
        details=response.get("details", [])
    )

@app.post("/analyze-stream",)
async def execute_stream_graph(payload: AnalyzeRequest):
    logger.debug(f"Received input: {payload.content}")
    return StreamingResponse(
        stream_graph_events(payload.content, configuration),
        media_type="text/event-stream",
    )