import { Globe } from "lucide-react";

interface YounupLinkProps {
  className?: string;
}

export function YounupLink({ className }: YounupLinkProps) {
  return (
    <span className={className}>
      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4 hover:text-primary"
        href="https://www.younup.fr/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Globe size={16} />
        younup.fr →
      </a>
    </span>
  );
}
