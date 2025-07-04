from langchain.chat_models import init_chat_model
from langchain.prompts import PromptTemplate

from ai.state import State
from ai.schemas import AnalyzedSegment
from logger import logger

prompt = PromptTemplate.from_template("""
    Tu es un analyste assistant chargé d'évaluer la fiabilité d'un document.

    Tu recevras :
    - Une liste d'affirmations extraites du texte, avec leur statut de vérification (vrai, faux, incertain).
    - Une liste de biais détectés dans le texte.

    Ta tâche est de produire un rapport de synthèse structuré et compréhensible pour un utilisateur non-expert, avec :
    - Une évaluation générale de la fiabilité du texte.
    - Les points d’attention ou de doute.
    - Un résumé concis des biais éventuels.
    - Un ton neutre et factuel.

    Voici les éléments extraits du document :

    ### Affirmations et statuts :
    {verified_claims}

    ### Biais détectés :
    {biases}""")

def agregate_by_segment(state: State) -> list[AnalyzedSegment]:
    """
    Agrège les vérifications des affirmations factuelles et les biais par segment.

    Args:
        verified_claims (VerifiedClaims): Les vérifications des affirmations factuelles.
        biases (Biases): Les biais détectés dans le texte.

    Returns:
        list[AnalyzedSegment]: Liste des segments analysés avec leurs affirmations et biais.
    """

    aggregated = {}
    for claim in state["verified_claims"].items:
        segment_id = claim.segment_id
        if segment_id not in aggregated:
            aggregated[segment_id] = AnalyzedSegment(content="", id=segment_id)
        aggregated[segment_id].claims.append(claim)

    for bias in state["biases"].items:
        segment_id = bias.segment_id
        if segment_id not in aggregated:
            aggregated[segment_id] = AnalyzedSegment(content="", id=segment_id)
        aggregated[segment_id].biases.append(bias)

    return list(aggregated.values())

async def aggregate_verdict(state: State):
    """ Aggregate the verdicts from verified claims and biases into a comprehensive report.
    Args:
        state (State): The current state containing verified claims and biases.
    Returns:
        dict: A state update containing the aggregated verdicts and details by segment.
    """
    logger.info("Aggregating verdicts from verified claims and biases...")
    model = state["configuration"].agregate_model
    llm = init_chat_model(model, model_provider="openai")
    verified_claims = state["verified_claims"].format_for_prompt() if len(state["verified_claims"].items)>0 else "Aucune affirmation vérifiée."
    response = prompt.pipe(llm).invoke({
        "verified_claims": verified_claims, 
        "biases": state["biases"].format_for_prompt()}) 
    logger.info("Aggregated verdicts successfully.")
    return {"report": str(response.content), "details": agregate_by_segment(state)}