import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useDeleteSpeaker, type SpeakerName } from "@/lib/api/hooks";

interface SpeakersManagementTabProps {
  speakers: SpeakerName[];
}

export function SpeakersManagementTab({
  speakers,
}: SpeakersManagementTabProps) {
  const deleteSpeaker = useDeleteSpeaker();
  const [speakerToDelete, setSpeakerToDelete] = useState<SpeakerName | "">("");

  const handleDeleteClick = (speakerName: SpeakerName) => {
    setSpeakerToDelete(speakerName);
  };

  const handleConfirmDelete = () => {
    if (!speakerToDelete) return;
    deleteSpeaker.mutate(speakerToDelete);
    setSpeakerToDelete("");
  };

  const handleCancelDelete = () => {
    setSpeakerToDelete("");
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
      <TabsContent value="management" className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Enrolled Speakers</h2>

          {speakers.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">
                  No speakers enrolled yet
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Add speakers using the "Enroll Speaker" tab
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {speakers.map((speaker) => (
                <Card
                  key={speaker}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-orange-600 text-white font-semibold">
                            {getInitials(speaker)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-medium">{speaker}</h3>
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
        </div>
      </TabsContent>

      <Dialog
        open={!!speakerToDelete}
        onOpenChange={(open) => !open && setSpeakerToDelete("")}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Speaker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete speaker "{speakerToDelete}"? This
              action cannot be undone.
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
