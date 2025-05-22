"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Mic, Plus, Trash2, Play, Loader2, CircleStop } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/api/constants";

type SpeakersDashboardProps = {
  speakers: Record<string, string[]>;
  addSpeaker: ({ name }: { name: string }) => Promise<void>;
  addSpeakerSample: ({
    speakerName,
    file,
  }: {
    speakerName: string;
    file: File;
  }) => Promise<void>;
  deleteSpeakerSample: ({
    speakerName,
    sampleName,
  }: {
    speakerName: string;
    sampleName: string;
  }) => Promise<void>;
};

export function SpeakersDashboard({
  speakers,
  addSpeaker,
  addSpeakerSample,
  deleteSpeakerSample,
}: SpeakersDashboardProps) {
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState("");
  const [isAddingSpeaker, setIsAddingSpeaker] = useState(false);
  const [isAddingSpeakerOpen, setIsAddingSpeakerOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  async function handleAddSpeaker(e: React.FormEvent) {
    e.preventDefault();
    if (!newSpeakerName.trim()) return;

    try {
      setIsAddingSpeaker(true);
      await addSpeaker({ name: newSpeakerName });
      setNewSpeakerName("");
      setIsAddingSpeakerOpen(false);
    } catch (error) {
      console.error("Error adding speaker:", error);
      toast({
        title: "Error adding speaker",
        description: "Could not add speaker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingSpeaker(false);
    }
  }

  async function handleAddSpeakerSample(speakerName: string, file: File) {
    try {
      await addSpeakerSample({ speakerName, file });
    } catch (error) {
      console.error("Error adding speaker sample:", error);
      toast({
        title: "Error adding sample",
        description: "Could not add speaker sample. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteSpeakerSample(
    speakerName: string,
    sampleName: string
  ) {
    try {
      await deleteSpeakerSample({ speakerName, sampleName });
    } catch (error) {
      console.error("Error deleting speaker sample:", error);
      toast({
        title: "Error deleting sample",
        description: "Could not delete speaker sample. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handlePlaySample(speakerName: string, sampleName: string) {
    const sampleId = `${speakerName}/${sampleName}`;

    if (currentlyPlaying === sampleId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentlyPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Get the audio URL from our store
    const audioUrl = `${API_BASE_URL}/samples/${sampleId}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setCurrentlyPlaying(null);
    };

    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
      toast({
        title: "Error playing sample",
        description: "Could not play speaker sample. Please try again.",
        variant: "destructive",
      });
      setCurrentlyPlaying(null);
    });

    setCurrentlyPlaying(sampleId);
  }

  function handleFileUpload(
    speakerName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is audio
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file.",
        variant: "destructive",
      });
      return;
    }

    handleAddSpeakerSample(speakerName, file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Speakers Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage speaker samples for speaker identification
          </p>
        </div>
        <Dialog
          open={isAddingSpeakerOpen}
          onOpenChange={setIsAddingSpeakerOpen}
        >
          <DialogContent>
            <form onSubmit={handleAddSpeaker}>
              <DialogHeader>
                <DialogTitle>Add New Speaker</DialogTitle>
                <DialogDescription>
                  Enter a name for the new speaker profile.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Speaker Name</Label>
                  <Input
                    id="name"
                    value={newSpeakerName}
                    onChange={(e) => setNewSpeakerName(e.target.value)}
                    placeholder="e.g., John, Sarah"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isAddingSpeaker}>
                  {isAddingSpeaker && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Speaker
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(speakers).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mic className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No speakers found</h2>
          <p className="text-muted-foreground mt-1 mb-4">
            Add a speaker to get started with voice identification.
          </p>
          <Button onClick={() => setIsAddingSpeakerOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Speaker
          </Button>
        </div>
      ) : (
        <div className="flex gap-6 w-full">
          <div className="flex flex-col gap-6 w-80">
            <Button onClick={() => setIsAddingSpeakerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Speaker
            </Button>
            {Object.entries(speakers).map(([speakerName, samples]) => (
              <div
                key={speakerName}
                onClick={() => setSelectedSpeaker(speakerName)}
                className="flex items-center"
              >
                <Mic className="mr-2 h-5 w-5" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {speakerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {samples.length} sample{samples.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex-1">
            {selectedSpeaker && (
              <>
                <Label
                  htmlFor={`file-upload-${selectedSpeaker}`}
                  className="w-full"
                >
                  <div className="flex items-center justify-center w-full">
                    <Button variant="outline" className="w-full" asChild>
                      <div>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Sample
                      </div>
                    </Button>
                  </div>
                  <Input
                    id={`file-upload-${selectedSpeaker}`}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(selectedSpeaker, e)}
                  />
                </Label>
                <div className="space-y-2">
                  {!speakers[selectedSpeaker]?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No samples added yet.
                    </p>
                  ) : (
                    speakers[selectedSpeaker].map((sample) => (
                      <div
                        key={sample}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <span className="text-sm">{sample}</span>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handlePlaySample(selectedSpeaker, sample)
                            }
                            aria-label={
                              currentlyPlaying ===
                              `${selectedSpeaker}/${sample}`
                                ? "Stop"
                                : "Play"
                            }
                          >
                            {currentlyPlaying ===
                            `${selectedSpeaker}/${sample}` ? (
                              <CircleStop className="h-4 w-4 text-primary" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteSpeakerSample(selectedSpeaker, sample)
                            }
                            aria-label="Delete sample"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/*
loading state
<div className="flex justify-center py-12">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>
*/
