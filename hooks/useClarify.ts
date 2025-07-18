import { fetchEventSource } from "@microsoft/fetch-event-source";
import { GraphEvent } from "@/types/types";

interface useClarifyProps {
  onComplete?(): void;
  onError?(error: Error): void;
  onEvent?(event: GraphEvent): void;
  onToken?(token: string): void;
  onClose?(): void;
}

export function useClarify({
  onComplete,
  onError,
  onEvent,
  onToken,
  onClose,
}: useClarifyProps) {
  async function complete({ content }: { content: string }) {
    const ctrl = new AbortController();
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
        const data: { event: GraphEvent; done: boolean } = JSON.parse(ev.data);
        if (data.event.stepId === "token" && data.event.label) {
          if (onToken) {
            onToken(data.event.label);
          }
        } else if (data.event.stepId === "[DONE]") {
          ctrl.abort();
          if (onComplete) {
            onComplete();
          }
        } else {
          console.log("🔄 Grpah event received", data.event);
          if (onEvent) onEvent(data.event);
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
        if (onError) {
          onError(error);
        }
        throw error;
      },
      onclose() {
        if (onClose) {
          onClose();
        }
      },
    });
  }

  return complete;
}
