import { index } from "langchain/indexes";

export interface GrpahConfiguration {
  claimVerificationSource: "web" | "llm";
  extractClaimsModel: string;
  verifyClaimsModel: string;
  biasDetectionModel: string;
  agregationModel: string;
  segmentationMode: "recursive" | "semantic";
  segmentsChunkSize: number;
}

export interface Claim {
  content: string;
  verdict: "true" | "false" | "partially_true" | "unknown";
  explanation: string;
  source: string[];
}

export interface Bias {
  content: string;
  type: string;
  explanation: string;
  eli5: string;
}

export interface Segment {
  id: string;
  index: number;
  content: string;
  claims: Claim[];
  biases: Bias[];
}

export interface GraphEvent {
  stepId: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
}
