import { downloadFile } from "@/components/recorder/helpers";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Library } from "@/lib/api/api";
import { ArrowDownToLine, CirclePlus, Fingerprint, Users } from "lucide-react";
import { NavLink } from "react-router";

export function LibraryMenu({ library }: { library: Library }) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="uppercase">
        {library.name}
      </SidebarGroupLabel>
      <SidebarGroupAction
        title="Download Library"
        onClick={() =>
          downloadFile(
            `/files/libraries/${library.id}.json`,
            `${library.id}.json`
          )
        }
      >
        <ArrowDownToLine />
      </SidebarGroupAction>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {/* Identify Speaker */}
          <SidebarMenuItem>
            <NavLink to={`library/${library.id}/identify-speaker`}>
              {({ isActive }) => (
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip="Identify speaker"
                  className="cursor-pointer"
                >
                  <Fingerprint /> Identify speaker
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
          {/* Enroll Speaker */}
          <SidebarMenuItem>
            <NavLink to={`library/${library.id}/enroll-speaker`}>
              {({ isActive }) => (
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip="Enroll Speaker"
                  className="cursor-pointer"
                >
                  <CirclePlus /> Enroll speaker
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
          {/* Options */}
          <SidebarMenuItem>
            <NavLink to={`library/${library.id}/options`}>
              {({ isActive }) => (
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip="Options"
                  className="cursor-pointer"
                >
                  <Users /> Options
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
