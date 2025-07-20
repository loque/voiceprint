import { Button } from "@/components/ui/button";
import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
import { useState } from "react";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { toast } from "sonner";
import { Header, HeaderTitle } from "@/components/ui/header";
import { Body, BodySection } from "@/components/ui/body";
import { useCurrentLibrary } from "@/lib/state/use-current-library";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { useIdentifySpeaker } from "@/lib/state/use-identify-speaker";

export function IdentifySpeaker() {
  const library = useCurrentLibrary();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const { identifySpeaker, isPending, isError, reset, speaker } =
    useIdentifySpeaker();

  function handleIdentify() {
    if (!library) {
      toast.error("No library selected. Please select a library first.");
      return;
    }

    if (!audioBlob) {
      toast.error("Please record audio before identifying the speaker.");
      return;
    }

    const audioFile = new File([audioBlob], "audio_sample.wav", {
      type: "audio/wav",
    });

    identifySpeaker(
      library.id,
      audioFile as unknown as string // TODO: find a better way to type files
    );
  }

  return (
    <>
      <Header>
        <HeaderTitle>Identify a speaker</HeaderTitle>
      </Header>

      <Body>
        <BodySection>
          <AudioRecorder>
            <VoiceSampleRecorder
              onChange={(audioBlob) => {
                setAudioBlob(audioBlob);
                reset();
              }}
              className="w-full"
            />
          </AudioRecorder>
        </BodySection>

        <BodySection>
          <Button
            onClick={handleIdentify}
            disabled={!audioBlob || isPending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isPending ? "Identifying..." : "Identify Speaker"}
          </Button>
        </BodySection>

        {speaker && (
          <BodySection>
            <Alert className="text-success bg-success/10 border-success/30">
              <CheckCircle2Icon />
              <AlertTitle>Speaker Identified</AlertTitle>
              <AlertDescription>
                <p>
                  <strong>{speaker?.name}</strong>
                </p>
                {speaker?.id && <p className=" text-sm ">ID: {speaker?.id}</p>}
              </AlertDescription>
            </Alert>
          </BodySection>
        )}

        {isError && (
          <BodySection>
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Identification Failed.</AlertTitle>
              <AlertDescription>
                Could not identify the speaker. Please try again with a clearer
                audio sample.
              </AlertDescription>
            </Alert>
          </BodySection>
        )}
      </Body>
    </>
  );
}
