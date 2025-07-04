import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";
import { z } from "zod";
import { initChatModel } from "langchain/chat_models/universal";
import { Segment } from "next/dist/server/app-render/types";
import { GraphEvent } from "@/types/types";

const ClaimSchema = z.object({
  index: z
    .number()
    .describe(
      "The index of the segment in the original content, starting from 0"
    ),
  content: z
    .string()
    .describe("The content of the segment that contains a claim"),
});

type ExtractedClaim = z.infer<typeof ClaimSchema>;

const ClaimsSchema = z.object({
  claims: z.array(ClaimSchema).describe("Array of detected claims"),
});

const promptTemplate = PromptTemplate.fromTemplate(`
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
`);

export async function extractClaims(state: GraphState) {
  console.debug("Extracting claims in content...");

  const model = await initChatModel(state.configuration.extractClaimsModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(ClaimsSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    segments: state.segments.map((segment) => segment.content).join("\n"),
  });

  const segments: Segment[] = state.segments.map((segment, index) => {
    const claims = response.claims
      .filter((claim: ExtractedClaim) => claim.index === index)
      .map((claim: ExtractedClaim) => ({
        content: claim.content,
      }));
    return {
      ...segment,
      claims,
    };
  });
  const event: GraphEvent = {
    stepId: "extractClaims",
    label: "Claims extracted",
    payload: {
      segments,
    },
  };
  return { segments, events: [event] };
}
