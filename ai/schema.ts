import { z } from "zod";

/**
 * Schema for a single segment of text extracted from the original content.
 * Each segment is identified by a unique ID and contains the text content.
 */
export interface ExtractedSegment {
  id: number; // Unique identifier for the segment
  content: string;
}

/*********************************
 * BIAS DETECTION SCHEMAS
 *********************************/

/**
 * Schema for a single bias extracted from a segment of text.
 * Each bias includes the index of the segment, the content of the segment,
 * the type of bias detected, a brief explanation, and a pedagogical explanation
 * of the bias type.
 */
export const ExtractedBiasSchema = z.object({
  segmentId: z
    .number()
    .describe(
      "The identifier of the segment from which the bias was extracted"
    ),
  content: z.string().describe("The content of the segment that contains bias"),
  biasType: z
    .string()
    .describe(
      "The type of bias detected in the segment, e.g., emotional, ideological, exaggeration, omission, etc."
    ),
  explanation: z
    .string()
    .describe(
      "A brief and clear justification for the detected bias in the segment"
    ),
  typeExplanation: z
    .string()
    .describe(
      "A pedagogical explanation of the principle of the detected bias type"
    ),
});

/**
 * Schema for a collection of biases extracted from the content.
 * It contains an array of ExtractedBias objects.
 */
export type ExtractedBias = z.infer<typeof ExtractedBiasSchema>;

/**
 * Schema for the response containing an array of detected biases.
 * This schema is used to validate the output of the bias detection process.
 */
export const ExtractedBiasesSchema = z.object({
  biases: z.array(ExtractedBiasSchema).describe("Array of detected biases"),
});

/*********************************
 * CLAIMS EXTRACTION SCHEMAS
 *********************************/

const ExtractClaimSchema = z.object({
  segmentId: z
    .number()
    .describe(
      "The identifier of the segment from which the claims was extracted"
    ),
  index: z
    .number()
    .describe(
      "The index of the claim within the segment, useful for ordering claims"
    ),
  content: z
    .string()
    .describe("The content of the segment that contains a claim"),
  explanation: z
    .string()
    .describe(
      "A brief and clear explanation of why the content maybe or is a claim, if applicable"
    ),
});

export type ExtractedClaim = z.infer<typeof ExtractClaimSchema>;

export const ExtractClaimListSchema = z.object({
  claims: z.array(ExtractClaimSchema).describe("Array of detected claims"),
});

/*********************************
 * CLAIMS VERIFICATION SCHEMAS
 *********************************/

export const VerifiedClaimSchema = z.object({
  segmentId: z
    .number()
    .describe(
      "The identifier of the segment from which the claims was extracted"
    ),
  index: z
    .number()
    .describe(
      "The index of the claim within the segment, useful for ordering claims"
    ),
  content: z
    .string()
    .describe("The content of the segment that contains a claim"),
  verdict: z
    .enum(["true", "false", "partially_true", "unverifiable"])
    .describe(
      "The verdict of the claim: true, false, partially_true, or unverifiable"
    ),
  explanation: z
    .string()
    .describe("A brief and factual explanation of the verdict"),
  sources: z
    .array(z.string())
    .describe("List of sources or knowledge used to verify the claim"),
});

export type ExtractedVerifiedClaim = z.infer<typeof VerifiedClaimSchema>;

export const VerifiedClaimListSchema = z.object({
  claims: z.array(VerifiedClaimSchema).describe("Array of verified claims"),
});
