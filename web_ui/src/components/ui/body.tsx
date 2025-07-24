import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";

export function Body({ children }: PropsWithChildren) {
  return (
    <div
      className="flex flex-col flex-1 self-center py-8 gap-8 max-w-3xl w-full"
      data-slot="body"
    >
      {children}
    </div>
  );
}

type ChildrenAndClassname = PropsWithChildren<{ className?: string }>;
export function BodySection({ children, className }: ChildrenAndClassname) {
  return (
    <div
      className={cn("px-4 flex flex-col w-full", className)}
      data-slot="body-section"
    >
      {children}
    </div>
  );
}

export function BodySectionHeader({
  children,
  className,
}: ChildrenAndClassname) {
  return (
    <h2
      className={cn(
        "text-lg font-semibold mb-4 flex items-center gap-2",
        className
      )}
      data-slot="body-section-header"
    >
      {children}
    </h2>
  );
}

export function BodySectionContent({
  children,
  className,
}: ChildrenAndClassname) {
  return (
    <div
      className={cn("text-sm text-gray-500", className)}
      data-slot="body-section-content"
    >
      {children}
    </div>
  );
}
