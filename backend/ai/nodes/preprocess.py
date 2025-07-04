from ai.state import State
from ai.schemas import Segment
from logger import logger
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ai.state import GraphEvent

async def preprocess(state: State):
    """
    Preprocess the input content by cleaning it and splitting it into segments.
    This function removes leading and trailing whitespace from the original content,
    and then splits the content into smaller chunks using a recursive text splitter.
    Each chunk is stored as a Segment object with a unique ID.
    Args:
        state (State): The current state containing the original content.
    Returns:
        dict: A state update with cleaned content and a list of segments.
    """
    logger.info("Preprocessing content for segments...")
    recursive_splitter = RecursiveCharacterTextSplitter(
    # Set a really small chunk size, just to show.
    chunk_size=state["configuration"].segments_chunk_size,
    chunk_overlap=0,
    length_function=len,
    is_separator_regex=False,
    )
    chunks = recursive_splitter.split_text(state["original_content"])
    segments = [Segment(content=chunk, id=id) for id, chunk in enumerate(chunks)]
    logger.info(f"Created {len(segments)} segments from the content.")

    event = GraphEvent(
        step="segments",
        data={
            "segments": [segment.model_dump() for segment in segments],
        }
    )

    return { "cleaned_content": state["original_content"].strip(), "segments": segments, "events": [event] }