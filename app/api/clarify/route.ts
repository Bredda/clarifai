import { buildGraph } from "@/ai/graph";
import { GraphEvent } from "@/types/types";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    console.log("RAW INPUT 🔍", raw);
    if (!raw) {
      console.error("❌ Empty request body");
      return new Response("Empty body", { status: 400 });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Invalid JSON format");
      return new Response("Invalid JSON", { status: 400 });
    }

    const content = parsed?.content;
    if (!content || typeof content !== "string") {
      return new Response("Invalid content", { status: 400 });
    }

    const encoder = new TextEncoder();
    const crtl = new AbortController();
    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;

        function safeEmit(event: GraphEvent, done = false) {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ event, done })}\n\n`)
            );
            closed = done;
          } catch (err) {
            console.error("Error pushing SSE:", err);
            closed = true;
            controller.error(err);
          }
        }
        try {
          const graph = buildGraph();
          for await (const chunk of await graph.stream(
            {
              originalContent: content,
              configuration: {
                claimVerificationSource: "llm",
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
              signal: crtl.signal,
            }
          )) {
            if (chunk[0] === "messages") {
              const [messageChunk, metadata] = chunk[1];
              if (!metadata.tags.includes("reporter") || !messageChunk.text)
                continue; // Ignore empty messages

              if (messageChunk.text) {
                safeEmit({
                  stepId: "token",
                  label: messageChunk.text,
                  payload: messageChunk.text,
                });
              }
            } else if (chunk[0] === "updates") {
              const eventData = chunk[1];

              const nodeKey = Object.keys(eventData)[0];
              if (!nodeKey) continue; // No node key found

              const nodePayload = eventData[nodeKey as keyof typeof eventData];
              if (!nodePayload) continue; // No payload found for the node

              if (!nodePayload.events || nodePayload.events.length === 0)
                continue;
              safeEmit(nodePayload.events[0] as GraphEvent);
            }
          }
          safeEmit(
            { stepId: "[DONE]", label: "Pipeline terminé", payload: {} },
            true
          );
          if (!closed) {
            controller.close();
            closed = true;
          }
        } catch (err) {
          console.error("Error executing graph", err);
          crtl.abort();
          if (!closed) controller.error(err);
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
  } catch (e) {
    console.error("❌ Parse error", e);
    return new Response("Parse error", { status: 400 });
  }
}
