// stores/clarifStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createGraphStream } from "@/lib/graphStream";
import { handleGraphEvent } from "@/lib/handleGraphEvent";

export type Annotation =
  | {
      type: "bias";
      start: number;
      end: number;
      data: {
        content: string;
        biasType: string;
        explanation: string;
        typeExplanation: string;
      };
    }
  | {
      type: "claim";
      start: number;
      end: number;
      data: {
        content: string;
        verdict: string;
        explanation: string;
        extractionExplanation: string;
        sources: string[];
        verified: boolean;
        index: number;
      };
    };

export interface ContentChunk {
  id: string;
  content: string;
  annotations: Annotation[]; // ← nouveau
}

export type GraphStep =
  | "preprocessing"
  | "detecting_biases"
  | "extracting_claims"
  | "verifying_claims"
  | "generating_report";
export type GraphStepStatus = "todo" | "in-progress" | "done" | "error";

export type GraphLogUpdate = {
  stepId: GraphStep;
  status: GraphStepStatus;
};

const fullyDoneGraphLog: Record<GraphStep, GraphStepStatus> = {
  preprocessing: "done",
  detecting_biases: "done",
  extracting_claims: "done",
  verifying_claims: "done",
  generating_report: "done",
};

const startClarifygraphLog: Record<GraphStep, GraphStepStatus> = {
  preprocessing: "in-progress",
  detecting_biases: "todo",
  extracting_claims: "todo",
  verifying_claims: "todo",
  generating_report: "todo",
};

type ClarifState = {
  chunks: ContentChunk[];
  extractedClaimsLength: number;
  hasSubmitted: boolean;
  processing: boolean;
  report: string | null;
  error: any;
  clarify: (content: string) => Promise<void>;
  updateGraphLog: (updates: GraphLogUpdate[]) => void;
  setFullReport: (report: string) => void;
  updateReportToken: (token: string) => void;
  reset: () => void;
  graphLog: typeof startClarifygraphLog;
};

export const useClarifStore = create<ClarifState>()(
  persist(
    (set, get) => ({
      chunks: [],
      hasSubmitted: false,
      processing: false,
      extractedClaimsLength: 0, // Initialize with 0
      error: null,
      report: null,
      graphLog: fullyDoneGraphLog,

      clarify: async (content: string) => {
        console.log("Store clarify started with:", content);
        const stream = createGraphStream({
          onEvent: handleGraphEvent,
          onToken: (token) => console.log(token),
          onError: (error) => set({ error }),
          onComplete: () => console.log("✔️ done"),
          onClose: () => console.log("stream closed"),
        });

        set({
          hasSubmitted: true,
          processing: true,
          error: null,
          chunks: [],
          graphLog: startClarifygraphLog,
        });

        try {
          await stream({ content });
          set({ processing: false });
        } catch (err) {
          console.error("Error during clarify:", err);
          set({
            error: err,
            processing: false,
            graphLog: startClarifygraphLog,
          });
        }
      },
      setFullReport: (report: string) => {
        set({ report });
      },
      updateReportToken: (token: string) => {
        set((state) => ({
          report: state.report ? state.report + token : token,
        }));
      },

      updateGraphLog: (updates) => {
        const currentLog = get().graphLog;
        const newLog = { ...currentLog };

        updates.forEach(({ stepId, status }) => {
          if (newLog[stepId as GraphStep] !== undefined) {
            newLog[stepId as GraphStep] = status;
          }
        });
        // Claims and biases are parallel steps and reduced to report generation
        // So we have to handle report generation status by ourself here
        if (
          newLog.generating_report === "todo" &&
          newLog.verifying_claims === "done" &&
          newLog.detecting_biases === "done"
        ) {
          newLog.generating_report = "in-progress";
        }

        set({ graphLog: newLog });
      },

      reset: () =>
        set({
          hasSubmitted: false,
          processing: false,
          report: null,
          error: null,
          chunks: [],
        }),
    }),
    {
      name: "clarifai-storage",
      partialize: (state) => ({
        chunks: state.chunks,
        hasSubmitted: state.hasSubmitted,
      }),
    }
  )
);
