import { buildGraph } from "@/ai/graph";
import { GraphEvent } from "@/types/types";
import { NextRequest } from "next/server";
export const config = {
  runtime: "edge", // pour rapidité
};

export async function POST(req: NextRequest) {
  const { content } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function emitEvent(event: GraphEvent, done = false) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event, done })}\n\n`)
          );
        } catch (err) {
          console.error("Error pushing SSE:", err);
          controller.error(err);
        }
      }
      try {
        const graph = buildGraph();
        for await (const chunk of await graph.stream(
          {
            originalContent: content,
            configuration: {
              claimVerificationSource: "web",
              extractClaimsModel: "gpt-4o-mini",
              verifyClaimsModel: "gpt-4o-mini",
              biasDetectionModel: "gpt-4o-mini",
              agregationModel: "gpt-4o-mini",
              segmentationMode: "recursive",
              segmentsChunkSize: 1000,
            },
          },
          {
            streamMode: ["updates", "messages"],
            debug: false,
          }
        )) {
          if (chunk[0] === "messages") {
            const [messageChunk, metadata] = chunk[1];
            if (!metadata.tags.includes("reporter") || !messageChunk.text)
              continue; // Ignore empty messages

            if (messageChunk.text) {
              emitEvent({
                stepId: "token",
                label: messageChunk.text,
                payload: messageChunk.text,
              });
            }
          } else if (chunk[0] === "updates") {
            const eventData = chunk[1];

            const nodeKey = Object.keys(eventData)[0];
            if (!nodeKey) continue; // No node key found

            const nodePayload = eventData[nodeKey];
            if (!nodePayload) continue; // No payload found for the node

            if (!nodePayload.events || nodePayload.events.length === 0)
              continue;
            emitEvent(nodePayload.events[0] as GraphEvent);
          }
        }
        emitEvent(
          { stepId: "[DONE]", label: "Pipeline terminé", payload: {} },
          true
        );
        controller.close();
      } catch (err) {
        console.error("Error executing the graph", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
