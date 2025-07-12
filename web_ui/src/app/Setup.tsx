import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Library } from "@/lib/api/api";
import { cn } from "@/lib/utils";
import { AudioLines, Library as LibraryIcon } from "lucide-react";

type SetupProps = {
  libraries: Library[];
  onLoadLibrary: (libraryId: string) => void;
  onCreateLibrary: (name: string) => void;
};

export function Setup({
  libraries,
  onLoadLibrary,
  onCreateLibrary,
}: SetupProps) {
  const hasLibraries = libraries.length > 0;

  function handleCreateLibrary(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    if (name) {
      onCreateLibrary(name);
    }
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-4">
                <AudioLines />
                Voiceprint Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {hasLibraries && (
                  <div className="flex flex-col gap-4">
                    <div className="relative text-center text-sm">
                      <span className="bg-card text-muted-foreground relative z-10 px-2">
                        Load a stored library
                      </span>
                    </div>
                    {libraries.map((library) => (
                      <Button
                        key={library.id}
                        variant="outline"
                        className="w-full h-auto flex justify-start gap-2"
                        onClick={() => onLoadLibrary(library.id)}
                      >
                        <LibraryIcon className="size-[32px] p-1" />
                        <span className="flex flex-col items-start gap-0">
                          {library.name}
                          <span className="text-muted-foreground text-xs">
                            {library.speakers.map((s) => s.name).join(", ")}
                          </span>
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
                {hasLibraries && (
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or create a new one
                    </span>
                  </div>
                )}
                {!hasLibraries && (
                  <div className="relative text-center text-sm">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Create a new library to get started
                    </span>
                  </div>
                )}
                <form onSubmit={handleCreateLibrary}>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="My Library"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
