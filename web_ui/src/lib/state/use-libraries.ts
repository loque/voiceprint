import { useContext, useEffect } from "react";
import { VoiceprintContext } from "./voiceprint-context";
import type { Library } from "../api/api";

type UseLibrariesReturn = {
  libraries: Library[];
  isFetching: boolean;
};

export function useLibraries(): UseLibrariesReturn {
  const context = useContext(VoiceprintContext);
  if (context === undefined) {
    throw new Error("useLibraries must be used within a VoiceprintProvider");
  }

  const { isFetched, isFetching, fetchLibraries, libraries } = context;

  useEffect(() => {
    // Only fetch if not already fetched and not currently loading
    if (!isFetched && !isFetching) {
      fetchLibraries();
    }
  }, [isFetched, isFetching, fetchLibraries]);

  return { libraries, isFetching };
}
