import { useState, useCallback, type ReactNode, useEffect } from "react";
import { Api, type Library } from "../api/api";
import {
  VoiceprintContext,
  type VoiceprintContextValue,
} from "./voiceprint-context";

interface LibrariesProviderProps {
  children: ReactNode;
}

export function VoiceprintProvider({ children }: LibrariesProviderProps) {
  const [libraries, setLibraries] = useState<Library[]>([]);

  const {
    refetch: fetchLibraries,
    error,
    isSuccess,
    data,
    isFetching,
    isFetched,
  } = Api.useQuery("get", "/libraries", { enabled: false });

  useEffect(() => {
    if (isSuccess && !isFetching && data) {
      setLibraries(data);
    }
  }, [isSuccess, isFetching, data]);

  const addLibrary = useCallback((library: Library) => {
    setLibraries((prev) => [...prev, library]);
  }, []);

  const updateLibrary = useCallback(
    (id: string, libraryUpdater: (lib: Library) => Library) => {
      setLibraries((state) =>
        state.map((lib) =>
          lib.id === id && typeof libraryUpdater === "function"
            ? libraryUpdater(lib)
            : lib
        )
      );
    },
    []
  );

  const removeLibrary = useCallback((id: string) => {
    setLibraries((prev) => prev.filter((lib) => lib.id !== id));
  }, []);

  const value: VoiceprintContextValue = {
    libraries,
    isFetching,
    isFetched,
    error,
    fetchLibraries,
    addLibrary,
    updateLibrary,
    removeLibrary,
  };

  return (
    <VoiceprintContext.Provider value={value}>
      {children}
    </VoiceprintContext.Provider>
  );
}
