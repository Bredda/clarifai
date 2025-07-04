from pydantic import BaseModel, Field
from typing import Literal

class Configuration(BaseModel):
    """The configuration for the agent."""
    extract_claims_model: str = Field(default="gpt-4o-mini", description="The name of the language model to use for extracting claims from the content.")
    verify_claims_model: str = Field(default="gpt-4o-mini", description="The name of the language model to use for verifying claims.")
    extract_biases_model: str = Field(default="gpt-4o-mini", description="The name of the language model to use for detecting biases in the content.")
    agregate_model: str = Field(default="gpt-4o", description="The name of the language model to use for the agent's answer.")
    segmentation_mode: Literal["recursive", "semantic"] = Field(default="recursive", description="The mode of segmentation to use for the content. Can be 'recursive' or 'semantic'.")
    claim_verification_source: Literal["llm", "web"] = Field(default="llm", description="The source to use for claim verification. Can be 'llm' for language model or 'web' for web search.")
    segments_chunk_size: int = Field(default=1000, description="The size of each segment chunk in characters when using recursive segmentation.")