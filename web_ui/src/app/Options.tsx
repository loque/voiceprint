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
} from "@/components/ui/dialog";
import { CirclePlus, Trash2 } from "lucide-react";
import { type Speaker } from "@/lib/api/api";
import { Header, HeaderTitle } from "@/components/ui/header";
import {
  Body,
  BodySection,
  BodySectionContent,
  BodySectionHeader,
} from "@/components/ui/body";
import { useCurrentLibrary } from "@/lib/state/use-current-library";
import { useDeleteSpeaker } from "@/lib/state/use-delete-speaker";
import { NavLink } from "react-router";

export function Options() {
  const library = useCurrentLibrary();
  const speakers = library?.speakers || [];
  const { deleteSpeaker } = useDeleteSpeaker();

  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null);

  const handleDeleteClick = (speaker: Speaker) => {
    setSpeakerToDelete(speaker);
  };

  const handleConfirmDelete = () => {
    if (!library || !speakerToDelete) return;
    deleteSpeaker(library.id, speakerToDelete.id, {
      onSuccess: () => {
        setSpeakerToDelete(null);
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
        <HeaderTitle>Library Options</HeaderTitle>
      </Header>

      <Body>
        <BodySection>
          <BodySectionHeader>Speakers</BodySectionHeader>
          <BodySectionContent>
            {speakers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-lg mb-3">Enroll speakers to get started</p>
                  <Button asChild variant="outline">
                    <NavLink to={`/library/${library?.id}/enroll-speaker`}>
                      <CirclePlus /> Enroll Speaker
                    </NavLink>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {speakers.map((speaker) => (
                  <Card
                    key={speaker.id}
                    className="rounded-none first:rounded-t-xl last:rounded-b-xl border-none"
                  >
                    <CardContent>
                      <div className="flex w-full gap-4">
                        <div className="flex items-center gap-4 flex-1">
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
                              Speaker Id: {speaker.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            color="destructive"
                            onClick={() => handleDeleteClick(speaker)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </BodySectionContent>
        </BodySection>

        <BodySection>
          <BodySectionHeader>Danger Zone</BodySectionHeader>
          <BodySectionContent></BodySectionContent>
        </BodySection>
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
