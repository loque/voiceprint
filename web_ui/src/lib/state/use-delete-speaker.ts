import { useContext } from "react";
import { Api } from "../api/api";
import { VoiceprintContext } from "./voiceprint-context";

export function useDeleteSpeaker() {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useDeleteSpeaker must be used within a VoiceprintProvider"
    );
  }

  const { updateLibrary } = context;

  const { mutate, isPending, isError, error } = Api.useMutation(
    "delete",
    "/libraries/{library_id}/speakers/{speaker_id}"
  );

  function deleteSpeaker(
    libraryId: string,
    speakerId: string,
    { onSuccess, ...options }: Parameters<typeof mutate>[1] = {}
  ) {
    mutate(
      {
        params: {
          path: {
            library_id: libraryId,
            speaker_id: speakerId,
          },
        },
      },
      {
        ...options,
        onSuccess: (data, ...args) => {
          if (data) {
            updateLibrary(libraryId, (lib) => {
              return {
                ...lib,
                speakers: lib.speakers.filter(
                  (speaker) => speaker.id !== speakerId
                ),
              };
            });
          }
          onSuccess?.(data, ...args);
        },
      }
    );
  }

  return {
    deleteSpeaker,
    isPending,
    isError,
    error,
  };
}
