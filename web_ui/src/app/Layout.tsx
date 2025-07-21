import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { Outlet } from "react-router";
import { CreateLibraryButton } from "./sidebar/CreateLibraryButton";
import { ImportLibraryButton } from "./sidebar/ImportLibraryButton";
import { LibraryMenu } from "./sidebar/LibraryMenu";
import { Button } from "@/components/ui/button";

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
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupLabel>Get help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                <SidebarMenuItem>
                  <Button asChild variant="ghost" className="rounded-full">
                    <a
                      href="https://github.com/loque/voiceprint"
                      target="_blank"
                    >
                      <FaGithub />
                      <span className="text-sidebar-foreground/50">
                        Voiceprint
                      </span>
                    </a>
                  </Button>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Button asChild variant="ghost" className="rounded-full">
                    <a href="https://x.com/loque_js" target="_blank">
                      <FaXTwitter />
                      <span className="text-sidebar-foreground/50">
                        Lucas Soler
                      </span>
                    </a>
                  </Button>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
