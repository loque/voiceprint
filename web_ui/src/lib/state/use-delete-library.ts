import { useContext } from "react";
import { Api } from "../api/api";
import { VoiceprintContext } from "./voiceprint-context";

export function useDeleteLibrary() {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useDeleteLibrary must be used within a VoiceprintProvider"
    );
  }

  const { removeLibrary } = context;

  const { mutate, isPending, isError, error } = Api.useMutation(
    "delete",
    "/libraries/{library_id}"
  );

  function deleteLibrary(
    libraryId: string,
    { onSuccess, ...options }: Parameters<typeof mutate>[1] = {}
  ) {
    mutate(
      {
        params: {
          path: {
            library_id: libraryId,
          },
        },
      },
      {
        ...options,
        onSuccess: (data, ...args) => {
          if (data) {
            removeLibrary(libraryId);
          }
          onSuccess?.(data, ...args);
        },
      }
    );
  }

  return {
    deleteLibrary,
    isPending,
    isError,
    error,
  };
}
