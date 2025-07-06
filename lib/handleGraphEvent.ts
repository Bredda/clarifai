import { useClarifStore } from "@/stores/clarify.store";
import { GraphEvent } from "@/types/types";

export function handleGraphEvent(event: GraphEvent) {
  switch (event.stepId) {
    case "token": {
      console.log("token event:", event);
      useClarifStore.getState().updateReportToken(event.payload);
      break;
    }

    case "preprocess": {
      const segments = event.payload.segments;
      const newChunks = segments.map((segment: any) => ({
        id: segment.id,
        content: segment.content,
        annotations: [],
      }));

      useClarifStore.getState().updateGraphLog([
        { stepId: "preprocessing", status: "done" },
        { stepId: "extracting_claims", status: "in-progress" },
        { stepId: "detecting_biases", status: "in-progress" },
      ]);

      useClarifStore.setState((state) => ({
        chunks: [...state.chunks, ...newChunks],
      }));
      break;
    }

    case "detectBiases": {
      const biases: any[] = event.payload.biases;
      console.debug("Biases detected:", biases);
      useClarifStore
        .getState()
        .updateGraphLog([{ stepId: "detecting_biases", status: "done" }]);

      useClarifStore.setState((state) => ({
        chunks: state.chunks.map((chunk) => {
          // Filter biases relevant to this chunk
          const relevantBiases = biases.filter(
            (bias) => bias.segmentId === chunk.id
          );
          console.debug("Relevant biases for chunk:", relevantBiases);
          if (relevantBiases.length === 0) return chunk;

          const newAnnotations = relevantBiases
            .map((bias) => {
              const start = chunk.content.indexOf(bias.content);
              const end = start + bias.content.length;
              if (start === -1) {
                console.warn("bias substring not found:", bias.content);
                return null;
              }
              return { start, end, type: "bias" as const, data: bias };
            })
            .filter((x) => x !== null);
          console.debug("New bias annotations:", newAnnotations);
          return {
            ...chunk,
            annotations: [...chunk.annotations, ...newAnnotations],
          };
        }),
      }));
      break;
    }

    case "extractClaims": {
      const claims: any[] = event.payload.claims;

      useClarifStore.getState().updateGraphLog([
        { stepId: "extracting_claims", status: "done" },
        { stepId: "verifying_claims", status: "in-progress" },
      ]);
      console.debug("Claims extracted:", claims);
      useClarifStore.setState((state) => ({
        extractedClaimsLength: claims.length,
      }));
      break;
    }

    case "verifyClaims": {
      // à implémenter proprement selon payload (claims enrichis ?)
      console.debug("Verifying claims...", event.payload);
      const claims: any[] = event.payload.claims || [];

      useClarifStore
        .getState()
        .updateGraphLog([{ stepId: "verifying_claims", status: "done" }]);
      useClarifStore.setState((state) => ({
        chunks: state.chunks.map((chunk) => {
          const relevantClaims = claims.filter(
            (claim) => claim.segmentId === chunk.id
          );
          console.debug("Relevant claims for chunk:", relevantClaims);
          if (relevantClaims.length === 0) return chunk;

          const newAnnotations = relevantClaims
            .map((claim) => {
              const start = chunk.content.indexOf(claim.content);
              const end = start + claim.content.length;
              if (start === -1) {
                console.warn("claim substring not found:", claim.content);
                return null;
              }
              return { start, end, type: "claim" as const, data: claim };
            })
            .filter((x) => x !== null);
          return {
            ...chunk,
            annotations: [...chunk.annotations, ...newAnnotations],
          };
        }),
      }));

      break;
    }

    case "reporter": {
      const { report } = event.payload;
      console.debug("Report generated:", report);
      useClarifStore
        .getState()
        .updateGraphLog([{ stepId: "generating_report", status: "done" }]);
      useClarifStore.getState().setFullReport(report);
      break;
    }

    default:
      console.warn("Unhandled event:", event);
  }
}
