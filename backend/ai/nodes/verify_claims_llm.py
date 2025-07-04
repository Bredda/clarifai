from langchain.chat_models import init_chat_model
from langchain.prompts import PromptTemplate

from ai.state import State, GraphEvent
from ai.schemas import VerifiedClaims
from logger import logger

prompt = PromptTemplate.from_template("""
Tu es un assistant chargé d’évaluer la véracité d’affirmations factuelles. Pour chaque affirmation, tu dois :

1. Indiquer si elle est globalement vraie, fausse, partiellement vraie, ou non vérifiable.
2. Donner une explication brève et factuelle.
3. Si possible, citer la source ou la connaissance utilisée.

Voici la liste des affirmations à analyser :
{claims}

Réponds au format suivant :
[
  {{
    segment_id: "...",
    "claim": "...",
    "verdict": "true" | "false" | "partially_true" | "unverifiable",
    "explanation": "...",
    "sources": ["..."]
  }},
  ...
]""")

async def verify_claims_llm(state: State):
    """
    Verify the claims extracted from the content using only a LLM witouht external sources.
    """
    logger.info("Verifying claims using LLM...")
    model = state["configuration"].verify_claims_model
    llm = init_chat_model(model, model_provider="openai").with_structured_output(VerifiedClaims)
    response = prompt.pipe(llm).invoke({"claims": state["claims"].format_for_prompt()}) 
    verified_claims =VerifiedClaims.model_validate(response)  # Validate the response against the VerifiedClaims schema
    logger.info(f"Verified {len(verified_claims.items)} claims.")

    event = GraphEvent(
        step="claims",
        data={
            "claims": [verified_claim.model_dump() for verified_claim in verified_claims.items]
        }
    )


    return {"verified_claims": verified_claims, "events": [event]}  # Return the verified claims in the expected format