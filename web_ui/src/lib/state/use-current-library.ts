import { useParams } from "react-router";
import { useGetLibraries } from "./use-get-libraries";
import type { Library } from "../api/api";

export function useCurrentLibrary(): Library | undefined {
  const libraryId = useParams().libraryId;
  const { libraries } = useGetLibraries();
  const library = libraries.find((lib) => lib.id === libraryId);
  return library;
}
