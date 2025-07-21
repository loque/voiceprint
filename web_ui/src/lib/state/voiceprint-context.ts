import { createContext } from "react";
import type { Library } from "../api/api";
import type {
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";

export interface VoiceprintContextValue {
  libraries: Library[];
  isFetching: boolean;
  isFetched: boolean;
  error: Error | null;
  fetchLibraries: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<Library[], Error>>;
  addLibrary: (library: Library) => void;
  updateLibrary: (
    id: string,
    libraryUpdater: (lib: Library) => Library
  ) => void;
  removeLibrary: (id: string) => void;
}

export const VoiceprintContext = createContext<
  VoiceprintContextValue | undefined
>(undefined);
