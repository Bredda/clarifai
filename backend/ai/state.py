
from typing import TypedDict, Any, Annotated
from operator import add
from ai.configuration import Configuration
from ai.schemas import Segment, Claims, VerifiedClaims, Biases, AnalyzedSegment

class GraphEvent(TypedDict):
    step: str
    data: dict[str, Any]

class State(TypedDict):
    configuration: Configuration
    original_content: str
    cleaned_content: str
    segments: list[Segment]
    claims: Claims
    
    biases: Biases
    verified_claims: VerifiedClaims
    report: str
    details: list[AnalyzedSegment]

    events: Annotated[list[GraphEvent], add]