from langchain.chat_models import init_chat_model
from langchain.prompts import PromptTemplate

from ai.state import State, GraphEvent
from ai.schemas import Biases
from logger import logger

prompt = PromptTemplate.from_template("""
Tu es un assistant chargé d’évaluer un texte et de détecter la présence de biais rédactionnels ou rhétoriques.

Un biais peut se manifester par :
- un langage émotionnel ou exagéré,
- une prise de position implicite ou explicite,
- une absence d’équilibre dans la présentation des faits,
- une généralisation abusive,
- une formulation tendancieuse ou ambigüe.

Pour chaque segment fourni, analyse son contenu et détermine s’il contient un ou plusieurs biais rédactionnels ou rhétoriques. 
Si le segment contient au moins un biais,  explique de quel type de biais il s’agit et justifie brièvement ta réponse.

Renvoie un tableau JSON contenant pour chaque segment contenant au moins un biais:
- l'identifiant du segment
- un champ `bias_type`: (émotionnel, idéologique, exagération, omission, autre…)
- un champ `explanation`: une justification brève et claire
                                      
Si le segment contient plusieurs biais, liste-les tous avec leurs justifications respectives.
Si le segment ne contient pas de biais, ignore-le.

Exemple de sortie :
[
  {{
    "id": "8",
    "content": La température moyenne a augmenté de 1°C depuis 1900.
    "bias_type": "idéologique",
    "explanation": "Accusation généralisée sans preuve ni nuance."
  }}
]

Segments:
{segments}
""")

async def detect_biases(state: State):
    """
    Detect biases in the provided segments using a language model.
    Args:
        state (State): The current state containing the configuration and segments.
    Returns:
        dict: An update of the state with the detected biases.
    """
    logger.info("Detecting biases in segments...")
    model = state["configuration"].extract_biases_model
    llm = init_chat_model(model, model_provider="openai").with_structured_output(Biases)
    formated_segments = ("\n").join( [f"id: {segment.id} - content: {segment.content}" for segment in state["segments"]])
    response = prompt.pipe(llm).invoke({"segments": formated_segments}) 
    biases = Biases.model_validate(response)  # Validate the response against the Biases schema
    logger.info(f"Detected {len(biases.items)} biases in segments.")

    event = GraphEvent(
        step="biases",
        data={
            "biases": [bias.model_dump() for bias in biases.items]
        }
    )


    return {"biases": biases, "events": [event]}  # Return the biases in the expected format