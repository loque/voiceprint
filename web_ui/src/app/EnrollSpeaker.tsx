import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  availableLanguages,
  getScriptSuggestions,
  type LanguageCode,
} from "./script-suggestions";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
import { Header, HeaderTitle } from "@/components/ui/header";
import { Body, BodySection } from "@/components/ui/body";
import { useCurrentLibrary } from "@/lib/state/use-current-library";
import { useEnrollSpeaker } from "@/lib/state/use-enroll-speaker";
import { useNavigate } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Number of samples is hardcoded outside the component
const NUM_SAMPLES = 5;

export interface VoiceSample {
  id: number;
  label: string;
  audioBlob: Blob | null;
}

export function EnrollSpeaker() {
  const navigate = useNavigate();
  const library = useCurrentLibrary();
  const { enrollSpeaker, isPending } = useEnrollSpeaker();

  const [speakerName, setSpeakerName] = useState("");
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>(
    Array.from({ length: NUM_SAMPLES }, (_, i) => ({
      id: i + 1,
      label: `Voice Sample ${i + 1}`,
      audioBlob: null,
    }))
  );

  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>("en_US");

  const scripts = getScriptSuggestions(selectedLanguage);

  function setAudioSample(sampleId: number, audioBlob: Blob | null = null) {
    setVoiceSamples((prev) =>
      prev.map((sample) =>
        sample.id === sampleId ? { ...sample, audioBlob } : sample
      )
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

    const recordedSamples = voiceSamples.filter(
      (sample) => sample.audioBlob !== null
    );

    if (recordedSamples.length !== NUM_SAMPLES) {
      toast.info(
        `Please record all ${NUM_SAMPLES} voice samples before enrolling the speaker.`
      );
      return;
    }

    // Convert audio blobs to files for the API
    const files = recordedSamples.map((sample, index) => {
      return new File([sample.audioBlob!], `voice_sample_${index + 1}.wav`, {
        type: "audio/wav",
      });
    });

    enrollSpeaker(library.id, trimmedName, files as unknown as string[], {
      onSuccess: () => {
        setSpeakerName("");
        navigate(`/library/${library.id}/identify-speaker`);
        toast.success(
          <>
            Speaker <i>{trimmedName}</i> enrolled successfully!
          </>
        );
      },
      onError: (error) => {
        console.error("Failed to enroll speaker:", error);
        toast.error(
          <>
            Failed to enroll speaker <i>{speakerName}</i>. Please try again.
          </>
        );
      },
    });
  }

  return (
    <>
      <Header>
        <HeaderTitle>Enroll a speaker</HeaderTitle>
      </Header>

      <Body>
        <BodySection>
          <Label htmlFor="speakerName">Speaker Name</Label>
          <Input
            id="speakerName"
            type="text"
            placeholder="Enter speaker's name..."
            className="mt-2"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            required
          />
        </BodySection>

        <BodySection className="items-end">
          <Select
            onValueChange={(value) =>
              setSelectedLanguage(value as LanguageCode)
            }
            defaultValue={selectedLanguage}
          >
            <SelectTrigger className="">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map(({ code, displayName }) => (
                <SelectItem key={code} value={code}>
                  <ReactCountryFlag countryCode={code.split("_")[1]!} svg />
                  {displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BodySection>

        {voiceSamples.map((sample, index) => (
          <BodySection key={sample.id} className="gap-2">
            <Label className="justify-center">Sample #{index + 1}</Label>
            <p className="italic text-sm">{scripts[index]}</p>
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
            disabled={isPending || !speakerName.trim()}
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
