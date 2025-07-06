import { Fragment, ReactNode } from "react";
import { Annotation } from "@/stores/clarify.store";
import { cn } from "./utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ClaimCard({ data }: { data: any }): ReactNode {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Claim {data.verdict}</CardTitle>
        <CardDescription>{data.content}</CardDescription>
      </CardHeader>
      <CardContent>{data.explanation}</CardContent>
    </Card>
  );
}

function BiasCard({ data }: { data: any }): ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bias {data.biasType}</CardTitle>
        <CardDescription>{data.content}</CardDescription>
      </CardHeader>
      <CardContent>{data.explanation}</CardContent>
    </Card>
  );
}
export function applyAnnotations(
  content: string,
  annotations: Annotation[]
): ReactNode[] {
  if (!Array.isArray(annotations) || annotations.length === 0) {
    return [content];
  }

  const parts: ReactNode[] = [];

  // Step 1 : Extract unique split points using a Set to avoid duplicates
  const splitPoints = new Set<number>();
  splitPoints.add(0); // Always include start of content
  splitPoints.add(content.length); // Always include end of content
  for (const ann of annotations) {
    splitPoints.add(ann.start);
    splitPoints.add(ann.end);
  }

  const sortedPoints = Array.from(splitPoints).sort((a, b) => a - b);
  console.debug("Split points:", splitPoints);
  let chunkIndex = 0;
  // Step2 : Iterate over fragments based on these points
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    const text = content.slice(start, end);
    console.debug(`Fragment from ${start} to ${end}:`, text);
    if (!text) continue;

    // Step 3 : Get annotations for this fragment
    const framentAnnotations = annotations.filter(
      (ann) => ann.start < end && ann.end > start
    );
    console.debug(
      `Annotations for fragment ${start}-${end}:`,
      framentAnnotations
    );
    // If no annotations, just add the text as a fragment
    if (framentAnnotations.length === 0) {
      parts.push(
        <Fragment key={`${chunkIndex}`}>
          <span>{text}</span>
        </Fragment>
      );
      continue;
    }

    // Step 4 : Apply styles based on annotations
    const isBias = framentAnnotations.some((a) => a.type === "bias");
    const isClaimTrue = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "true"
    );
    const isClaimFalse = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "false"
    );
    const isClaimPartiallyTrue = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "partially_true"
    );
    const isClaimUnverifiable = framentAnnotations.some(
      (a) => a.type === "claim" && a.data.verdict === "unverifiable"
    );
    console.debug(
      `Styles for fragment ${start}-${end}: isBias=${isBias}, isClaimTrue=${isClaimTrue}, isClaimFalse=${isClaimFalse}, isClaimPartiallyTrue=${isClaimPartiallyTrue}, isClaimUnverifiable=${isClaimUnverifiable}`
    );
    // Step 4a: Construct popup text

    const popOverParts: ReactNode[] = [];

    framentAnnotations.forEach((a) => {
      if (a.type === "bias") {
        popOverParts.push(<BiasCard data={a.data} />);
      }
      if (a.type === "claim") {
        popOverParts.push(<ClaimCard data={a.data} />);
      }
    });

    parts.push(
      <Popover key={`${chunkIndex}`}>
        <PopoverTrigger asChild>
          <span
            data-chunk-index={chunkIndex}
            data-start={start}
            data-end={end}
            data-is-bias={isBias ? "true" : "false"}
            data-is-claim={
              isClaimTrue ||
              isClaimFalse ||
              isClaimPartiallyTrue ||
              isClaimUnverifiable
                ? "true"
                : "false"
            }
            className={cn(
              "px-0.5 rounded",
              isBias && "underline decoration-dotted underline-offset-4",
              isClaimTrue && "text-green-500",
              isClaimFalse && "text-red-500",
              isClaimPartiallyTrue && "text-yellow-500",
              isClaimUnverifiable && "text-gray-500"
            )}
          >
            {text}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-[500px]"> {popOverParts}</PopoverContent>
      </Popover>
    );
    chunkIndex++;
  }

  return parts;
}
