"use client";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useState } from "react";

interface AnalyzeFormProps {
  className?: string;
  onAnalyze: (content: string) => void;
}

export default function AnalyzeForm({
  className,
  onAnalyze,
}: AnalyzeFormProps) {
  const [content, setContent] = useState(
    "Selon une étude récente, 87% des jeunes préfèrent TikTok à Google. Ce chiffre, ignoré par les médias traditionnels, démontre à quel point les institutions sont dépassées."
  );

  const handleAnalyze = async () => {
    onAnalyze("Texte à analyser");
  };
  return (
    <div className={cn("grid w-full gap-2", className)}>
      <Textarea
        placeholder="Texte à analyser"
        rows={50}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={handleAnalyze}>Analyser</Button>
    </div>
  );
}
