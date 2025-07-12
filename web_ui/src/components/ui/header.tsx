import type { PropsWithChildren } from "react";
import { SidebarTrigger } from "./sidebar";
import { Separator } from "./separator";

export function Header({ children }: PropsWithChildren) {
  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
      data-slot="header"
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {children}
      </div>
    </header>
  );
}

export function HeaderTitle({ children }: PropsWithChildren) {
  return (
    <h1 className="text-base font-medium" data-slot="header-title">
      {children}
    </h1>
  );
}

export function HeaderRight({ children }: PropsWithChildren) {
  return (
    <div className="ml-auto flex items-center gap-2" data-slot="header-right">
      {children}
    </div>
  );
}
