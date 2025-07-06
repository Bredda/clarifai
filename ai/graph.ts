import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { GraphEvent, GrpahConfiguration } from "@/types/types";
import { preprocess } from "./nodes/preprocess";
import { extractClaims } from "./nodes/extractClaims";
import { verifyClaimsWeb } from "./nodes/verifyClaimsWeb";
import { verifyClaimsLlm } from "./nodes/verifyClaimsLlm";
import { detectBiases } from "./nodes/detectBiases";
import { reporter } from "./nodes/reporter";
import {
  ExtractedBias,
  ExtractedClaim,
  ExtractedSegment,
  ExtractedVerifiedClaim,
} from "./schema";

const arrayReducer = <T>(left: T[], right: T[]) => left.concat([...right]);
const defaultArray = <T>() => [] as T[];
const arrayOptions = {
  reducer: arrayReducer,
  default: defaultArray,
};

const GraphAnnotation = Annotation.Root({
  originalContent: Annotation<string>(), // Initial input from caller
  cleanedContent: Annotation<string>(), // Cleaned content after preprocessing
  configuration: Annotation<GrpahConfiguration>(),
  segments: Annotation<ExtractedSegment[]>(arrayOptions), // Segments of the content
  extractedBiases: Annotation<ExtractedBias[]>(arrayOptions), // Biases detected in the content
  extractedClaims: Annotation<ExtractedClaim[]>(arrayOptions), // Claims extracted from the content
  verifiedClaims: Annotation<ExtractedVerifiedClaim[]>(arrayOptions), // Model used for claims verification
  report: Annotation<string>(), // Final answer to the query
  events: Annotation<GraphEvent[]>(arrayOptions), // Event for ui display
});

export type GraphState = typeof GraphAnnotation.State;

function continueToClaimsVerification(state: GraphState) {
  // If no claims are extracted, we end the graph. If the configuration specifies web verification, we proceed to that step.
  // Otherwise, we proceed to LLM verification.
  if (state.extractedClaims.length === 0) {
    console.log("No claims extracted, bypassing claims verification.");

    return "no_claims";
  }
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
    .addNode("reporter", reporter, { defer: true })

    .addEdge(START, "preprocess")
    .addEdge("preprocess", "extractClaims")
    .addEdge("preprocess", "detectBiases")

    .addConditionalEdges("extractClaims", continueToClaimsVerification, {
      verifyClaimsWeb: "verifyClaimsWeb",
      verifyClaimsLlm: "verifyClaimsLlm",
      no_claims: "reporter",
    })
    .addEdge("verifyClaimsLlm", "reporter")
    .addEdge("verifyClaimsWeb", "reporter")
    .addEdge("detectBiases", "reporter")
    .addEdge("reporter", END);

  return workflow.compile();
}
