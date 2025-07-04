from langfuse.langchain import CallbackHandler
from langfuse import Langfuse
from os import getenv



def setup_tracing():
    langfuse = Langfuse(
    secret_key=getenv("LANGFUSE_SECRET_KEY"),
    public_key=getenv("LANGFUSE_PUBLIC_KEY"),
    host="https://cloud.langfuse.com"
    )
    return CallbackHandler()