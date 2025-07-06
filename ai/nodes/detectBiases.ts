import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";

import { initChatModel } from "langchain/chat_models/universal";
import { GraphEvent } from "@/types/types";
import { ExtractedBias, ExtractedBiasesSchema } from "../schema";

const promptTemplate = PromptTemplate.fromTemplate(`

Tu es un assistant chargé d’évaluer un texte et de détecter la présence de biais rédactionnels ou rhétoriques.

Un biais peut se manifester par :
- un langage émotionnel ou exagéré,
- une prise de position implicite ou explicite,
- une absence d’équilibre dans la présentation des faits,
- une généralisation abusive,
- une formulation tendancieuse ou ambigüe.

Pour chaque segment fourni, analyse son contenu et détermine s’il contient un ou plusieurs biais rédactionnels ou rhétoriques. 
Ne produit pas d'overlap entre les biais, chaque biais doit être clairement découpé.
Si le segment contient un biais, extrait les  et renvoie un tableau JSON contenant pour chaque segment les biais détectés, avec les champs suivants :
- l'identifiant du segment
- le contenu du segment contenant le biais, sois le plus précis possible dans le contenu ciblé, n'inclut pas le segment entier si le biais est dans une partie spécifique
- le type de biais (émotionnel, idéologique, exagération, omission, autre… - liste non exhaustive)
- une justification brève et claire
- une explication pédagogique du principe du type de biais détecté

                                      
Si le segment contient plusieurs biais, liste-les tous avec leurs justifications respectives.
Si le segment ne contient pas de biais, ignore-le.

Segments:
{segments}
`);

export async function detectBiases(state: GraphState): Promise<{
  extractedBiases: ExtractedBias[] | undefined;
  events: GraphEvent[];
}> {
  console.debug("Detecting biases in content...");

  const model = await initChatModel(state.configuration.biasDetectionModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(ExtractedBiasesSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    segments: state.segments
      .map((segment) => `id: ${segment.id} - ${segment.content}`)
      .join("\n"),
  });
  const extractedBiases =
    ExtractedBiasesSchema.safeParse(response).data?.biases || [];
  const event: GraphEvent = {
    stepId: "detectBiases",
    label: "Biases detected",
    payload: { biases: extractedBiases },
  };
  console.debug(
    "Biases detected:",
    extractedBiases?.length || "Biases undefined !!!"
  );
  return { extractedBiases, events: [event] };
}
