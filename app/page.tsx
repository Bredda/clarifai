"use client";

import { ResultPanel } from "@/components/result-panel";
import { SimpleInvite } from "@/components/simple-invite";
import { useClarifStore } from "@/stores/clarify.store";

import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";

export default function Home() {
  const { clarify, chunks, hasSubmitted, processing, error, reset } =
    useClarifStore();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] w-full row-start-2 items-center">
        <AnimatePresence mode="wait">
          {!hasSubmitted ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-2 w-full"
            >
              <div className="text-4xl font-bold">Clarif.ai</div>
              <div className="text-muted-foreground -4pt">
                Empowering your critical thinking with AI
              </div>
              <SimpleInvite
                description="Copy-past text or source URL to analyze"
                onSubmit={clarify}
                className="w-2/3"
              />
            </motion.div>
          ) : (
            <motion.div
              key="output"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <ResultPanel className="w-2/3" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
