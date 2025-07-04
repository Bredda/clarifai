"use client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { YounupLink } from "./younup-link";

interface AppBarProps {
  className?: string;
}
export default function AppBar({ className }: AppBarProps) {
  return (
    <div
      className={cn(
        "flex gap-2 item-center justify-between w-screen  ",
        className
      )}
    >
      <YounupLink />

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
