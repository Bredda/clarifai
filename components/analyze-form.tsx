"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { SimpleInvite } from "./simple-invite";

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
      <SimpleInvite
        description="Copy-past text or source URL to analyze"
        onSubmit={handleAnalyze}
      />
    </div>
  );
}
