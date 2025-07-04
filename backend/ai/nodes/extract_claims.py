from langchain.chat_models import init_chat_model
from langchain.prompts import PromptTemplate

from ai.state import State, GraphEvent
from ai.schemas import Claims
from logger import logger

prompt = PromptTemplate.from_template("""
Tu es un assistant chargé d'extraire les affirmations factuelles explicites contenues dans un texte.

Une affirmation factuelle :
- est une déclaration pouvant être vérifiée comme vraie ou fausse,
- est formulée de manière affirmative,
- n’est pas une simple opinion, une question ou un commentaire flou.

Tu vas recevoir une liste de segments. Pour chacun, décide s’il contient une affirmation factuelle, et si oui, extrait-la telle quelle (ou reformule-la légèrement si nécessaire pour qu’elle soit autonome et compréhensible hors contexte).

Renvoie uniquement la liste des affirmations factuelles détectées, sous forme de tableau JSON.

Exemple attendu :
[
  "Le vaccin X a été responsable de 400 effets secondaires en 2022.",
  "La température moyenne a augmenté de 1,1°C depuis 1900.",
  "L’article 15 du RGPD impose un droit d’accès aux données personnelles."
]

Segments:
{segments}
""")

async def extract_claims(state: State):
    """
    Extract claims from the provided segments using a language model.
    Args:
        state (State): The current state containing the configuration and segments.
    Returns:
        dict: An update of the state with the extracted claims.
    """
    logger.info("Extracting claims from segments...")
    model = state["configuration"].extract_claims_model
    llm = init_chat_model(model, model_provider="openai").with_structured_output(Claims)
    formated_segments = ("\n").join( [f"id: {segment.id} - content: {segment.content}" for segment in state["segments"]])
    response = prompt.pipe(llm).invoke({"segments": formated_segments}) 
    claims = Claims.model_validate(response) # Validate the response against the Claim schema
    logger.info(f"Extracted {len(claims.items)} claims from segments.")    

    event = GraphEvent(
        step="claims",
        data={
            "claims": [claim.model_dump() for claim in claims.items]
        }
    )

    return {"claims": claims,  "events": [event]}  # Return the claims in the expected format