import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
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

  const { identifySpeaker, isError, speaker, reset } = useIdentifySpeaker();

  function handleIdentify(audioBlob: Blob) {
    if (!library) {
      toast.error("No library selected. Please select a library first.");
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
                if (audioBlob) {
                  handleIdentify(audioBlob);
                } else {
                  reset();
                }
              }}
              className="w-full"
            />
          </AudioRecorder>
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
