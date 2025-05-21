"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Mic, Plus, Trash2, Play, Pause, Loader2 } from "lucide-react";
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
import { getAudioUrl } from "@/lib/api";

type VoiceDashboardProps = {
  voices: Record<string, string[]>;
  addVoice: ({ name }: { name: string }) => Promise<void>;
  addVoiceSample: ({
    voiceName,
    file,
  }: {
    voiceName: string;
    file: File;
  }) => Promise<void>;
  deleteVoiceSample: ({
    voiceName,
    sampleName,
  }: {
    voiceName: string;
    sampleName: string;
  }) => Promise<void>;
};

export function VoicesDashboard({
  voices,
  addVoice,
  addVoiceSample,
  deleteVoiceSample,
}: VoiceDashboardProps) {
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [newVoiceName, setNewVoiceName] = useState("");
  const [isAddingVoice, setIsAddingVoice] = useState(false);
  const [isAddingVoiceOpen, setIsAddingVoiceOpen] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  async function handleAddVoice(e: React.FormEvent) {
    e.preventDefault();
    if (!newVoiceName.trim()) return;

    try {
      setIsAddingVoice(true);
      await addVoice({ name: newVoiceName });
      setNewVoiceName("");
      setIsAddingVoiceOpen(false);
    } catch (error) {
      console.error("Error adding voice:", error);
      toast({
        title: "Error adding voice",
        description: "Could not add voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingVoice(false);
    }
  }

  async function handleAddVoiceSample(voiceName: string, file: File) {
    try {
      await addVoiceSample({ voiceName, file });
    } catch (error) {
      console.error("Error adding voice sample:", error);
      toast({
        title: "Error adding sample",
        description: "Could not add voice sample. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteVoiceSample(
    voiceName: string,
    sampleName: string
  ) {
    try {
      await deleteVoiceSample({ voiceName, sampleName });
    } catch (error) {
      console.error("Error deleting voice sample:", error);
      toast({
        title: "Error deleting sample",
        description: "Could not delete voice sample. Please try again.",
        variant: "destructive",
      });
    }
  }

  function handlePlaySample(voiceName: string, sampleName: string) {
    const sampleId = `${voiceName}/${sampleName}`;

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
    const audioUrl = getAudioUrl(voiceName, sampleName);
    if (!audioUrl) {
      toast({
        title: "Error playing sample",
        description: "Could not find audio file.",
        variant: "destructive",
      });
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setCurrentlyPlaying(null);
    };

    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
      toast({
        title: "Error playing sample",
        description: "Could not play voice sample. Please try again.",
        variant: "destructive",
      });
      setCurrentlyPlaying(null);
    });

    setCurrentlyPlaying(sampleId);
  }

  function handleFileUpload(
    voiceName: string,
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

    handleAddVoiceSample(voiceName, file);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Voices Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage voice samples for speaker identification
          </p>
        </div>
        <Dialog open={isAddingVoiceOpen} onOpenChange={setIsAddingVoiceOpen}>
          <DialogContent>
            <form onSubmit={handleAddVoice}>
              <DialogHeader>
                <DialogTitle>Add New Voice</DialogTitle>
                <DialogDescription>
                  Enter a name for the new voice profile.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Voice Name</Label>
                  <Input
                    id="name"
                    value={newVoiceName}
                    onChange={(e) => setNewVoiceName(e.target.value)}
                    placeholder="e.g., John, Sarah"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isAddingVoice}>
                  {isAddingVoice && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Voice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(voices).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mic className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No voices found</h2>
          <p className="text-muted-foreground mt-1 mb-4">
            Add a voice to get started with voice identification.
          </p>
          <Button onClick={() => setIsAddingVoiceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Voice
          </Button>
        </div>
      ) : (
        <div className="flex gap-6 w-full">
          <div className="flex flex-col gap-6 w-80">
            <Button onClick={() => setIsAddingVoiceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Voice
            </Button>
            {Object.entries(voices).map(([voiceName, samples]) => (
              <div
                key={voiceName}
                onClick={() => setSelectedVoice(voiceName)}
                className="flex items-center"
              >
                <Mic className="mr-2 h-5 w-5" />
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {voiceName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {samples.length} sample{samples.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {/* 
                
              <CardFooter>
                <div className="w-full">
                  <Label
                    htmlFor={`file-upload-${voiceName}`}
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
                      id={`file-upload-${voiceName}`}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(voiceName, e)}
                    />
                  </Label>
                </div>
              </CardFooter> */}
              </div>
            ))}
          </div>
          <div className="flex-1">
            {selectedVoice && (
              <>
                <Label
                  htmlFor={`file-upload-${selectedVoice}`}
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
                    id={`file-upload-${selectedVoice}`}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(selectedVoice, e)}
                  />
                </Label>
                <div className="space-y-2">
                  {!voices[selectedVoice]?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No samples added yet.
                    </p>
                  ) : (
                    voices[selectedVoice].map((sample) => (
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
                              handlePlaySample(selectedVoice, sample)
                            }
                            aria-label={
                              currentlyPlaying === `${selectedVoice}/${sample}`
                                ? "Stop"
                                : "Play"
                            }
                          >
                            {currentlyPlaying ===
                            `${selectedVoice}/${sample}` ? (
                              <Pause className="h-4 w-4 text-primary" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDeleteVoiceSample(selectedVoice, sample)
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
