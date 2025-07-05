import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { useIdentifySpeaker } from "@/lib/api/hooks";
import { VoiceSampleRecorder } from "@/components/ui/voice-sample-recorder";
import { useState } from "react";
import { AudioRecorder } from "@/components/recorder/audio-recorder-context";
import { toast } from "sonner";

export function IdentifySpeakerTab() {
  const identify = useIdentifySpeaker();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  console.debug(">>> result", identify.data);

  function handleIdentify() {
    if (!audioBlob) {
      toast.error("Please record audio before identifying the speaker.");
      return;
    }

    const audioFile = new File([audioBlob], "audio_sample.wav", {
      type: "audio/wav",
    });

    identify.mutate(audioFile, {
      onError: (error) => {
        console.error("Identification failed:", error);
        toast.error("Failed to identify speaker. Please try again.");
      },
    });
  }

  return (
    <TabsContent value="identify" className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Record audio to identify who's speaking
        </h2>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <AudioRecorder>
            <VoiceSampleRecorder
              onChange={(audioBlob) => {
                setAudioBlob(audioBlob);
                identify.reset();
              }}
              className="w-full"
            />
          </AudioRecorder>
        </div>

        <Button
          onClick={handleIdentify}
          disabled={!audioBlob || identify.isPending}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {identify.isPending ? "Identifying..." : "Identify Speaker"}
        </Button>

        {identify.data && (
          <div className="mt-4 p-4 bg-green-800 rounded-lg">
            <h3 className="text-lg font-semibold text-green-100 mb-2">
              Identification Complete
            </h3>
            <p className="text-green-200">
              Speaker identified as: <strong>{identify.data}</strong>
            </p>
          </div>
        )}

        {identify.isError && (
          <div className="mt-4 p-4 bg-red-800 rounded-lg">
            <h3 className="text-lg font-semibold text-red-100 mb-2">
              Identification Failed
            </h3>
            <p className="text-red-200">
              Could not identify the speaker. Please try again with a clearer
              audio sample.
            </p>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
