import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { ExtractedBias, ExtractedVerifiedClaim } from "../schema";

const prompt = PromptTemplate.fromTemplate(`
    Tu es un analyste assistant chargé d'évaluer la fiabilité d'un document.

    Tu recevras :
    - Une liste d'affirmations extraites du texte, avec des informations de vérification (vrai, faux, incertain).
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
    {biases}`);

function formatBiases(biases: ExtractedBias[]) {
  return biases
    .map((bias) => `- **${bias.biasType}** : ${bias.content}`)
    .join("\n");
}

function formatClaims(claims: ExtractedVerifiedClaim[]) {
  return claims
    .map(
      (claim) =>
        `- **${claim.verdict}** : ${claim.content} (explication : ${
          claim.explanation
        }, sources : ${claim.sources.join(", ")})`
    )
    .join("\n");
}
export async function reporter(state: GraphState) {
  console.debug("Generating report...");
  if (!state.verifiedClaims || !state.extractedBiases) {
    throw new Error("No verified claims or biases to report on.");
  }

  const model = await initChatModel(state.configuration.agregationModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const chain = prompt.pipe(model.withConfig({ tags: ["reporter"] }));
  const response = await chain.invoke({
    verified_claims: formatClaims(state.verifiedClaims),
    biases: formatBiases(state.extractedBiases),
  });

  const event = {
    stepId: "reporter",
    label: "Report generated",
    payload: {
      report: response.content,
    },
  };

  return {
    report: response.content,
    events: [event],
  };
}
