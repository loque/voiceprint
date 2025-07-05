import { TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { useEnrollSpeaker, type SpeakerName } from "@/lib/api/hooks";
import { toast } from "sonner";
import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";

export interface VoiceSample {
  id: number;
  label: string;
  script: string;
  audioBlob: Blob | null;
}

export function EnrollSpeakerTab() {
  const enroll = useEnrollSpeaker();
  const [speakerName, setSpeakerName] = useState("");
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([
    {
      id: 1,
      label: "Voice Sample 1",
      script:
        "Hey Assistant, turn on the living room lights and set the temperature to 72 degrees. Also, can you play some relaxing music in the bedroom?",
      audioBlob: null,
    },
    {
      id: 2,
      label: "Voice Sample 2",
      script:
        "Good morning! Please start the coffee maker, open the garage door, and tell me today's weather forecast and my calendar appointments.",
      audioBlob: null,
    },
    {
      id: 3,
      label: "Voice Sample 3",
      script:
        "I'm heading to bed now. Turn off all the lights downstairs, lock the front door, and set the alarm for 7 AM tomorrow morning.",
      audioBlob: null,
    },
    {
      id: 4,
      label: "Voice Sample 4",
      script:
        "Can you dim the kitchen lights to 50 percent, start the dishwasher, and remind me to take out the trash in one hour?",
      audioBlob: null,
    },
    {
      id: 5,
      label: "Voice Sample 5",
      script:
        "What's the status of all my smart devices? Also, please turn on the porch light and check if any windows are open.",
      audioBlob: null,
    },
  ]);

  function setAudioSample(sampleId: number, audioBlob: Blob | null = null) {
    setVoiceSamples((prev) =>
      prev.map((sample) =>
        sample.id === sampleId ? { ...sample, audioBlob } : sample
      )
    );
  }

  function resetAudioSamples() {
    setVoiceSamples((prev) =>
      prev.map((sample) => ({ ...sample, audioBlob: null }))
    );
  }

  function handleSubmit() {
    const trimmedName = speakerName.trim();
    if (!trimmedName) {
      toast.error("Please enter a valid speaker name.");
      return;
    }
    // Check if we have at least some recordings
    const recordedSamples = voiceSamples.filter(
      (sample) => sample.audioBlob !== null
    );

    if (recordedSamples.length === 0) {
      toast.info(
        "Please record at least one voice sample before enrolling the speaker."
      );
      return;
    }

    // Convert audio blobs to files for the API
    const files = recordedSamples.map((sample, index) => {
      return new File([sample.audioBlob!], `voice_sample_${index + 1}.wav`, {
        type: "audio/wav",
      });
    });

    enroll.mutate(
      {
        name: trimmedName as SpeakerName,
        files,
      },
      {
        onSuccess: () => {
          // Reset form and recordings on successful enrollment
          setSpeakerName("");
          resetAudioSamples();
          toast.success("Speaker enrolled successfully!");
        },
        onError: (error) => {
          console.error("Failed to enroll speaker:", error);
          toast.error("Failed to enroll speaker. Please try again.");
        },
      }
    );
  }

  return (
    <TabsContent value="enroll" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Record audio samples to enroll a speaker
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="speakerName" className="text-gray-300">
              Speaker Name
            </Label>
            <Input
              id="speakerName"
              type="text"
              placeholder="Enter speaker's name..."
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 mt-2"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-6">
          {voiceSamples.map((sample, index) => (
            <div key={sample.id} className="space-y-3">
              <div className="text-gray-300">
                <span className="font-semibold">
                  Suggested Script {index + 1}:
                </span>{" "}
                <span className="italic">'{sample.script}'</span>
              </div>
              <AudioRecorder>
                <VoiceSampleRecorder
                  onChange={(audioBlob) => setAudioSample(sample.id, audioBlob)}
                  className="w-full"
                />
              </AudioRecorder>
            </div>
          ))}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-8 py-3"
          size="lg"
        >
          Enroll Speaker
        </Button>
      </div>
    </TabsContent>
  );
}
