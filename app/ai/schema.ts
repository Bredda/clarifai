import { z } from "zod";

export interface ExtractedSegment {
  id: number; // Unique identifier for the segment
  content: string;
}

export const ExtractedBiasSchema = z.object({
  index: z
    .number()
    .describe(
      "The index of the segment in the original content, starting from 0"
    ),
  content: z.string().describe("The content of the segment that contains bias"),
  bias_type: z
    .string()
    .describe(
      "The type of bias detected in the segment, e.g., emotional, ideological, exaggeration, omission, etc."
    ),
  explanation: z
    .string()
    .describe(
      "A brief and clear justification for the detected bias in the segment"
    ),
  type_explanation: z
    .string()
    .describe(
      "A pedagogical explanation of the principle of the detected bias type"
    ),
});

export type ExtractedBias = z.infer<typeof ExtractedBiasSchema>;

export const ExtractedBiasesSchema = z.object({
  biases: z.array(ExtractedBiasSchema).describe("Array of detected biases"),
});
