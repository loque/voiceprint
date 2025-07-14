import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.bak";
import { Trash2 } from "lucide-react";
import { Api, type Speaker } from "@/lib/api/api";
import { Header, HeaderTitle } from "@/components/ui/header";
import { Body } from "@/components/ui/body";
import { useLibrary } from "@/lib/state/use-library";

export function Speakers() {
  const library = useLibrary();
  const speakers = library?.speakers || [];

  const deleteSpeaker = Api.useMutation(
    "delete",
    "/libraries/{library_id}/speakers/{speaker_id}",
    {
      onSuccess: () => {
        setSpeakerToDelete(null);
      },
    }
  );
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);

  const handleDeleteClick = (speaker: Speaker) => {
    setSpeakerToDelete(speaker);
  };

  const handleConfirmDelete = () => {
    if (!library || !speakerToDelete) return;
    deleteSpeaker.mutate({
      params: {
        path: {
          library_id: library.id,
          speaker_id: speakerToDelete.id,
        },
      },
    });
  };

  const handleCancelDelete = () => {
    setSpeakerToDelete(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <>
      <Header>
        <HeaderTitle>Enrolled Speakers</HeaderTitle>
      </Header>

      <Body>
        {speakers.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400 text-lg">No speakers enrolled yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Add speakers using the "Enroll Speaker" tab
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {speakers.map((speaker) => (
              <Card
                key={speaker.id}
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-orange-600 text-white font-semibold">
                          {getInitials(speaker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-white font-medium">
                          {speaker.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          ID: {speaker.id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(speaker)}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Body>

      <Dialog
        open={!!speakerToDelete}
        onOpenChange={(open) => !open && setSpeakerToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Speaker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete speaker "{speakerToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
