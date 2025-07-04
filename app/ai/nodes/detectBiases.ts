import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";

import { initChatModel } from "langchain/chat_models/universal";
import { Bias, GraphEvent, Segment } from "@/types/types";

const promptTemplate = PromptTemplate.fromTemplate(`

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
- un champ bias_type: (émotionnel, idéologique, exagération, omission, autre…)
- un champ explanation: une justification brève et claire
- un champ type_explanation: une explication pédagogique du principe du type de biais détecté
                                      
Si le segment contient plusieurs biais, liste-les tous avec leurs justifications respectives.
Si le segment ne contient pas de biais, ignore-le.

Exemple de sortie :
[
  {{
    "content": La température moyenne a augmenté de 1°C depuis 1900.
    "bias_type": "idéologique",
    "explanation": "Accusation généralisée sans preuve ni nuance."
    "type_explanation": "Ce biais consiste à faire des généralisations hâtives sans preuves concrètes, ce qui peut induire en erreur le lecteur."}}
]

Segments:
{segments}
`);

export async function detectBiases(state: GraphState) {
  console.debug("Detecting biases in content...");

  const model = await initChatModel(state.configuration.biasDetectionModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(BiasesSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    segments: state.segments.map((segment) => segment.content).join("\n"),
  });

  const segments: Segment[] = state.segments.map((segment, index) => {
    const biases = response.biases
      .filter((bias: ExtractedBias) => bias.index === index)
      .map((bias: ExtractedBias) => ({
        content: segment.content,
        type: bias.bias_type,
        explanation: bias.explanation,
        eli5: bias.type_explanation,
      }));
    return {
      ...segment,
      biases,
    };
  });
  const event: GraphEvent = {
    stepId: "detectBiases",
    label: "Biases detected",
    payload: {
      segments,
    },
  };
  return { segments, events: [event] };
}
