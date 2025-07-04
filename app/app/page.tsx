"use client";

import AnalyzeForm from "@/components/analyze-form";
import { useClarify } from "@/hooks/useClarify";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [analysing, setAnalysing] = useState(false);

  const clarify = useClarify({
    onComplete: () => {
      console.log("Analysis complete");
    },
    onError: (error) => {
      console.error("Error during analysis:", error);
    },
    onEvent: (event) => {
      console.log("Received event:", event);
    },
    onToken: (token) => {
      console.log("Received token:", token);
    },
    onClose: () => {
      console.log("Connection closed");
    },
  });

  const handleAnalyze = async (content: string) => {
    setAnalysing(true);
    try {
      await clarify({ content });
    } catch (error) {
      console.error("Error during analysis:", error);
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] w-full row-start-2 items-center">
        <AnalyzeForm className="w-2/3" onAnalyze={handleAnalyze} />
      </main>
    </div>
  );
}
