import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { GraphEvent, GrpahConfiguration } from "@/types/types";
import { Segment } from "next/dist/server/app-render/types";
import { preprocess } from "./nodes/preprocess";
import { extractClaims } from "./nodes/extractClaims";
import { verifyClaimsWeb } from "./nodes/verifyClaimsWeb";
import { verifyClaimsLlm } from "./nodes/verifyClaimsLlm";
import { detectBiases } from "./nodes/detectBiases";
import { reporter } from "./nodes/reporter";
import { ExtractedBias, ExtractedSegment } from "./schema";

const GraphAnnotation = Annotation.Root({
  originalContent: Annotation<string>(), // Initial input from caller
  cleanedContent: Annotation<string>(), // Cleaned content after preprocessing
  configuration: Annotation<GrpahConfiguration>(),
  segments: Annotation<ExtractedSegment[]>(), // Segments of the content
  biases: Annotation<ExtractedBias[]>(), // Biases detected in the content
  claims: Annotation<Extract[]>(), // Claims extracted from the content

  report: Annotation<string>(), // Final answer to the query
  events: Annotation<GraphEvent[]>({
    reducer: (left: GraphEvent[], right: GraphEvent[]) =>
      left.concat([...right]),
    default: () => [],
  }), // Event for ui display
});

export type GraphState = typeof GraphAnnotation.State;

function continueToClaimsVerification(state: GraphState) {
  // If no claims are extracted, we end the graph. If the configuration specifies web verification, we proceed to that step.
  // Otherwise, we proceed to LLM verification.
  if (state.segments.length === 0) return "no_claims";
  if (state.configuration.claimVerificationSource === "web") {
    return "verifyClaimsWeb";
  }
  return "verifyClaimsLlm";
}

export function buildGraph() {
  // Define a new graph
  const workflow = new StateGraph(GraphAnnotation)
    .addNode("preprocess", preprocess)
    .addNode("extractClaims", extractClaims)
    .addNode("verifyClaimsWeb", verifyClaimsWeb)
    .addNode("verifyClaimsLlm", verifyClaimsLlm)
    .addNode("detectBiases", detectBiases)
    .addNode("reporter", reporter)

    .addEdge(START, "preprocess")
    .addEdge("preprocess", "extractClaims")
    .addEdge("preprocess", "detectBiases")

    .addConditionalEdges("extractClaims", continueToClaimsVerification)
    .addEdge("verifyClaimsLlm", "reporter")
    .addEdge("verifyClaimsWeb", "reporter")
    .addEdge("detectBiases", "reporter")
    .addEdge("reporter", END);

  return workflow.compile();
}
