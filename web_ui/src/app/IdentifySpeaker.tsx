import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { toast } from "sonner";
import { Header, HeaderTitle } from "@/components/ui/header";
import {
  Body,
  BodySection,
  BodySectionContent,
  BodySectionHeader,
} from "@/components/ui/body";
import { useCurrentLibrary } from "@/lib/state/use-current-library";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { useIdentifySpeaker } from "@/lib/state/use-identify-speaker";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export function IdentifySpeaker() {
  const library = useCurrentLibrary();

  const { identifySpeaker, isError, speakers, reset } = useIdentifySpeaker();

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

        {speakers.length > 0 && (
          <BodySection>
            <BodySectionHeader>
              <CheckCircle2Icon />
              Speaker identification results
            </BodySectionHeader>
            <BodySectionContent>
              <Table
                containerClassName="flex justify-center"
                className="max-w-xl"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Similarity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {speakers.map((speaker, index) => (
                    <TableRow
                      key={speaker.id}
                      className={
                        index === 0
                          ? "text-success bg-success/10 hover:bg-success/20"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        {speaker.id}
                      </TableCell>
                      <TableCell>{speaker.name}</TableCell>
                      <TableCell className="text-right">
                        {speaker.similarity.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </BodySectionContent>
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
