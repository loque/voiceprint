import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
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
import type { Library } from "@/lib/api/api";
import { useCreateLibrary } from "@/lib/state";
import { useGetLibraries } from "@/lib/state/use-get-libraries";
import {
  AudioLines,
  CirclePlus,
  Fingerprint,
  PackagePlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";

function LibraryCreation() {
  const { createLibrary } = useCreateLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleCreateLibrary(formData: FormData) {
    const name = (formData.get("name") as string | null)?.trim();
    if (!name) {
      throw new Error("Library name is required");
    }
    createLibrary(name, {
      onSuccess: (library) => {
        setOpen(false);
        navigate(`/library/${library.id}/identify-speaker`);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton asChild>
          <Button variant="outline">
            <PackagePlus />
            Create Library
          </Button>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create a new library</DialogTitle>
          <DialogDescription>
            Create a new voice library to store speakers and their voiceprints.
          </DialogDescription>
        </DialogHeader>
        <form action={handleCreateLibrary} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="My Library"
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LibraryMenu({ library }: { library: Library }) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="uppercase">
        {library.name}
      </SidebarGroupLabel>
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
              <LibraryCreation />
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
