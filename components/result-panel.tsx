import { cn } from "@/lib/utils";

interface ResultPanelProps {
  className?: string;
}

export function ResultPanel({ className }: ResultPanelProps) {
  return <div className={cn(className)}>Results</div>;
}
