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
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useCreateLibrary } from "@/lib/state/use-create-library";
import { PackagePlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function CreateLibraryButton() {
  const { createLibrary, isPending: isCreating } = useCreateLibrary();
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

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <SidebarMenuButton asChild>
          <Button variant="ghost" className="justify-start">
            <PackagePlus />
            Create Library
          </Button>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new library</DialogTitle>
          <DialogDescription>
            Create a new voice library to organize your audio recordings
          </DialogDescription>
        </DialogHeader>

        <form action={handleCreateLibrary} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="name">Library Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="My Voice Library"
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
