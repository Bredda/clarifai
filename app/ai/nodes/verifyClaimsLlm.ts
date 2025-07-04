import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";
import { z } from "zod";
import { initChatModel } from "langchain/chat_models/universal";
import { Segment } from "@/types/types";

const VerifiedClaimSchema = z.object({
  index: z
    .number()
    .describe(
      "The index of the segment in the original content, starting from 0"
    ),
  content: z
    .string()
    .describe("The content of the segment that contains a claim"),
  verdict: z
    .string()
    .describe(
      "The verdict of the claim: true, false, partially_true, or unverifiable"
    ),
  explanation: z
    .string()
    .describe("A brief and factual explanation of the verdict"),
  sources: z
    .array(z.string())
    .describe("List of sources or knowledge used to verify the claim"),
});

type ExtractedVerifiedClaim = z.infer<typeof VerifiedClaimSchema>;

const VerifiedClaimsSchema = z.object({
  claims: z.array(VerifiedClaimSchema).describe("Array of verified claims"),
});

const promptTemplate = PromptTemplate.fromTemplate(`
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
]
  `);

export async function verifyClaimsLlm(state: GraphState) {
  console.debug("Detecting biases in content...");

  const model = await initChatModel(state.configuration.verifyClaimsModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const structuredModel = model.withStructuredOutput(VerifiedClaimsSchema);
  const chain = promptTemplate.pipe(structuredModel);

  const response = await chain.invoke({
    claims: state.segments.map((claim) => claim.content).join("\n"),
  });

  const segments: Segment[] = state.segments.map((segment, index) => {
    const claims = response.claims
      .filter((claim: ExtractedVerifiedClaim) => claim.index === index)
      .map((claim: ExtractedVerifiedClaim) => ({
        content: claim.content,
      }));
    return {
      ...segment,
      claims,
    };
  });

  const event = {
    stepId: "verifyClaims",
    label: "Claims verified",
    payload: {
      segments,
    },
  };

  return { segments, events: [event] };
}
