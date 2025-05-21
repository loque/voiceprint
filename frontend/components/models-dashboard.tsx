"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Brain, Plus, Upload, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { createModel, loadModel, identifyVoice } from "@/lib/api";
import type { Model, VoiceData } from "@/lib/store";

type IdentificationResult = {
  predicted_speaker: string;
  confidence: number;
  all_predictions: Record<string, number>;
  processing_time_ms: number;
};

export function ModelsDashboard({
  models,
  voices,
}: {
  models: Model[];
  voices: VoiceData;
}) {
  const [newModelName, setNewModelName] = useState("");
  const [selectedVoices, setSelectedVoices] = useState<
    Record<string, Set<string>>
  >({});
  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [isCreatingModelOpen, setIsCreatingModelOpen] = useState(false);
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [identifyFile, setIdentifyFile] = useState<File | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] =
    useState<IdentificationResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize selected voices
    const initialSelectedVoices: Record<string, Set<string>> = {};
    Object.keys(voices).forEach((voice) => {
      initialSelectedVoices[voice] = new Set();
    });
    setSelectedVoices(initialSelectedVoices);
  }, [voices]);

  useEffect(() => {
    // Find active model
    const activeModel = models.find((model) => model.isActive);
    if (activeModel) {
      setActiveModelId(activeModel.id);
    }
  }, [models]);

  function toggleVoiceSample(voiceName: string, sampleName: string) {
    setSelectedVoices((prev) => {
      const newSelectedVoices = { ...prev };
      const voiceSamples = new Set(newSelectedVoices[voiceName]);

      if (voiceSamples.has(sampleName)) {
        voiceSamples.delete(sampleName);
      } else {
        voiceSamples.add(sampleName);
      }

      newSelectedVoices[voiceName] = voiceSamples;
      return newSelectedVoices;
    });
  }

  function toggleAllVoiceSamples(voiceName: string, checked: boolean) {
    setSelectedVoices((prev) => {
      const newSelectedVoices = { ...prev };

      if (checked) {
        // Select all samples for this voice
        newSelectedVoices[voiceName] = new Set(voices[voiceName]);
      } else {
        // Deselect all samples for this voice
        newSelectedVoices[voiceName] = new Set();
      }

      return newSelectedVoices;
    });
  }

  async function handleCreateModel(e: React.FormEvent) {
    e.preventDefault();
    if (!newModelName.trim()) return;

    // Convert selectedVoices to the format expected by the API
    const selectedVoicesFormatted: Record<string, string[]> = {};
    Object.entries(selectedVoices).forEach(([voiceName, samples]) => {
      if (samples.size > 0) {
        selectedVoicesFormatted[voiceName] = Array.from(samples);
      }
    });

    // Check if at least one voice sample is selected
    if (Object.keys(selectedVoicesFormatted).length === 0) {
      toast({
        title: "No samples selected",
        description: "Please select at least one voice sample.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingModel(true);
      await createModel(selectedVoicesFormatted, newModelName);

      // Reset form
      setNewModelName("");
      const resetSelectedVoices: Record<string, Set<string>> = {};
      Object.keys(voices).forEach((voice) => {
        resetSelectedVoices[voice] = new Set();
      });
      setSelectedVoices(resetSelectedVoices);

      setIsCreatingModelOpen(false);
      toast({
        title: "Model created",
        description: `Model "${newModelName}" has been created successfully.`,
      });

      // TODO: Refresh models list
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        title: "Error creating model",
        description: "Could not create model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingModel(false);
    }
  }

  async function handleLoadModel(modelId: string) {
    try {
      setIsLoadingModel(true);
      await loadModel(modelId);
      setActiveModelId(modelId);

      // TODO: Update models to reflect the active state

      toast({
        title: "Model loaded",
        description: "Model has been loaded successfully.",
      });
    } catch (error) {
      console.error("Error loading model:", error);
      toast({
        title: "Error loading model",
        description: "Could not load model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModel(false);
    }
  }

  function handleIdentifyFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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

    setIdentifyFile(file);
    setIdentificationResult(null);
  }

  async function handleIdentifyVoice(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModelId || !identifyFile) return;

    try {
      setIsIdentifying(true);
      const result = await identifyVoice(activeModelId, identifyFile);
      setIdentificationResult(result);
    } catch (error) {
      console.error("Error identifying voice:", error);
      toast({
        title: "Error identifying voice",
        description: "Could not identify voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsIdentifying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Models Dashboard
          </h1>
          <p className="text-muted-foreground">
            Create and use speaker identification models
          </p>
        </div>
        <Dialog
          open={isCreatingModelOpen}
          onOpenChange={setIsCreatingModelOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleCreateModel}>
              <DialogHeader>
                <DialogTitle>Create New Model</DialogTitle>
                <DialogDescription>
                  Select voice samples and provide a name for the new model.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    placeholder="e.g., Office Team, Family Members"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Select Voice Samples</Label>
                  <div className="border rounded-md divide-y">
                    {Object.entries(voices).map(([voiceName, samples]) => (
                      <div key={voiceName} className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`select-all-${voiceName}`}
                            checked={
                              selectedVoices[voiceName]?.size ===
                                samples.length && samples.length > 0
                            }
                            onCheckedChange={(checked) =>
                              toggleAllVoiceSamples(voiceName, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`select-all-${voiceName}`}
                            className="font-medium"
                          >
                            {voiceName} ({samples.length} sample
                            {samples.length !== 1 ? "s" : ""})
                          </Label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                          {samples.map((sample) => (
                            <div
                              key={sample}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`${voiceName}-${sample}`}
                                checked={selectedVoices[voiceName]?.has(sample)}
                                onCheckedChange={() =>
                                  toggleVoiceSample(voiceName, sample)
                                }
                              />
                              <Label
                                htmlFor={`${voiceName}-${sample}`}
                                className="text-sm truncate"
                              >
                                {sample}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreatingModel}>
                  {isCreatingModel && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Model
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No models found</h2>
          <p className="text-muted-foreground mt-1 mb-4">
            Create a model to start identifying speakers.
          </p>
          <Button onClick={() => setIsCreatingModelOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Model
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="models" className="space-y-6">
          <TabsList>
            <TabsTrigger value="models">Available Models</TabsTrigger>
            <TabsTrigger value="identify" disabled={!activeModelId}>
              Identify Voice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="mr-2 h-5 w-5" />
                      {model.name}
                    </CardTitle>
                    <CardDescription>
                      {Object.keys(model.voices).length} voice
                      {Object.keys(model.voices).length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(model.voices).map(
                        ([voiceName, samples]) => (
                          <div key={voiceName} className="text-sm">
                            <span className="font-medium">{voiceName}:</span>{" "}
                            {samples.length} sample
                            {samples.length !== 1 ? "s" : ""}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={model.isActive ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleLoadModel(model.id)}
                      disabled={isLoadingModel}
                    >
                      {isLoadingModel && activeModelId === model.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : model.isActive ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {model.isActive ? "Active" : "Load Model"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="identify">
            <Card>
              <CardHeader>
                <CardTitle>Identify Speaker</CardTitle>
                <CardDescription>
                  Upload an audio sample to identify the speaker using the
                  active model.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleIdentifyVoice} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="audio-file">Audio Sample</Label>
                    <Input
                      id="audio-file"
                      type="file"
                      accept="audio/*"
                      onChange={handleIdentifyFileChange}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!identifyFile || isIdentifying}
                  >
                    {isIdentifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Identifying...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Identify Speaker
                      </>
                    )}
                  </Button>
                </form>

                {identificationResult && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Results</h3>
                      <span className="text-sm text-muted-foreground">
                        Processed in{" "}
                        {(
                          identificationResult.processing_time_ms / 1000
                        ).toFixed(2)}
                        s
                      </span>
                    </div>

                    <div className="p-4 border rounded-md bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Predicted Speaker:</span>
                        <span className="text-lg font-bold">
                          {identificationResult.predicted_speaker}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">Confidence:</span>
                        <span>
                          {(identificationResult.confidence * 100).toFixed(2)}%
                        </span>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">
                          All Predictions:
                        </h4>
                        {Object.entries(identificationResult.all_predictions)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([speaker, confidence]) => (
                            <div key={speaker} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{speaker}</span>
                                <span>
                                  {((confidence as number) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <Progress value={(confidence as number) * 100} />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
