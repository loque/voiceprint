import { useParams } from "react-router";
import { useLibraries } from "./use-libraries";
import type { Library } from "../api/api";

export function useLibrary(): Library | undefined {
  const libraryId = useParams().libraryId;
  const { libraries } = useLibraries();
  const library = libraries.find((lib) => lib.id === libraryId);
  return library;
}
