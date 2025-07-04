from langchain.chat_models import init_chat_model
from langchain.prompts import PromptTemplate

from ai.state import State
from ai.schemas import VerifiedClaims

prompt = PromptTemplate.from_template("""
Tu es un assistant chargé d’évaluer la véracité d’affirmations factuelles. Pour chaque affirmation, tu dois :

1. Indiquer si elle est globalement vraie, fausse, partiellement vraie, ou non vérifiable.
2. Donner une explication brève et factuelle.
3. Si possible, citer la source ou la connaissance utilisée.

Voici la liste des affirmations à analyser :
{claims}

Réponds au format suivant :
[
  {
    segment_id: "...",
    "claim": "...",
    "verdict": "true" | "false" | "partially_true" | "unverifiable",
    "explanation": "...",
    "sources": ["..."]
  },
  ...
]""")

async def verify_claims_web(state: State):
    """
    Verify the claims extracted from the content using only a ReAct Agent with web search capabilities.
    """
    model = state["configuration"].verify_claims_model
    llm = init_chat_model(model, model_provider="openai").with_structured_output(VerifiedClaims)
    formated_claims = ("\n").join( [f"segment_id: {claim.segment_id} - content: {claim.content}" for claim in state["claims"].items])
    response = prompt.pipe(llm).invoke({"claims": formated_claims}) 
    verified_claims = VerifiedClaims.model_validate(response)
    return {"verified_claims": verified_claims}