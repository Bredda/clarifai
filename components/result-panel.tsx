import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { GraphStep, useClarifStore } from "@/stores/clarify.store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CircleCheckBigIcon, Ellipsis, LoaderCircle } from "lucide-react";
import Markdown from "react-markdown";
import { applyAnnotations } from "@/lib/applyAnnotations";

interface BasicProps {
  className?: string;
}

const stepsLabels: Record<GraphStep, string> = {
  preprocessing: "Pre processing",
  detecting_biases: "Detecting biases",
  extracting_claims: "Extracting claims",
  verifying_claims: "Verifying claims",
  generating_report: "Generating report",
};

type ProcessLogProps = {
  className?: string;
};

function ProcessLog({ className }: ProcessLogProps) {
  const { graphLog: processLog } = useClarifStore();

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>VerifAI Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(processLog).map(([step, status]) => (
          <div
            key={step}
            className="flex items-center gap-2 text-muted-foreground"
          >
            {status === "done" && <CircleCheckBigIcon />}
            {status === "todo" && <Ellipsis />}
            {status === "in-progress" && (
              <LoaderCircle className="animate-spin" />
            )}

            <span>{stepsLabels[step as GraphStep]}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SegmentedTextView({ className }: BasicProps) {
  const { chunks } = useClarifStore();

  return (
    <div className={cn("space-y-6", className)}>
      {chunks.map((chunk) => (
        <p key={chunk.id} className="leading-relaxed" data-chunk-id={chunk.id}>
          {applyAnnotations(chunk.content, chunk.annotations)}
        </p>
      ))}
    </div>
  );
}

function FinalReport({ className }: BasicProps) {
  const { report } = useClarifStore();
  return (
    <div
      className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
    >
      {report ? <Markdown>{report}</Markdown> : "No report generated yet."}
    </div>
  );
}

export function ResultPanel({ className }: BasicProps) {
  const { reset } = useClarifStore();

  return (
    <div className={cn(className, "flex space-x-4 w-full")}>
      <Button
        variant="secondary"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
        onClick={() => reset()}
      >
        Nouvelle analyse
      </Button>

      <ProcessLog className="sticky left-0 min-w-60" />
      <div className="flex-1 flex space-y-4">
        <SegmentedTextView className="w-1/2" />
        <FinalReport className="w-1/2" />
      </div>
    </div>
  );
}
