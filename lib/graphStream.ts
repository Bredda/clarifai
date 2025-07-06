import { fetchEventSource } from "@microsoft/fetch-event-source";
import { GraphEvent } from "@/types/types";

interface GraphStreamHandlers {
  onComplete?(): void;
  onError?(error: Error): void;
  onEvent?(event: GraphEvent): void;
  onToken?(token: string): void;
  onClose?(): void;
}

export function createGraphStream({
  onComplete,
  onError,
  onEvent,
  onToken,
  onClose,
}: GraphStreamHandlers) {
  return async function complete({ content }: { content: string }) {
    const ctrl = new AbortController();
    console.log("Graph stream started with content:", content);
    await fetchEventSource("/api/clarify", {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
      openWhenHidden: false,

      signal: ctrl.signal,
      async onopen(res) {
        if (
          res.ok &&
          res.headers.get("content-type")?.includes("text/event-stream")
        ) {
          console.log("🔗 SSE connection opened");
          return;
        }
        throw new Error(`❌ Unexpected response: ${res.status}`);
      },
      onmessage(ev) {
        try {
          const data: { event: GraphEvent; done: boolean } = JSON.parse(
            ev.data
          );

          if (data.event.stepId === "token" && data.event.label) {
            onToken?.(data.event.label);
          } else if (data.event.stepId === "[DONE]") {
            ctrl.abort(); // Fin propre
            onComplete?.();
          } else {
            onEvent?.(data.event);
          }
        } catch (err) {
          console.error(
            "❌ Failed to parse SSE message, aborting stream",
            ev.data,
            err
          );
        }
      },
      onerror(ev) {
        ctrl.abort();
        const error =
          ev instanceof Error
            ? ev
            : new Error(
                `❌ SSE stream error: ${ev.message || "Unknown error"}`
              );
        console.error("Error on SSE stream", error);
        onError?.(error);
        throw error;
      },
      onclose() {
        onClose?.();
      },
    });
  };
}
