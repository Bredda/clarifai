import { PromptTemplate } from "@langchain/core/prompts";
import { GraphState } from "../graph";
import { initChatModel } from "langchain/chat_models/universal";
import { Segment } from "@/types/types";

const prompt = PromptTemplate.fromTemplate(`
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
    {biases}`);

function formatBiases(segments: Segment[]) {
  return segments
    .map((segment) => {
      return segment.biases
        .map(
          (bias) =>
            `- **${bias.type}** : ${bias.content} (explication : ${bias.explanation}, ELI5 : ${bias.eli5})`
        )
        .join("\n");
    })
    .filter((biases) => biases.length > 0)
    .join("\n\n");
}

function formatClaims(segments: Segment[]) {
  return segments
    .map((segment) => {
      return segment.claims
        .map(
          (claim) =>
            `- **${claim.verdict}** : ${claim.content} (explication : ${
              claim.explanation
            }, sources : ${claim.source.join(", ")})`
        )
        .join("\n");
    })
    .filter((claims) => claims.length > 0)
    .join("\n\n");
}
export async function reporter(state: GraphState) {
  const model = await initChatModel(state.configuration.agregationModel, {
    modelProvider: "openai",
    temperature: 0,
  });
  const chain = prompt.pipe(model.withConfig({ tags: ["reporter"] }));
  const response = await chain.invoke({
    verified_claims: formatClaims(state.segments),
    biases: formatBiases(state.segments),
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
  };
}
