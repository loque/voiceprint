import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useGetLibraries } from "@/lib/state/use-get-libraries";
import { AudioLines } from "lucide-react";
import { Outlet } from "react-router";
import { CreateLibraryButton } from "./sidebar/CreateLibraryButton";
import { ImportLibraryButton } from "./sidebar/ImportLibraryButton";
import { LibraryMenu } from "./sidebar/LibraryMenu";

export function Layout() {
  const { libraries } = useGetLibraries();
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="data-[slot=sidebar-menu-button]:!p-1.5">
                <AudioLines className="!size-5" />
                <span className="text-base font-semibold">
                  Voiceprint Dashboard
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <CreateLibraryButton />
              <ImportLibraryButton />
            </SidebarMenu>
          </SidebarGroup>
          {libraries.map((library) => (
            <LibraryMenu key={library.id} library={library} />
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
