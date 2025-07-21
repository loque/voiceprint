import { useContext } from "react";
import { Api } from "../api/api";
import { VoiceprintContext } from "./voiceprint-context";

export function useEnrollSpeaker() {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useEnrollSpeaker must be used within a VoiceprintProvider"
    );
  }

  const { updateLibrary } = context;

  const { mutate, isPending, isError, error } = Api.useMutation(
    "post",
    "/libraries/{library_id}/speakers"
  );

  function enrollSpeaker(
    libraryId: string,
    speakerName: string,
    audioFiles: string[],
    { onSuccess, ...options }: Parameters<typeof mutate>[1] = {}
  ) {
    const formData = new FormData();
    audioFiles.forEach((file) => {
      formData.append("audio_files", file);
    });
    mutate(
      {
        params: {
          path: { library_id: libraryId },
          query: { name: speakerName },
        },
        // @ts-expect-error - body is FormData - TODO: find a better way to type files
        body: formData,
      },
      {
        ...options,
        onSuccess: (data, ...args) => {
          if (data) {
            updateLibrary(libraryId, (lib) => {
              return {
                ...lib,
                speakers: [...(lib.speakers || []), data],
              };
            });
          }
          onSuccess?.(data, ...args);
        },
      }
    );
  }

  return {
    enrollSpeaker,
    isPending,
    isError,
    error,
  };
}
