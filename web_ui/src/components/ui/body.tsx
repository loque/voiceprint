import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function Body({ children }: PropsWithChildren) {
  return (
    <div
      className="flex flex-col flex-1 self-center py-8 gap-8 max-w-3xl"
      data-slot="body"
    >
      {children}
    </div>
  );
}

type BodySectionProps = PropsWithChildren<{ className?: string }>;
export function BodySection({ children, className }: BodySectionProps) {
  return (
    <div
      className={cn("px-4 flex flex-col w-full", className)}
      data-slot="body-section"
    >
      {children}
    </div>
  );
}
