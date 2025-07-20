import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useImportLibrary } from "@/lib/state/use-import-library";
import { ArrowUpToLine, Upload, X } from "lucide-react";
import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useNavigate } from "react-router";

export function ImportLibraryButton() {
  const { importLibrary, isPending: isImporting } = useImportLibrary();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImport() {
    if (!selectedFile) {
      return;
    }
    importLibrary(selectedFile, {
      onSuccess: (library) => {
        setOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        navigate(`/library/${library.id}/identify-speaker`);
      },
    });
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file && file.name.endsWith(".json") && fileInputRef.current) {
        fileInputRef.current.files = files;
        setSelectedFile(file);
      }
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }

  function handleResetFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <SidebarMenuButton asChild>
          <Button variant="ghost" className="justify-start">
            <ArrowUpToLine />
            Import Library
          </Button>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import a library</DialogTitle>
          <DialogDescription>
            Import an existing voice library from your device
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {selectedFile ? (
              <Card className="py-2">
                <CardContent className="pl-4 pr-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedFile.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={handleResetFile}
                      disabled={isImporting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 transition-colors flex flex-col gap-4 items-center ${
                  dragOver ? "border-primary" : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground my-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop a{" "}
                  <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold mx-1">
                    .json
                  </code>{" "}
                  file here, or
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseClick}
                  disabled={isImporting}
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <input
              ref={fileInputRef}
              name="file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !selectedFile}
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
