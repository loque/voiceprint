import { useContext } from "react";
import { Api } from "../api/api";
import { VoiceprintContext } from "./voiceprint-context";

export function useCreateLibrary() {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useCreateLibrary must be used within a VoiceprintProvider"
    );
  }

  const { addLibrary } = context;

  const { mutate, isPending, isError, error } = Api.useMutation(
    "post",
    "/libraries",
    {
      onSuccess: (data) => {
        if (data) {
          addLibrary(data);
        }
      },
    }
  );

  function createLibrary(name: string, options?: Parameters<typeof mutate>[1]) {
    mutate(
      {
        params: { query: { name } },
      },
      options
    );
  }

  return {
    createLibrary,
    isPending,
    isError,
    error,
  };
}
