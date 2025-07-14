import { Button } from "@/components/ui/button";
import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
import { useState } from "react";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { toast } from "sonner";
import { Api } from "@/lib/api/api";
import { Header, HeaderTitle } from "@/components/ui/header";
import { Body, BodySection } from "@/components/ui/body";
import { useLibrary } from "@/lib/state/use-library";

export function IdentifySpeaker() {
  const library = useLibrary();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const identify = Api.useMutation("post", "/libraries/{library_id}/identify", {
    onError: (error) => {
      console.error("Identification failed:", error);
      toast.error("Failed to identify speaker. Please try again.");
    },
  });

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

    identify.mutate({
      params: { path: { library_id: library.id } },
      body: {
        // TODO: find a better way to do this
        audio_file: audioFile as unknown as string,
      },
    });
  }

  return (
    <>
      <Header>
        <HeaderTitle>Record audio to identify who's speaking</HeaderTitle>
      </Header>

      <Body>
        <BodySection>
          <AudioRecorder>
            <VoiceSampleRecorder
              onChange={(audioBlob) => {
                setAudioBlob(audioBlob);
                identify.reset();
              }}
              className="w-full"
            />
          </AudioRecorder>
        </BodySection>

        <BodySection>
          <Button
            onClick={handleIdentify}
            disabled={!audioBlob || identify.isPending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {identify.isPending ? "Identifying..." : "Identify Speaker"}
          </Button>
        </BodySection>

        {identify.data && (
          <BodySection className="bg-green-800">
            <h3 className="text-lg font-semibold text-green-100 mb-2">
              Identification Complete
            </h3>
            <p className="text-green-200">
              Speaker identified as:{" "}
              <strong>{identify.data.speaker?.name}</strong>
            </p>
            {identify.data.speaker?.id && (
              <p className="text-green-300 text-sm mt-1">
                ID: {identify.data.speaker?.id}
              </p>
            )}
          </BodySection>
        )}

        {identify.isError && (
          <BodySection className="bg-red-800">
            <h3 className="text-lg font-semibold text-red-100 mb-2">
              Identification Failed
            </h3>
            <p className="text-red-200">
              Could not identify the speaker. Please try again with a clearer
              audio sample.
            </p>
          </BodySection>
        )}
      </Body>
    </>
  );
}
