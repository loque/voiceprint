import { useContext } from "react";
import { Api } from "../api/api";
import { VoiceprintContext } from "./voiceprint-context";

export function useIdentifySpeaker() {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useIdentifySpeaker must be used within a VoiceprintProvider"
    );
  }

  const { mutate, isPending, isError, error, reset, data } = Api.useMutation(
    "post",
    "/libraries/{library_id}/identify"
  );

  function identifySpeaker(
    libraryId: string,
    audioFile: string,
    { onSuccess, ...options }: Parameters<typeof mutate>[1] = {}
  ) {
    const formData = new FormData();
    formData.append("audio_file", audioFile);
    mutate(
      {
        params: {
          path: { library_id: libraryId },
        },
        // @ts-expect-error - body is FormData - TODO: find a better way to type files
        body: formData,
      },
      {
        ...options,
        onSuccess: (data, ...args) => {
          onSuccess?.(data, ...args);
        },
      }
    );
  }

  return {
    identifySpeaker,
    isPending,
    isError,
    error,
    reset,
    speaker: data?.speaker,
  };
}
