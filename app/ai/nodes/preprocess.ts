import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GraphState } from "../graph";
import { GraphEvent } from "@/types/types";

export async function preprocess(state: GraphState) {
  console.debug("Preprocessing content...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: state.configuration.segmentsChunkSize,
    chunkOverlap: 0,
  });
  const chunks = await splitter.splitText(state.originalContent);

  const segments = chunks.map((content, index) => ({
    id: index,
    content,
  }));

  const event: GraphEvent = {
    stepId: "preprocess",
    label: "Content preprocessed",
    payload: {
      segments,
    },
  };

  return { segments, cleanedContent: state.originalContent, events: [event] };
}
