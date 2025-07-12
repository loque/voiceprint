import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
import { Header, HeaderTitle } from "@/components/ui/header";
import { Body, BodySection } from "@/components/ui/body";
import { Api, type Library } from "@/lib/api/api";

export interface VoiceSample {
  id: number;
  label: string;
  script: string;
  audioBlob: Blob | null;
}

export function EnrollSpeaker({ library }: { library: Library | null }) {
  const { mutate: enroll } = Api.useMutation(
    "post",
    "/libraries/{library_id}/speakers",
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
    if (!library) {
      toast.error("No library selected. Please select a library first.");
      return;
    }

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

    enroll({
      params: {
        path: { library_id: library.id },
        query: { name: trimmedName },
      },
      body: {
        // TODO: find a better way to do this
        audio_files: files as unknown as string[],
      },
    });
  }

  return (
    <>
      <Header>
        <HeaderTitle>Record audio samples to enroll a speaker</HeaderTitle>
      </Header>
      <Body>
        <BodySection>
          <Label htmlFor="speakerName">Speaker Name</Label>
          <Input
            id="speakerName"
            type="text"
            placeholder="Enter speaker's name..."
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 mt-2"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            required
          />
        </BodySection>

        {voiceSamples.map((sample, index) => (
          <BodySection key={sample.id} className="gap-2">
            <Label>Suggested Script {index + 1}</Label>
            <p className="italic text-sm">{sample.script}</p>
            <AudioRecorder>
              <VoiceSampleRecorder
                onChange={(audioBlob) => setAudioSample(sample.id, audioBlob)}
                className="w-full"
              />
            </AudioRecorder>
          </BodySection>
        ))}

        <BodySection>
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-8 py-3"
            size="lg"
          >
            Enroll Speaker
          </Button>
        </BodySection>
      </Body>
    </>
  );
}
