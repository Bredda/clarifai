import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { GraphEvent } from "@/types/types";
import { ExtractClaimListSchema, ExtractedClaim } from "../schema";

const promptTemplate = PromptTemplate.fromTemplate(`
Tu es un assistant chargé d'extraire les affirmations factuelles explicites contenues dans un texte.

Une affirmation factuelle :
- est une déclaration pouvant être vérifiée comme vraie ou fausse,
- est formulée de manière affirmative,
- n’est pas une simple opinion, une question ou un commentaire flou.

Tu vas recevoir une liste de segments. 
Pour chacun, décide s’il contient une affirmation factuelle, et si oui, extrait-la telle quelle.

Renvoie uniquement la liste des affirmations factuelles détectées, sous forme de tableau JSON.

Segments:
{segments}
`);

export async function extractClaims(state: GraphState): Promise<{
  extractedClaims: ExtractedClaim[] | undefined;
  events: GraphEvent[];
}> {
  console.debug("Extracting claims in content...");

  const model = await initChatModel(state.configuration.extractClaimsModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(ExtractClaimListSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    segments: state.segments
      .map((segment) => `id: ${segment.id} - ${segment.content}`)
      .join("\n"),
  });

  const extractedClaims =
    ExtractClaimListSchema.safeParse(response).data?.claims || [];
  const event: GraphEvent = {
    stepId: "extractClaims",
    label: "Claims extracted",
    payload: {
      claims: extractedClaims,
    },
  };
  console.debug(
    "Claims extracted:",
    extractedClaims?.length || "Claims undefined !!!"
  );
  return { extractedClaims, events: [event] };
}
