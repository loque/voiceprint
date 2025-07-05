import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import type { StoryEntry } from "./types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

function toUrl(str: string): string {
  return str.toLowerCase().replace(/[ _]/g, "-");
}

export function Stories({ stories }: { stories: StoryEntry[] }) {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Sidebar collapsible="offcanvas">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:!p-1.5"
                >
                  <a href="/stories/">
                    <span className="text-base font-semibold">Stories</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {stories.map((story) => (
              <SidebarGroup
                key={story.name}
                className="group-data-[collapsible=icon]:hidden"
              >
                <SidebarGroupLabel className="uppercase">
                  {story.name}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {story.components.map((comp) => (
                    <SidebarMenuItem key={comp.name}>
                      <SidebarMenuButton asChild className="pl-4">
                        <Link to={toUrl(`/stories/${story.name}/${comp.name}`)}>
                          {comp.name}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Routes>
            <Route
              path="/stories"
              element={
                <p className="text-center">Select a story on the left</p>
              }
            />
            {stories.map((story) =>
              story.components.map((comp) => (
                <Route
                  key={`${story.name}-${comp.name}`}
                  path={toUrl(`/stories/${story.name}/${comp.name}`)}
                  element={
                    story.Wrapper ? (
                      <story.Wrapper>
                        <comp.Component />
                      </story.Wrapper>
                    ) : (
                      <comp.Component />
                    )
                  }
                />
              ))
            )}
          </Routes>
        </SidebarInset>
      </SidebarProvider>
    </BrowserRouter>
  );
}
