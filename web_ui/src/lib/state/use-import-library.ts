import { useContext } from "react";
import { Api } from "../api/api";
import { VoiceprintContext } from "./voiceprint-context";

export function useImportLibrary() {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error(
      "useImportLibrary must be used within a VoiceprintProvider"
    );
  }

  const { addLibrary } = context;

  const { mutate, isPending, isError, error } = Api.useMutation(
    "post",
    "/libraries/import",
    {
      onSuccess: (data) => {
        if (data) {
          addLibrary(data);
        }
      },
    }
  );

  function importLibrary(file: File, options?: Parameters<typeof mutate>[1]) {
    const formData = new FormData();
    formData.append("lib_file", file);

    mutate(
      {
        // @ts-expect-error - body is FormData - TODO: find a better way to type files
        body: formData,
      },
      options
    );
  }

  return {
    importLibrary,
    isPending,
    isError,
    error,
  };
}
