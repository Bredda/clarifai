"use client";

import { CornerRightUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { Button } from "./ui/button";

interface SimpleInviteProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  loadingDuration?: number;
  thinkingDuration?: number;
  onSubmit?: (value: string) => void | Promise<void>;
  className?: string;
  autoAnimate?: boolean;
  description?: string;
}

export function SimpleInvite({
  id = "simple-invite",
  placeholder = "Ask me anything!",
  minHeight = 82,
  maxHeight = 300,
  onSubmit,
  className,
  description = "Ready to submit!",
}: SimpleInviteProps) {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleSubmit = async () => {
    if (!inputValue.trim() || submitted) return;

    setSubmitted(true);
    await onSubmit?.(inputValue);
    setSubmitted(false);
    setInputValue("");
    adjustHeight(true);
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-start flex-col gap-2">
        <div className="relative max-w-xl w-full mx-auto">
          <Textarea
            id={id}
            placeholder={placeholder}
            className={cn(
              "max-w-xl  w-full pl-6 pr-10 py-4",
              "border-none ",
              " resize-none text-wrap leading-[1.2]",
              `min-h-[${minHeight}px]`
            )}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={submitted}
          />
          <Button
            onClick={handleSubmit}
            size="icon"
            variant="ghost"
            className="absolute right-3 top-1/2 -translate-y-1/2 py-1 px-1"
            disabled={submitted}
          >
            {submitted ? (
              <div
                className="w-4 h-4  animate-spin transition duration-700"
                style={{ animationDuration: "3s" }}
              />
            ) : (
              <CornerRightUp
                className={cn(
                  "w-4 h-4 ",
                  inputValue ? "opacity-100" : "opacity-30"
                )}
              />
            )}
          </Button>
        </div>
        <p className="pl-4 h-4 text-sm mx-auto ">
          {submitted ? "AI is thinking..." : description}
        </p>
      </div>
    </div>
  );
}
